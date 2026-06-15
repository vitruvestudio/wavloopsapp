/**
 * Contacts page server actions.
 *
 * - `addContactAction` — UPSERT a contact at the producer level
 *   (UNIQUE owner_id, email), then attach to any chosen servers via
 *   `server_contacts`. Idempotent: re-saving the same email refreshes
 *   the optional fields and silently merges new server memberships.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* ================================================================
   fetchOgImageAction — given a public social URL, returns the
   `og:image` URL the page advertises. Used by the Add Contact
   modal's "paste a social link" auto-fill to grab the contact's
   profile photo when unavatar.io doesn't cover the platform
   (Instagram now requires a paid plan there).

   Runs server-side so CORS isn't an issue. We fake a desktop
   Safari User-Agent because some sites (Instagram especially)
   serve a stripped-down "you're a bot" shell to plain Node
   fetches.

   Failure modes — all gracefully return { url: null }:
     - Network error / timeout
     - 4xx / 5xx response
     - HTML doesn't expose an og:image meta tag
     - Site IP-bans data-center egress (Vercel/Supabase regions
       sometimes get this from Instagram in prod — works fine
       from a residential dev laptop)

   The returned URL is rendered directly via <img src> in the
   client. Some platforms (IG especially) serve CDN URLs with
   signed expiration tokens — we accept that and fall back to the
   gradient + initials when the image eventually 403s.
   ================================================================ */
export interface OgImageResult {
  url: string | null;
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export async function fetchOgImageAction(
  targetUrl: string,
): Promise<OgImageResult> {
  if (!targetUrl) return { url: null };
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { url: null };
    const html = await res.text();

    // og:image — match either property/content or content/property order.
    const matchA = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );
    const matchB = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );
    const raw = matchA?.[1] ?? matchB?.[1];
    if (!raw) return { url: null };

    let imgUrl = raw.trim();
    // Decode common HTML entities used in meta content.
    imgUrl = imgUrl
      .replace(/&amp;/g, "&")
      .replace(/&#x2F;/g, "/")
      .replace(/&#47;/g, "/");
    // Protocol-relative → https.
    if (imgUrl.startsWith("//")) imgUrl = `https:${imgUrl}`;

    return { url: imgUrl };
  } catch {
    return { url: null };
  }
}

export interface AddContactPayload {
  name: string | null;
  email: string;
  phone: string | null;
  /** Professional roles — "Producer", "Beatmaker", "Artist", etc.
   *  Free-form so producers can add custom labels via TagInput. */
  roles: string[];
  /** { instagram: "@kayde", x: "@kayde", … } — only non-empty
   *  values are persisted. */
  socials: Record<string, string>;
  /** Public avatar URL (usually from unavatar.io). Persisted as-is;
   *  the contact list <img src> renders it directly. */
  avatar_url: string | null;
  /** Server ids to attach the contact to. Empty = address-book-only. */
  server_ids: string[];
}

export interface AddContactResult {
  error: string | null;
  contactId: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addContactAction(
  payload: AddContactPayload,
): Promise<AddContactResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in.", contactId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile)
    return {
      error: "Your producer profile isn't set up yet. Finish onboarding first.",
      contactId: null,
    };

  const email = payload.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Enter a valid email address.", contactId: null };
  }

  // Drop empty socials so we don't store noise.
  const cleanSocials: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload.socials)) {
    const trimmed = v.trim();
    if (trimmed) cleanSocials[k] = trimmed;
  }

  // UPSERT — re-saving the same (owner_id, email) refreshes the
  // optional fields. Conflict resolution targets the unique index.
  const cleanRoles = payload.roles
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  const { data: contact, error } = await supabase
    .from("contacts")
    .upsert(
      {
        owner_id: profile.id,
        email,
        name: payload.name?.trim() || null,
        phone: payload.phone?.trim() || null,
        roles: cleanRoles,
        socials: cleanSocials,
        avatar_url: payload.avatar_url?.trim() || null,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,email" },
    )
    .select("id")
    .single();

  if (error || !contact) {
    return {
      error: error?.message ?? "Could not save the contact.",
      contactId: null,
    };
  }

  // Attach to servers — ON CONFLICT DO NOTHING so re-saving an
  // existing (server, contact) pair is a no-op rather than an error.
  if (payload.server_ids.length > 0) {
    const rows = payload.server_ids.map((sid) => ({
      server_id: sid,
      contact_id: contact.id,
    }));
    const { error: pivotErr } = await supabase
      .from("server_contacts")
      .upsert(rows, { onConflict: "server_id,contact_id", ignoreDuplicates: true });
    if (pivotErr) {
      return {
        error: `Contact saved but couldn't attach to servers: ${pivotErr.message}`,
        contactId: contact.id,
      };
    }
  }

  revalidatePath("/contacts", "page");
  revalidatePath("/dashboard", "page");
  return { error: null, contactId: contact.id };
}
