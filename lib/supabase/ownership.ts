/**
 * Ownership assertion helpers — defense-in-depth seatbelts on
 * top of RLS for the producer surface's mutating server actions.
 *
 * RLS already gates every write at the DB layer, but a single
 * misconfigured policy in a future migration would unilaterally
 * open up cross-tenant writes. App-side checks make that failure
 * mode much harder to hit: even with broken RLS, the action
 * refuses to mutate anything that doesn't belong to the current
 * producer profile.
 *
 * Each helper resolves the auth user → producer profile → target
 * resource, and returns either `{ profileId }` on success or
 * `{ error }` on any miss. The caller short-circuits with a
 * typed error message before reaching the mutating query.
 *
 * All helpers expect a Supabase client created with
 * `lib/supabase/server.ts → createClient()` (cookie-bound, RLS
 * active). Do NOT pass the admin/service-role client — that
 * would bypass RLS and defeat the purpose.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type OwnershipResult =
  | { profileId: string; error: null }
  | { profileId: null; error: string };

/** Resolve the current user's producer profile id, or return an
 *  error message a server action can surface verbatim. */
export async function getOwnerProfileId(
  supabase: SupabaseClient,
): Promise<OwnershipResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { profileId: null, error: "You're not signed in." };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  if (!profile) {
    return { profileId: null, error: "Profile not set up yet." };
  }
  return { profileId: profile.id, error: null };
}

/** Assert the current producer profile owns the given server.
 *  Used by every action that mutates a server or any of its
 *  pivots (server_beats, server_contacts, server_invites). */
export async function assertServerOwnership(
  supabase: SupabaseClient,
  serverId: string,
): Promise<OwnershipResult> {
  const owner = await getOwnerProfileId(supabase);
  if (owner.error) return owner;
  const { data: server } = await supabase
    .from("servers")
    .select("owner_id")
    .eq("id", serverId)
    .maybeSingle<{ owner_id: string }>();
  if (!server || server.owner_id !== owner.profileId) {
    return { profileId: null, error: "Server not found." };
  }
  return owner;
}
