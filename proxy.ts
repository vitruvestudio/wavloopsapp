/**
 * Wavloops V3 — Proxy (formerly known as Middleware in Next.js ≤ 15).
 *
 * Runs on every navigation matched by `config.matcher`. Two
 * responsibilities:
 *
 *   1. Refresh the Supabase session cookies. Without this, expired
 *      tokens pile up and the user gets silently logged out across
 *      tabs.
 *
 *   2. Optimistic route protection. Two surfaces, two flows:
 *
 *      Producer surface (email + password)
 *        - Anon → producer (app) route → redirect to /auth
 *        - Auth → /auth                → redirect to /dashboard
 *
 *      Artist surface (passwordless magic link)
 *        - Anon → /listen/*    → redirect to /auth/magic?next=…
 *        - Auth → /auth/magic  → redirect to /listen
 *
 *      /auth/callback is excluded — the route handler needs to run
 *      with whatever auth state the user is currently in so it can
 *      exchange the OTP code into a session.
 *
 *      The check stays "optimistic" — server components keep their
 *      own getUser() guards (defense in depth). The proxy only
 *      saves a wasted render when the answer is obvious from the
 *      cookies.
 *
 * Cookie pattern uses the `getAll` / `setAll` API (the deprecated
 * `get`/`set`/`remove` triplet was removed in @supabase/ssr 0.6+).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/library",
  "/contacts",
  "/settings",
  "/servers",
  "/beats",
  "/onboarding",
];

export async function proxy(request: NextRequest) {
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
          // Mutate the request so downstream handlers see the fresh cookies,
          // then re-create the response so we can set them on the way out.
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

  // CRITICAL: this call is what refreshes the session. Don't remove it
  // even if you don't use the return value.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProducerAuthRoute = pathname === "/auth";
  const isArtistAuthRoute = pathname === "/auth/magic";
  const isAppRoute = APP_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isArtistRoute =
    pathname === "/listen" || pathname.startsWith("/listen/");

  // ── Anon gates ────────────────────────────────────────────
  // Anon → producer app route ⇒ kick to /auth.
  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }
  // Anon → artist route ⇒ kick to /auth/magic. Carry the original
  // path + query as `next` so the callback can land them back where
  // they tried to go.
  if (!user && isArtistRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/magic";
    url.search = "";
    url.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  // ── Logged-in gates ──────────────────────────────────────
  // Logged-in → /auth (producer login) ⇒ /dashboard.
  if (user && isProducerAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  // Logged-in → /auth/magic (artist login) ⇒ /listen.
  // /auth/callback is intentionally NOT gated — that route runs the
  // OTP exchange and may not yet have a session at entry time.
  if (user && isArtistAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/listen";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     *   - _next/static    (built static assets)
     *   - _next/image     (image optimizer)
     *   - favicon.ico, robots.txt, sitemap.xml
     *   - /Photos/*       (public images we ship in /public)
     *   - any path with a file extension (.svg, .png, .css, .js, …)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|Photos|.*\\..*).*)",
  ],
};
