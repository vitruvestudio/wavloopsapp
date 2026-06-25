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
 *   2. Optimistic route protection. V2 has a single unified auth
 *      page `/auth` that handles both producer + artist signups
 *      (role selected via 2 cards). So the routing is:
 *
 *        - Anon → producer (app) route → redirect to /auth
 *        - Anon → /listen/*            → redirect to /auth?as=artist&next=…
 *        - Auth → /auth                → redirect to /dashboard
 *
 *      Sprint C will replace the dumb "logged-in → /dashboard"
 *      redirect with profile-aware routing (check whether the user
 *      has `profiles`, `artist_profiles`, or both, then route +
 *      restore last-used mode from cookie). For now we keep the
 *      producer-first default and let server components nudge
 *      artists toward /listen on a per-route basis.
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
import {
  HANDLE_REGEX,
  REF_COOKIE_NAME,
  REF_COOKIE_TTL_SECONDS,
} from "@/lib/affiliate/config";

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/library",
  "/contacts",
  "/settings",
  "/servers",
  "/beats",
  "/onboarding",
];

/** First-touch affiliate attribution.
 *
 * Resolve a candidate `?ref=` from the URL up front. We don't
 * touch the response yet — Supabase's `setAll` callback below can
 * REASSIGN the response object on session refresh, which would
 * blow away any cookie we'd set early. The actual cookie write
 * goes through `attachAffiliateCookie()` and runs right before
 * each return so the cookie always lands on whatever response
 * we actually ship (pass-through OR redirect).
 *
 * First-touch policy: if the visitor already carries a wlp_ref
 * cookie, we don't overwrite. The first affiliate to send them
 * wins the attribution, matching Notion / Webflow behaviour and
 * discouraging affiliates from poaching each other's traffic.
 *
 * Format validation here is identical to the affiliates.handle
 * CHECK constraint in the DB so an invalid handle never makes it
 * into a cookie. We don't lookup the handle vs the DB at proxy
 * time — that would cost a query per page view. Resolution
 * happens at signup in /auth/callback. */
function resolveCandidateRef(request: NextRequest): string | null {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return null;
  if (!HANDLE_REGEX.test(ref)) return null;
  if (request.cookies.get(REF_COOKIE_NAME)) return null;
  return ref;
}

/** Apply the wlp_ref cookie to whichever response we're returning
 *  (pass-through or redirect). Safe to call multiple times; the
 *  cookie value is deterministic. */
function attachAffiliateCookie(
  response: NextResponse,
  ref: string | null,
): NextResponse {
  if (!ref) return response;
  response.cookies.set(REF_COOKIE_NAME, ref, {
    maxAge: REF_COOKIE_TTL_SECONDS,
    httpOnly: false, // client-readable so /affiliate dashboard JS can echo it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const candidateRef = resolveCandidateRef(request);
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
  // /auth is the unified entry. /auth/magic is the legacy alias
  // that redirects to /auth?as=artist — skip the proxy guard
  // there because the redirect runs server-side before any
  // session check would matter.
  const isAuthRoute = pathname === "/auth";
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
    url.search = "";
    return attachAffiliateCookie(NextResponse.redirect(url), candidateRef);
  }
  // Anon → artist route ⇒ kick to /auth with `as=artist`
  // pre-selected (the user landed somewhere artist-shaped, so
  // we skip the role chooser). `next` carries the original path
  // so the callback can land them back where they tried to go.
  if (!user && isArtistRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    url.searchParams.set("as", "artist");
    url.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return attachAffiliateCookie(NextResponse.redirect(url), candidateRef);
  }

  // ── Logged-in gates ──────────────────────────────────────
  // Logged-in → /auth ⇒ restore the last used mode from the
  // wlp_last_mode cookie ("producer" → /dashboard, "artist" →
  // /listen). Without a cookie, default to /dashboard. This is
  // an optimistic shortcut: server components in /dashboard
  // and /listen run their own checks and bounce to the right
  // onboarding if the matching profile row is missing.
  //
  // /auth/callback is intentionally NOT gated — that route runs
  // the OTP exchange and may not yet have a session at entry.
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    const lastMode = request.cookies.get("wlp_last_mode")?.value;
    url.pathname = lastMode === "artist" ? "/listen" : "/dashboard";
    url.search = "";
    return attachAffiliateCookie(NextResponse.redirect(url), candidateRef);
  }

  return attachAffiliateCookie(response, candidateRef);
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
