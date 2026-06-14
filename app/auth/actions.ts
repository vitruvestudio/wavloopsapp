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
