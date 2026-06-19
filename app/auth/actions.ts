/**
 * Auth server actions — passwordless only.
 *
 * Wavloops V2 auth model:
 *   - Magic-link via Resend SMTP (primary path)
 *   - Google OAuth via Supabase provider (1-tap, requires
 *     Google Cloud + Supabase dashboard config)
 *   - NO password. Drop signInWithPassword + signUp completely.
 *
 * Producer / Artist intent is captured at signup-time via a `role`
 * field that travels through the magic-link as `?as=producer|artist`
 * on the callback URL. The callback then routes the user to the
 * correct onboarding (5-step producer wizard or 1-step artist
 * setup) on first login, and to /dashboard or /listen on later
 * logins.
 *
 * Shape is what React 19's `useActionState` expects:
 *   (prevState, formData) => Promise<state>
 *
 * On success the action calls `redirect()` (NEXT_REDIRECT throw) —
 * never reaches `return state`. So the only return path is the
 * error case, surfaced to the form as `{ error: string }`.
 */

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendAccessRequestEmail } from "@/lib/resend/emails";

export interface AuthState {
  error: string | null;
}

export type AuthRole = "producer" | "artist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Resolve the public origin from the request, in priority order:
 *    1. `origin` header — present on most browser requests.
 *    2. `x-forwarded-host` / `host` — Vercel and most reverse
 *       proxies inject these even when Origin is absent (server-
 *       to-server hops, some Safari iOS form posts).
 *    3. `NEXT_PUBLIC_SITE_URL` env var — last-resort runtime
 *       config for when the request has no host info at all.
 *    4. Localhost — dev fallback so a missing env var never
 *       crashes the page.
 *
 *  Without the x-forwarded-host step, Safari mobile form posts
 *  occasionally fell through to NEXT_PUBLIC_SITE_URL and — when
 *  the env var hadn't propagated to the running build — all the
 *  way to localhost. That manifested as a "can't reach the
 *  server" screen after the Google OAuth redirect bounced back. */
async function resolveOrigin(): Promise<string> {
  const h = await headers();

  const origin = h.get("origin");
  if (origin) return origin;

  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Build the callback URL Supabase embeds in the magic-link email.
 *  `next` is where the user lands after token exchange (default
 *  decided by callback). `as` carries the chosen role through so
 *  the callback can pick the right onboarding on first login. */
function buildCallbackUrl(
  origin: string,
  next: string | null,
  role: AuthRole | null,
): string {
  const url = new URL(`${origin}/auth/callback`);
  if (next) url.searchParams.set("next", next);
  if (role) url.searchParams.set("as", role);
  return url.toString();
}

/* ============================================================
   Magic-link request — primary auth path.

   Used by:
     - /auth (Producer or Artist card → email form)
     - Gate flow fallback (kept inside requestGateAccessAction)
   ============================================================ */

export async function requestMagicLinkAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(formData.get("next") ?? "").trim() || null;
  const roleRaw = String(formData.get("role") ?? "").trim();
  const role: AuthRole | null =
    roleRaw === "producer" || roleRaw === "artist" ? roleRaw : null;

  if (!email) return { error: "Email is required." };
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email." };
  }

  const origin = await resolveOrigin();
  const supabase = await createClient();

  // DEPLOY NOTE: every origin used here must be in the Supabase
  // project's Auth → URL Configuration → Redirect URLs allowlist
  // (http://localhost:3000 + https://wavloops.co). Otherwise the
  // magic-link bounces to a Supabase error page.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildCallbackUrl(origin, next, role),
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Always swallow Supabase's verbatim message — it leaks
    // whether the account exists, is rate-limited, etc. A user
    // enumeration vector. Log server-side for debugging; surface
    // a generic copy. The happy-path UX is identical
    // ("check your inbox"), so an attacker can't tell whether a
    // probe succeeded.
    console.warn("[auth] signInWithOtp error:", error.message);
    // Treat known transient errors as soft-failures (still bounce
    // to the success state) so timing doesn't leak either.
    if (/rate/i.test(error.message)) {
      const qs = new URLSearchParams({ sent: "1", email });
      if (next) qs.set("next", next);
      if (role) qs.set("as", role);
      redirect(`/auth?${qs.toString()}`);
    }
    return {
      error:
        "We couldn't send your sign-in link right now. Please try again in a moment.",
    };
  }

  // Land on the "Check your inbox" success state (same /auth route,
  // sent=1 toggles SentState in AuthScreen).
  const qs = new URLSearchParams({ sent: "1", email });
  if (next) qs.set("next", next);
  if (role) qs.set("as", role);
  redirect(`/auth?${qs.toString()}`);
}

/* ============================================================
   Google OAuth — 1-tap sign-in.

   Requires:
     - Google Cloud Console OAuth app (client ID + secret)
     - Supabase Dashboard → Authentication → Providers → Google
       (enabled, client ID/secret pasted in, redirect URLs
       allowlisted: https://<project>.supabase.co/auth/v1/callback)

   Until those two are configured, this action returns a friendly
   error instead of throwing — UI keeps the button enabled so users
   know it's coming, but the flow is harmless.
   ============================================================ */

export async function signInWithGoogleAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const next = String(formData.get("next") ?? "").trim() || null;
  const roleRaw = String(formData.get("role") ?? "").trim();
  const role: AuthRole | null =
    roleRaw === "producer" || roleRaw === "artist" ? roleRaw : null;

  const origin = await resolveOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildCallbackUrl(origin, next, role),
      // Skip Google's account-selector when the user is already
      // signed in to a single Google account → 1 tap, not 2.
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("provider is not enabled")) {
      return {
        error:
          "Google sign-in isn't enabled yet. Use the email magic-link instead.",
      };
    }
    return { error: error.message };
  }

  if (data?.url) {
    redirect(data.url);
  }
  return { error: "Could not start Google sign-in. Try the magic-link." };
}

/* ============================================================
   Producer sign-out — clears session + bounces to /auth.
   ============================================================ */

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}

/** Sign-out variant for the artist surface — bounces back to /auth
 *  (the unified entry) instead of a dead /auth/magic.
 *
 *  `scope: "local"` only clears the session cookies on this device,
 *  no round-trip to Supabase to revoke the refresh token globally.
 *  That's what we want here — log-out should be instant and never
 *  fail because of a network blip. If we ever need to nuke every
 *  device for a user (e.g. "log out everywhere" admin action), call
 *  signOut() without scope. */
export async function signOutArtistAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/auth");
}

/* ============================================================
   Gate-page entry — /s/[slug] form.

   Three-stage action, regardless of auth state:
     1. submit_access_request RPC → pending row + producer
        notification at form-submit time (anon-callable, doesn't
        wait for the artist to verify their email).
     2. If a fresh pending row landed AND visibility is private,
        fire the producer-side "new access request" email.
     3. Branch on auth:
          - signed in → redirect /s/<slug> (private) or /listen/<slug> (public).
          - anon     → also send a magic-link via signInWithOtp so
                       the artist can verify their email and come back
                       in once approved. Redirect to /auth?sent=1
                       (and ?requested=1 for private servers so the
                       SentState shows the contextualized copy).
   ============================================================ */

export async function requestGateAccessAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Missing server slug." };

  // The form's email field is optional when the viewer is already
  // signed in — in that case the action reads the email from the
  // session. The single social field is free-form and stored as
  // socials.social on the contact.
  const formEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const social = String(formData.get("social") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve the email we'll persist. Signed-in viewers always use
  // their session email (so a malicious form submit can't impersonate
  // another address). Anon visitors use what they typed.
  const email = user?.email ?? formEmail;
  if (!email) return { error: "Email is required." };
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email." };
  }

  // Step 1 — write the pending row + producer notification NOW,
  // before the email-verification round-trip.
  const { data: submitRes, error: submitErr } = await supabase.rpc(
    "submit_access_request",
    { p_slug: slug, p_email: email, p_social: social || null },
  );
  if (submitErr) return { error: submitErr.message };
  const submit = submitRes as {
    ok: boolean;
    error?: string;
    visibility?: "public" | "private";
    was_new?: boolean;
    producer_user_id?: string | null;
    server_name?: string | null;
  } | null;
  if (!submit || !submit.ok) {
    return { error: submit?.error ?? "Could not submit request." };
  }
  const visibility = submit.visibility ?? "private";
  const wasNew = !!submit.was_new;

  // Step 2 — fire the producer email on freshly-pending requests.
  if (wasNew && visibility === "private") {
    try {
      const { data: gateRows } = await supabase.rpc("get_server_for_gate", {
        p_slug: slug,
      });
      const gate = (
        gateRows as Array<{
          name?: string;
          producer_handle?: string | null;
          producer_name?: string | null;
        }> | null
      )?.[0];
      const { data: targetData } = await supabase.rpc(
        "get_server_owner_notif_target",
        { p_slug: slug },
      );
      const target = targetData as {
        email?: string;
        wants_email?: boolean;
        wants_access_request?: boolean;
      } | null;
      if (
        target?.email &&
        target.wants_email !== false &&
        target.wants_access_request !== false &&
        gate?.name
      ) {
        await sendAccessRequestEmail({
          producerEmail: target.email,
          producerHandle:
            gate.producer_handle ?? gate.producer_name ?? "your server",
          artistEmail: email,
          artistSocial: social,
          serverName: gate.name,
          serverSlug: slug,
        });
      }
    } catch (e) {
      console.warn("[gate-action] access-request email failed", e);
    }
  }

  // Step 3 — branch on auth state for the redirect.
  if (user) {
    revalidatePath("/", "layout");
    redirect(visibility === "private" ? `/s/${slug}` : `/listen/${slug}`);
  }

  // Anon visitor: send the magic-link so they can verify their
  // email + come back to listen after the producer approves.
  // bind_artist_contacts in /auth/callback will tie auth_user_id
  // onto the contact row we just created. The intent here is
  // implicitly "artist" — the user came in through a producer's
  // gate page and is here to listen.
  const origin = await resolveOrigin();
  const next = visibility === "private" ? `/s/${slug}` : `/listen/${slug}`;
  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildCallbackUrl(origin, next, "artist"),
      shouldCreateUser: true,
    },
  });
  if (otpErr) return { error: otpErr.message };

  // ?requested=1 ONLY for private servers (pending status). For
  // public servers the row was created with status='granted' — the
  // magic-link is just email verification, not an access request,
  // so the SentState shows the standard "Check your inbox" copy.
  const qs = new URLSearchParams({ sent: "1", email, next, as: "artist" });
  if (visibility === "private") qs.set("requested", "1");
  redirect(`/auth?${qs.toString()}`);
}
