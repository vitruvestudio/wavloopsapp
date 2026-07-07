/**
 * GET /api/me — identity + plan lookup for client-side analytics.
 *
 * Purpose is narrow: give the PostHog identifier component enough
 * server-verified traits (`is_producer`, `is_artist`, `plan`,
 * `handle`) to call `posthog.identify()` with. Keeping this in a
 * dedicated endpoint means:
 *
 *   - The browser never gets the service-role Supabase client,
 *     and no `subscriptions` row leaks: the plan comes through
 *     the `get_user_plan()` RPC via billing/server.ts.
 *   - The client stays a single small fetch instead of stringing
 *     together three Supabase-JS queries with RLS retries.
 *
 * When there is no session the endpoint returns `{ ok: true,
 * user: null }` with a 200 — analytics can safely fall through
 * to anonymous. Any 4xx/5xx bubbles up as an untracked user
 * which is also fine (identify silently no-ops on the client).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserPlan } from "@/lib/billing/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, user: null });
  }

  // Two independent look-ups: producer profile (owns servers +
  // beats) and artist_profile (invited artist surface). A given
  // Supabase user can be either, both, or neither — the callback
  // sets the wlp_last_mode cookie to pick a side for routing,
  // but for PostHog we just report both flags and let the
  // dashboards cohort by their combination.
  const [profileRes, artistRes, plan] = await Promise.all([
    supabase
      .from("profiles")
      .select("handle")
      .eq("user_id", user.id)
      .maybeSingle<{ handle: string | null }>(),
    supabase
      .from("artist_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle<{ user_id: string }>(),
    getCurrentUserPlan(),
  ]);

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      is_producer: profileRes.data != null,
      is_artist: artistRes.data != null,
      plan,
      handle: profileRes.data?.handle ?? null,
    },
  });
}
