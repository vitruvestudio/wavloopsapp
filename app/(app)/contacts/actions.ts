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

export interface AddContactPayload {
  name: string | null;
  email: string;
  phone: string | null;
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
  const { data: contact, error } = await supabase
    .from("contacts")
    .upsert(
      {
        owner_id: profile.id,
        email,
        name: payload.name?.trim() || null,
        phone: payload.phone?.trim() || null,
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
