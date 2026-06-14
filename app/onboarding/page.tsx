/**
 * /onboarding — producer profile setup wizard, post-signup.
 *
 * Sibling of /auth and /(app)/* in the App Router — inherits only the
 * root layout (fonts + theme), no App shell. The wizard's own chrome
 * (Logo + skip in the header) is part of OnboardingWizard.tsx.
 *
 * Auth gating happens in proxy.ts (`/onboarding` is in the protected
 * list — anon users redirect to /auth). The page itself doesn't re-check
 * because the wizard has no destructive actions yet; once we wire the
 * save to the profiles table, we'll add a getUser() check here too.
 */

import type { Metadata } from "next";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Set up your producer profile",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
