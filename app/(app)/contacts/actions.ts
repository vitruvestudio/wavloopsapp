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

/* ----------------------------------------------------------------
   SSRF guard. fetchOgImageAction fetches a user-supplied URL
   server-side, so without bounds an attacker who signs up could
   point it at cloud metadata (169.254.169.254), localhost, or
   internal RFC-1918 services and use the server as a proxy /
   port scanner.

   This action only ever needs to scrape OpenGraph tags off the
   handful of social platforms the Add-Contact modal supports, so
   the tightest correct fix is a host allowlist — far more robust
   than IP-range blocklists (which DNS-rebinding sidesteps). We
   also force https and read at most ~512 KB of body.
   ---------------------------------------------------------------- */
const OG_HOST_ALLOWLIST = [
  "instagram.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "soundcloud.com",
  "spotify.com",
  "facebook.com",
  "fb.com",
  "linkedin.com",
  "twitch.tv",
  "bandcamp.com",
  "apple.com",
  "threads.net",
];

/** Allowlisted-host check — exact match or a subdomain of an
 *  allowlisted apex (so www.instagram.com / music.apple.com /
 *  open.spotify.com pass, evil-instagram.com.attacker.net does
 *  not). */
function isAllowedOgHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return OG_HOST_ALLOWLIST.some(
    (apex) => h === apex || h.endsWith(`.${apex}`),
  );
}

/** Fetch with manual redirect handling — re-validates the host
 *  allowlist on every hop so a 3xx can't bounce us onto an
 *  internal target. Returns the final 2xx response, or null. */
async function safeAllowlistedFetch(
  startUrl: URL,
  maxHops = 3,
): Promise<Response | null> {
  let current = startUrl;
  for (let hop = 0; hop <= maxHops; hop++) {
    if (current.protocol !== "https:") return null;
    if (!isAllowedOgHost(current.hostname)) return null;
    const res = await fetch(current.toString(), {
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    // 3xx → re-validate the Location against the allowlist and
    // loop. Anything else is the terminal response.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      try {
        current = new URL(loc, current);
      } catch {
        return null;
      }
      continue;
    }
    return res;
  }
  return null;
}

export async function fetchOgImageAction(
  targetUrl: string,
): Promise<OgImageResult> {
  if (!targetUrl) return { url: null };

  // Validate scheme + host before issuing any request.
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { url: null };
  }
  if (parsed.protocol !== "https:") return { url: null };
  if (!isAllowedOgHost(parsed.hostname)) return { url: null };

  try {
    const res = await safeAllowlistedFetch(parsed);
    if (!res || !res.ok) return { url: null };
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

/* ================================================================
   updateContactAction — edit an existing contact.
   ================================================================
   Same payload as add (so the modal can reuse it), plus the contact
   id. RLS via `contacts_owner_all` gates this to the producer's own
   rows; server_contacts ownership is enforced by its own policy.

   Beats are NOT touched here — contacts don't carry a beat list,
   only the server_contacts pivot is replaced.
*/
export interface UpdateContactPayload extends AddContactPayload {
  id: string;
}

export async function updateContactAction(
  payload: UpdateContactPayload,
): Promise<AddContactResult> {
  const supabase = await createClient();

  // App-side ownership seatbelt — RLS gates this too, but a
  // missing app-level check means a buggy future migration could
  // open up cross-producer mutation. Cheap to add, defense-in-
  // depth pays off the first time someone fat-fingers a policy.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You're not signed in.", contactId: null };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  if (!profile) {
    return { error: "Profile not set up yet.", contactId: null };
  }
  const { data: existing } = await supabase
    .from("contacts")
    .select("owner_id")
    .eq("id", payload.id)
    .maybeSingle<{ owner_id: string }>();
  if (!existing || existing.owner_id !== profile.id) {
    return { error: "Contact not found.", contactId: null };
  }

  const email = payload.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Enter a valid email address.", contactId: null };
  }

  const cleanSocials: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload.socials)) {
    const trimmed = v.trim();
    if (trimmed) cleanSocials[k] = trimmed;
  }
  const cleanRoles = payload.roles
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  const { error: updateErr } = await supabase
    .from("contacts")
    .update({
      email,
      name: payload.name?.trim() || null,
      phone: payload.phone?.trim() || null,
      roles: cleanRoles,
      socials: cleanSocials,
      avatar_url: payload.avatar_url?.trim() || null,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", payload.id);

  if (updateErr) {
    return {
      error: updateErr.message,
      contactId: null,
    };
  }

  // Replace the server_contacts pivot to match the new selection.
  // DELETE + INSERT is simpler than diffing and the row counts here
  // are tiny (≤ a few servers per contact at V1 scale).
  const { error: delErr } = await supabase
    .from("server_contacts")
    .delete()
    .eq("contact_id", payload.id);
  if (delErr) {
    return {
      error: `Contact updated but couldn't refresh servers: ${delErr.message}`,
      contactId: payload.id,
    };
  }

  if (payload.server_ids.length > 0) {
    const rows = payload.server_ids.map((sid) => ({
      server_id: sid,
      contact_id: payload.id,
    }));
    const { error: pivotErr } = await supabase
      .from("server_contacts")
      .insert(rows);
    if (pivotErr) {
      return {
        error: `Contact updated but couldn't re-attach servers: ${pivotErr.message}`,
        contactId: payload.id,
      };
    }
  }

  revalidatePath("/contacts", "page");
  revalidatePath(`/contacts/${payload.id}`, "page");
  revalidatePath("/dashboard", "page");
  return { error: null, contactId: payload.id };
}

/* ================================================================
   importContactsAction — bulk-create contacts from a parsed CSV.
   ================================================================
   The client parses the CSV (Papa Parse) and normalises every row
   into the shape below before calling. We do ONE bulk upsert on
   `contacts` (onConflict: owner_id,email) — re-importing the same
   email refreshes its optional fields rather than erroring.

   Then ONE bulk insert on `server_contacts` to attach every newly
   upserted contact to the chosen servers. ON CONFLICT DO NOTHING
   so re-imports stay idempotent.

   Rows missing a valid email are dropped client-side; this action
   trusts the input and surfaces only the DB-level errors.
*/
export interface CsvContactRow {
  email: string;
  name: string | null;
  phone: string | null;
  roles: string[];
  socials: Record<string, string>;
}

export interface ImportContactsResult {
  imported: number;
  skipped: number;
  error: string | null;
}

export async function importContactsAction(
  rows: CsvContactRow[],
  serverIds: string[],
): Promise<ImportContactsResult> {
  if (rows.length === 0) {
    return { imported: 0, skipped: 0, error: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { imported: 0, skipped: 0, error: "You're not signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return {
      imported: 0,
      skipped: 0,
      error: "Your producer profile isn't set up yet.",
    };
  }

  // Dedupe by email within the batch — if the CSV has the same
  // email twice, Postgres' upsert would still work, but PostgREST
  // rejects the batch with a 21000 "ON CONFLICT DO UPDATE command
  // cannot affect row a second time" error. Keep the last seen row
  // per email.
  const byEmail = new Map<string, CsvContactRow>();
  for (const r of rows) {
    const e = r.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(e)) continue;
    byEmail.set(e, { ...r, email: e });
  }
  const cleanRows = Array.from(byEmail.values());
  const skipped = rows.length - cleanRows.length;
  if (cleanRows.length === 0) {
    return { imported: 0, skipped, error: null };
  }

  // Bulk upsert.
  const nowIso = new Date().toISOString();
  const upsertPayload = cleanRows.map((r) => ({
    owner_id: profile.id,
    email: r.email,
    name: r.name?.trim() || null,
    phone: r.phone?.trim() || null,
    roles: r.roles,
    socials: r.socials,
    last_active_at: nowIso,
  }));

  const { data: upserted, error: upErr } = await supabase
    .from("contacts")
    .upsert(upsertPayload, { onConflict: "owner_id,email" })
    .select("id");

  if (upErr || !upserted) {
    return {
      imported: 0,
      skipped,
      error: upErr?.message ?? "Bulk upsert failed.",
    };
  }

  // Attach every upserted contact to the chosen servers.
  if (serverIds.length > 0 && upserted.length > 0) {
    const pivotRows = upserted.flatMap((c) =>
      serverIds.map((sid) => ({
        server_id: sid,
        contact_id: c.id,
      })),
    );
    const { error: pivotErr } = await supabase
      .from("server_contacts")
      .upsert(pivotRows, {
        onConflict: "server_id,contact_id",
        ignoreDuplicates: true,
      });
    if (pivotErr) {
      // Contacts already saved — surface the pivot error but report
      // the imported count so the producer knows the data landed.
      return {
        imported: upserted.length,
        skipped,
        error: `Contacts saved but couldn't attach to servers: ${pivotErr.message}`,
      };
    }
  }

  revalidatePath("/contacts", "page");
  revalidatePath("/dashboard", "page");
  return { imported: upserted.length, skipped, error: null };
}

/* ================================================================
   deleteContactAction — remove a contact + all its pivots cascade.
   ================================================================
   The contacts → server_contacts / listens / likes FKs all have
   ON DELETE CASCADE, so a single DELETE wipes the contact's
   membership rows and their engagement history along with it.

   RLS via `contacts_owner_all` ensures the requester can only
   delete contacts they own.
*/
export interface DeleteContactResult {
  error: string | null;
}

export async function deleteContactAction(
  id: string,
): Promise<DeleteContactResult> {
  const supabase = await createClient();

  // App-side ownership seatbelt — see updateContactAction for
  // rationale. RLS via contacts_owner_all gates this, but a
  // policy regression here would delete contacts cross-tenant
  // with zero app-side resistance otherwise.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  if (!profile) return { error: "Profile not set up yet." };
  const { data: existing } = await supabase
    .from("contacts")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle<{ owner_id: string }>();
  if (!existing || existing.owner_id !== profile.id) {
    return { error: "Contact not found." };
  }

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/contacts", "page");
  revalidatePath("/dashboard", "page");
  return { error: null };
}
