/**
 * /onboarding — producer profile setup wizard, post-signup.
 *
 * Sibling of /auth and /(app)/* in the App Router — inherits only the
 * root layout (fonts + theme), no App shell. The wizard's own chrome
 * (Logo + skip in the header) is part of OnboardingWizard.tsx.
 *
 * Server-side gating (defence in depth on top of the proxy):
 *   - No user (proxy should already have bounced)  → /auth
 *   - User already onboarded (profile.onboarded_at) → /dashboard
 *
 * Otherwise renders the client wizard. We don't pre-fill from existing
 * data yet — anyone reaching here has either never started or skipped
 * to a half-empty profile, and they can refill from scratch. The
 * "edit profile" flow lives in Settings (J6).
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Set up your producer profile",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarded_at) redirect("/dashboard");

  return <OnboardingWizard />;
}
