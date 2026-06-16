/**
 * Supabase session refresh + route gating, run as Next middleware.
 *
 * Two responsibilities:
 *   1. Refresh the auth session cookie on every request so the
 *      session cookie doesn't go stale while the user is browsing.
 *      This is the official Supabase SSR pattern — without it, the
 *      session can lapse mid-session even though the user is active.
 *   2. Redirect unauthenticated visits to artist-only routes
 *      (/listen/*) over to /auth/magic, preserving the original
 *      path in the `next` query param so the post-auth callback
 *      can land the user back where they tried to go.
 *
 * Producer auth (/auth, /dashboard, /library, …) is NOT gated here
 * — the producer surface predates this and its server pages already
 * call `supabase.auth.getUser()` and redirect to /auth on null.
 * Adding a middleware redirect on top would double-redirect; kept
 * out for now.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mutate the request mirror first so subsequent reads see
          // the new values, then re-create the outgoing response and
          // attach them with the original cookie options so the
          // browser stores them correctly.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() goes to the Auth server — guarantees the session is
  // verified, not just claimed via a cookie. Using getSession() here
  // would be cheaper but spoofable.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isArtistRoute = path === "/listen" || path.startsWith("/listen/");
  if (isArtistRoute && !user) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/auth/magic";
    // Wipe any query the artist route carried — we only want `next`.
    dest.search = "";
    dest.searchParams.set(
      "next",
      `${path}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(dest);
  }

  return response;
}
