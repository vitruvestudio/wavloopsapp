/**
 * /auth/callback — Supabase magic-link / OAuth exchange endpoint.
 *
 * Supabase embeds this URL in the magic-link email AND in the
 * OAuth redirect (Google). The provider bounces here with a
 * `?code=` parameter. We:
 *
 *   1. Exchange the code for a real session cookie.
 *   2. Run bind_artist_contacts() so the freshly-authed user
 *      immediately sees every producer that already had them on
 *      file as a contact.
 *   3. Read `?next` if the caller passed one (gate flow uses
 *      this to land users on /s/<slug>).
 *   4. Otherwise, route intelligently based on which profiles
 *      the user has:
 *
 *        - Caller passed ?as=artist → /onboarding/artist if no
 *          artist_profiles row, else /listen.
 *        - Caller passed ?as=producer → /onboarding if not yet
 *          onboarded as producer, else /dashboard.
 *        - No `?as` (e.g. returning user) → restore the last
 *          mode from the wlp_last_mode cookie. If absent, pick
 *          producer if they have a profiles row, else artist
 *          if they have artist_profiles, else default to
 *          producer onboarding.
 *
 *   5. Set/update the `wlp_last_mode` cookie based on the route
 *      we ended up taking, so a future login sticks.
 *
 * On failure (missing / invalid code), bounce back to /auth with
 * the role + inline error preserved so the user lands on the
 * email form, not the role chooser.
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LAST_MODE_COOKIE, type LastMode } from "../mode-cookie";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function bounceBack(
  url: URL,
  errorMessage: string,
  role: string | null,
): NextResponse {
  const dest = new URL("/auth", url.origin);
  if (role === "producer" || role === "artist") dest.searchParams.set("as", role);
  dest.searchParams.set("error", errorMessage);
  return NextResponse.redirect(dest);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const explicitNext = url.searchParams.get("next");
  const role = url.searchParams.get("as");

  if (!code) {
    return bounceBack(url, "Missing auth code in callback URL.", role);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return bounceBack(url, error.message, role);
  }

  // Best-effort: link existing contact rows (created by producers
  // OR by the gate's submit_access_request) to the current auth
  // user. Silent on failure — the sign-in itself is what matters;
  // binding can be retried on next sign-in if a transient failure
  // happens here.
  try {
    await supabase.rpc("bind_artist_contacts");
  } catch (e) {
    console.warn("[auth/callback] bind_artist_contacts failed", e);
  }

  // If the caller explicitly told us where to land (gate flow:
  // /s/<slug> or /listen/<slug>), honor that. Profile-aware
  // routing only kicks in when no `next` was provided.
  if (explicitNext) {
    const dest = new URL(explicitNext, url.origin);
    // Best guess on cookie: gate flow is always artist-shaped.
    const res = NextResponse.redirect(dest);
    writeLastModeCookie(res, "artist");
    return res;
  }

  const { destination, mode } = await resolveDestination(supabase, role, url);
  const res = NextResponse.redirect(new URL(destination, url.origin));
  if (mode) writeLastModeCookie(res, mode);
  return res;
}

/** Pick the post-auth destination from the user's profile state.
 *  Returns the path + the mode value to persist as a cookie. */
async function resolveDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: string | null,
  url: URL,
): Promise<{ destination: string; mode: LastMode | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Lost the session mid-flight — bail back to /auth. The hard
  // error path above already covered the common failure modes,
  // so this is purely defensive.
  if (!user) {
    return { destination: "/auth", mode: null };
  }

  const [profileRes, artistRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .maybeSingle<{ onboarded_at: string | null }>(),
    supabase
      .from("artist_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle<{ display_name: string | null }>(),
  ]);
  const hasOnboardedProducer = Boolean(profileRes.data?.onboarded_at);
  const hasArtistRow = Boolean(
    artistRes.data?.display_name &&
      artistRes.data.display_name.trim().length > 0,
  );

  // Role hint from the URL — set when the user picked a card on
  // /auth before requesting the magic-link.
  if (role === "producer") {
    return hasOnboardedProducer
      ? { destination: "/dashboard", mode: "producer" }
      : { destination: "/onboarding", mode: "producer" };
  }
  if (role === "artist") {
    return hasArtistRow
      ? { destination: "/listen", mode: "artist" }
      : { destination: "/onboarding/artist", mode: "artist" };
  }

  // No explicit role — restore the cookie if there is one and
  // the user actually has the corresponding profile.
  const jar = await cookies();
  const lastMode = jar.get(LAST_MODE_COOKIE)?.value as
    | LastMode
    | undefined;
  if (lastMode === "producer" && hasOnboardedProducer) {
    return { destination: "/dashboard", mode: "producer" };
  }
  if (lastMode === "artist" && hasArtistRow) {
    return { destination: "/listen", mode: "artist" };
  }

  // No cookie or stale cookie — fall back to whichever role the
  // user actually has, producer first (the primary product
  // surface). New users with neither profile get sent to the
  // producer onboarding because that's the main intent of
  // /auth direct signups.
  void url;
  if (hasOnboardedProducer) {
    return { destination: "/dashboard", mode: "producer" };
  }
  if (hasArtistRow) {
    return { destination: "/listen", mode: "artist" };
  }
  return { destination: "/onboarding", mode: "producer" };
}

/** Helper to attach the wlp_last_mode cookie to the redirect
 *  response. Kept inline because the callback is the only place
 *  the cookie is set on a redirect (mode-switch actions write
 *  it via the request cookies jar). */
function writeLastModeCookie(res: NextResponse, mode: LastMode) {
  res.cookies.set(LAST_MODE_COOKIE, mode, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
