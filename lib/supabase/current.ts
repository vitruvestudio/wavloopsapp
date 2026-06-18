/**
 * Per-request memoized auth + profile resolvers.
 *
 * Wavloops V2 producer-side pages all open with the same
 * three-line dance:
 *
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   const { data: profile } = await supabase
 *     .from("profiles")
 *     .select("id")
 *     .eq("user_id", user.id)
 *     .maybeSingle();
 *
 * Each call hits Supabase Auth + Postgres. The shell layout
 * does it once, /dashboard does it again, the page-level guard
 * does it again — three round-trips on a single navigation.
 *
 * React's `cache()` dedupes function calls within a single
 * server render tree, so wrapping the auth + profile lookups
 * here means every consumer in the same request shares the
 * same Promise. Same result on the wire, three calls collapse
 * into one.
 *
 * No persistence beyond the request — the cache is reset on
 * every new navigation, so logging out + back in always picks
 * up the fresh session.
 */

import "server-only";
import { cache } from "react";
import { createClient } from "./server";

/** Cached fetch of the current authenticated Supabase user.
 *  Returns null when there's no session. Same value for every
 *  caller inside one server render. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Cached fetch of the current user's producer profile id.
 *  Returns null when the user is unauth or has no producer
 *  profile (artist-only signups land here too). */
export const getCurrentProducerProfileId = cache(
  async (): Promise<string | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();
    return data?.id ?? null;
  },
);
