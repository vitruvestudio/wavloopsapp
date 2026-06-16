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

/** Sign-out variant for the artist surface — redirects to
 *  /auth/magic instead of /auth so the same user doesn't get
 *  thrown at the producer password form. */
export async function signOutArtistAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/magic");
}
