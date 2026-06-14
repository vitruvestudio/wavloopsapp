/**
 * Wavloops V3 — Proxy (formerly known as Middleware in Next.js ≤ 15).
 *
 * Runs on every navigation matched by `config.matcher`. Two responsibilities:
 *
 *   1. Refresh the Supabase session cookies. Without this, expired tokens
 *      pile up and the user gets silently logged out across tabs.
 *
 *   2. Optimistic route protection:
 *        - Anonymous user hitting an `(app)` route → redirect to /auth
 *        - Authenticated user hitting /auth         → redirect to /dashboard
 *
 *      This is "optimistic" — the source-of-truth check still lives in the
 *      server components themselves (defense in depth). The proxy only
 *      saves a wasted render when the answer is obvious from the cookies.
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
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");
  const isAppRoute = APP_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Anon → app route ⇒ kick to /auth
  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Logged-in → /auth ⇒ kick to /dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
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
