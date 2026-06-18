/**
 * Auth server actions — email/password sign-in + sign-up + sign-out.
 *
 * Shape is what React 19's `useActionState` expects:
 *   (prevState, formData) => Promise<state>
 *
 * On success the action calls `redirect()`, which throws an internal
 * NEXT_REDIRECT error — never reaches `return state`. So the only return
 * path is the error case, surfaced to the form as `{ error: string }`.
 *
 * Heads-up for V1 testing:
 *   Supabase ships with "Confirm email" turned ON by default. With it on,
 *   signUp does NOT create a session — the user has to click the email
 *   link first. For sprint iteration speed, disable it at:
 *     Supabase dashboard → Authentication → Sign In / Up → Email →
 *     "Confirm email" toggle OFF. Re-enable before going live.
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

export async function signInAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Friendlier copy than Supabase's raw messages.
    if (error.message.toLowerCase().includes("invalid")) {
      return { error: "Email or password is incorrect." };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // If Supabase email confirmation is OFF, a session is returned and we
  // can take them straight to onboarding. If it's ON, no session is set
  // and they need to verify before logging in.
  if (!data.session) {
    return {
      error:
        "Check your inbox to confirm your email, then come back and log in.",
    };
  }

  revalidatePath("/", "layout");
  // Post-signup, route to the producer profile setup wizard.
  // Once we wire the profiles table, /dashboard will start checking
  // `onboarded_at` and bounce users here automatically if it's null.
  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}

/* ============================================================
   Artist auth — passwordless magic link.

   Producer auth (above) is email+password landing at /dashboard.
   Artists never set a password — they paste their email into
   /auth/magic (or into a server's gate page), receive a one-tap
   link, and land in /listen.

   The link target is /auth/callback (route handler) which
   exchanges the code for a session and runs
   bind_artist_contacts() so the freshly-authed user immediately
   sees every producer that already had them on file.
   ============================================================ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInWithMagicLinkAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(formData.get("next") ?? "/listen");

  if (!email) return { error: "Email is required." };
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email." };
  }

  // Resolve the public origin to build the redirect URL Supabase
  // will embed in the email. `headers()` is async in Next 16. We
  // prefer the request's `origin` header; in deploys behind a proxy
  // that strips it, fall back to NEXT_PUBLIC_SITE_URL.
  const h = await headers();
  const origin =
    h.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createClient();
  // DEPLOY NOTE: every origin used here must be added to the
  // Supabase project's Auth → URL Configuration → Redirect URLs
  // allowlist (e.g. http://localhost:3000 + https://wavloops.co).
  // Otherwise the magic link bounces to a Supabase error page.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) return { error: error.message };

  const qs = new URLSearchParams({ sent: "1", email });
  if (next !== "/listen") qs.set("next", next);
  redirect(`/auth/magic?${qs.toString()}`);
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
                       in once approved. Redirect to /auth/magic?
                       requested=1 so SentState shows the
                       contextualized "request submitted" copy.

   Phase 3.9.3 refactor: this used to defer the request creation
   until the magic-link callback ran, which meant the producer
   didn't see anything until the artist verified. Now the producer
   sees the funnel immediately.
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
  // before the email-verification round-trip. This is the whole
  // point of moving away from claim_server_access in the callback:
  // the producer's Requests tab fires the moment the artist hits
  // "Request access", not after they click an email.
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
  // Idempotent gate (was_new) prevents duplicate emails when an
  // artist double-submits the gate form.
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
      // Phase 3.9.7.2 — producer prefs gate. The RPC bundles
      // email + flags so a single round-trip tells us both
      // "where to send" and "should we send".
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
    // Already signed in: skip the magic-link round-trip entirely.
    // Public → straight to /listen; private → back to the gate
    // where the page renders the MembershipPendingCard from the
    // server_contacts row we just inserted.
    revalidatePath("/", "layout");
    redirect(visibility === "private" ? `/s/${slug}` : `/listen/${slug}`);
  }

  // Anon visitor: send the magic-link so they can verify their
  // email + come back to listen after the producer approves.
  // bind_artist_contacts in /auth/callback will tie auth_user_id
  // onto the contact row we just created.
  const h = await headers();
  const origin =
    h.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const next = visibility === "private" ? `/s/${slug}` : `/listen/${slug}`;
  const callback = new URL(`${origin}/auth/callback`);
  callback.searchParams.set("next", next);

  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callback.toString(),
      shouldCreateUser: true,
    },
  });
  if (otpErr) return { error: otpErr.message };

  // ?requested=1 ONLY for private servers (pending status). For
  // public servers the row was created with status='granted' — the
  // magic-link is just email verification, not an access request,
  // so the SentState should show the standard "Check your inbox"
  // copy. Setting requested=1 everywhere mislabels public claims
  // as "Request submitted" and confuses the artist.
  const qs = new URLSearchParams({ sent: "1", email, next });
  if (visibility === "private") qs.set("requested", "1");
  redirect(`/auth/magic?${qs.toString()}`);
}

/** Sign-out variant for the artist surface — redirects to
 *  /auth/magic instead of /auth so the same user doesn't get
 *  thrown at the producer password form.
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
  redirect("/auth/magic");
}
