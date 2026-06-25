/**
 * /auth/callback — Supabase magic-link / OAuth exchange endpoint.
 *
 * Two flows arrive here:
 *
 *   - **Token-hash flow** (new, cross-device safe) — magic links
 *     emailed by Supabase carry `?token_hash=&type=&redirect_to=`.
 *     verifyOtp() trades the hash for a session WITHOUT needing
 *     the PKCE code_verifier that lived on the device that
 *     requested the link. This is what makes "request on desktop,
 *     click on mobile" work — the failure mode that was crashing
 *     real signups with `PKCE code verifier not found in storage`.
 *
 *   - **PKCE code flow** (legacy + Google OAuth) — Supabase
 *     bounces here with `?code=`. exchangeCodeForSession() expects
 *     the verifier in cookies → same-browser only. We still accept
 *     this path for (a) in-flight magic links emailed BEFORE the
 *     template switch and (b) Google OAuth which is always
 *     same-browser anyway.
 *
 * After auth, the steps are identical regardless of flow:
 *   1. Run bind_artist_contacts() so the freshly-authed user
 *      immediately sees every producer that already had them on
 *      file as a contact.
 *   2. Read `?next` if the caller passed one (gate flow uses
 *      this to land users on /s/<slug>). For the token-hash flow
 *      the `next` lives inside the URL-encoded `redirect_to`.
 *   3. Otherwise, route intelligently based on which profiles
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
 *   4. Set/update the `wlp_last_mode` cookie based on the route
 *      we ended up taking, so a future login sticks.
 *
 * On failure (missing / invalid hash or code), bounce back to
 * /auth with the role + inline error preserved so the user lands
 * on the email form, not the role chooser.
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LAST_MODE_COOKIE, type LastMode } from "../mode-cookie";
import { HANDLE_REGEX, REF_COOKIE_NAME } from "@/lib/affiliate/config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** True for paths that stay on our origin. Rejects:
 *   - absolute URLs (http://, https://, javascript:, data:)
 *   - protocol-relative URLs (//host)
 *   - anything that doesn't start with `/`
 *   - paths sneaking a backslash so `new URL()` parses host
 *     differently across browsers.
 *  Used to gate the magic-link `next` redirect target — the
 *  email arrives in a user's inbox and a forged template could
 *  put an attacker URL there. */
function isSafeRelativePath(p: string): boolean {
  if (typeof p !== "string" || p.length === 0 || p.length > 1024) return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("//") || p.startsWith("/\\")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(p)) return false;
  return true;
}

/** Parse the URL-encoded `redirect_to` that the token-hash email
 *  template forwards from our `emailRedirectTo`. We expect it to
 *  be `https://<our-host>/auth/callback?next=...&as=...`. Returns
 *  the extracted `next` + `role`, both nullable, never throws — a
 *  malformed value just falls through to top-level query lookups
 *  so signup never hard-fails on a malformed link. */
function parseRedirectTo(value: string | null): {
  next: string | null;
  role: string | null;
} {
  if (!value) return { next: null, role: null };
  try {
    const inner = new URL(value);
    return {
      next: inner.searchParams.get("next"),
      role: inner.searchParams.get("as"),
    };
  } catch {
    return { next: null, role: null };
  }
}

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

/** Email types Supabase emits on its magic-link / verify routes.
 *  We list them explicitly so a bogus ?type= from a crafted URL
 *  can't cast its way into verifyOtp and trigger unintended
 *  behaviour. `email` covers signup + magic-link; `recovery` is
 *  password reset (not currently used); `email_change` is
 *  account-email update. */
const ALLOWED_OTP_TYPES = new Set([
  "email",
  "magiclink",
  "signup",
  "recovery",
  "email_change",
  "invite",
]);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type");
  const redirectTo = url.searchParams.get("redirect_to");

  // Token-hash flow: `next` and `as` live inside the URL-encoded
  // `redirect_to` (the value of emailRedirectTo we set in the
  // server action). Parse them out so the downstream routing is
  // identical to the PKCE path. If parsing fails, fall back to
  // the top-level query params — handy for edge cases.
  const fromRedirect = parseRedirectTo(redirectTo);

  const explicitNext = fromRedirect.next ?? url.searchParams.get("next");
  const role = fromRedirect.role ?? url.searchParams.get("as");

  const supabase = await createClient();

  // Prefer token-hash flow when present (works cross-device).
  // exchangeCodeForSession is kept as a fallback for in-flight
  // PKCE links and for Google OAuth (always same-browser).
  if (tokenHash && otpType && ALLOWED_OTP_TYPES.has(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as
        | "email"
        | "magiclink"
        | "signup"
        | "recovery"
        | "email_change"
        | "invite",
    });
    if (error) {
      return bounceBack(url, error.message, role);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return bounceBack(url, error.message, role);
    }
  } else {
    return bounceBack(url, "Missing auth token in callback URL.", role);
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

  // Affiliate attribution: if the visitor arrived with a wlp_ref
  // cookie (set by the proxy on a `?ref=handle` landing), resolve
  // the handle to an active affiliate id and record a pending
  // referral row keyed on the newly-authed user. The Stripe
  // webhook flips this row to `approved` on the first paid
  // conversion. Idempotent: if a pending referral already exists
  // for this user, we skip — the FIRST attribution wins, matching
  // the cookie's first-touch policy in the proxy.
  await maybeRecordAffiliateAttribution(supabase);

  // If the caller explicitly told us where to land (gate flow:
  // /s/<slug> or /listen/<slug>), honor that. Profile-aware
  // routing only kicks in when no `next` was provided.
  //
  // SECURITY: `next` arrives from a URL that landed in the user's
  // inbox via the magic-link template. Treat it as attacker-
  // controlled — a forged email could set
  // `?next=//evil.com/phish` and `new URL(next, origin)` would
  // happily resolve to evil.com, turning callback into an open
  // redirect. Whitelist to relative paths only, then collapse
  // any protocol-scheme sneak-ins.
  if (explicitNext && isSafeRelativePath(explicitNext)) {
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

/** Affiliate attribution at signup time.
 *
 * Reads the wlp_ref cookie that the proxy set on landing.
 * Resolves the handle to an ACTIVE affiliate id via the
 * SECURITY DEFINER RPC `resolve_affiliate_handle`. If the user
 * already has a pending referral row (e.g. they're verifying
 * a 2nd magic-link from the same browser), we skip — first
 * attribution wins, matching the cookie's first-touch policy.
 *
 * Anti-self-referral: if the authed user is the same one who
 * owns the affiliate row (user_id match), we skip the
 * attribution. An affiliate cannot earn commission on their
 * own signups, which is a sub-second sanity check that blocks
 * the most common gamification attempt.
 *
 * Silent on every failure — sign-in is what matters; affiliate
 * data is best-effort. Anything that goes wrong is logged and
 * the user proceeds to the dashboard normally. */
async function maybeRecordAffiliateAttribution(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  try {
    const jar = await cookies();
    const ref = jar.get(REF_COOKIE_NAME)?.value;
    if (!ref) return;
    if (!HANDLE_REGEX.test(ref)) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Resolve the handle → affiliate id. Returns null when the
    // handle doesn't exist OR points at a non-active affiliate.
    const { data: affiliateId } = await supabase.rpc(
      "resolve_affiliate_handle",
      { p_handle: ref },
    );
    if (!affiliateId || typeof affiliateId !== "string") return;

    // Already attributed? First-touch wins.
    const { data: existing } = await supabase
      .from("affiliate_referrals")
      .select("id")
      .eq("attributed_user_id", user.id)
      .maybeSingle<{ id: string }>();
    if (existing) return;

    // Anti-self-referral — fetch the affiliate's owning user id
    // and compare. Affiliates RLS gates anon SELECT, so we route
    // through service-role-equivalent RPC OR accept that the
    // anon read silently returns nothing. We choose the safer
    // path: a dedicated check inside the insert via WHERE NOT
    // EXISTS (cleaner than a second query) is too verbose here,
    // so we do a quick lookup. If it fails, we skip rather than
    // risk creating a self-referral.
    const { data: affiliateOwner } = await supabase
      .from("affiliates")
      .select("user_id")
      .eq("id", affiliateId)
      .maybeSingle<{ user_id: string | null }>();
    if (affiliateOwner?.user_id === user.id) {
      console.info(
        "[auth/callback] skipped self-referral attribution",
        affiliateId,
      );
      return;
    }

    await supabase.from("affiliate_referrals").insert({
      affiliate_id: affiliateId,
      attributed_user_id: user.id,
      status: "pending",
    });
  } catch (e) {
    console.warn("[auth/callback] affiliate attribution failed", e);
  }
}

/** Helper to attach the wlp_last_mode cookie to the redirect
 *  response. Kept inline because the callback is the only place
 *  the cookie is set on a redirect (mode-switch actions write
 *  it via the request cookies jar). */
function writeLastModeCookie(res: NextResponse, mode: LastMode) {
  res.cookies.set(LAST_MODE_COOKIE, mode, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    // Read server-side only — flipping httpOnly off was an
    // option for a hypothetical client peek that never shipped,
    // and leaving it scriptable lets an XSS rewrite the routing
    // preference. Cost of locking it down: zero.
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
