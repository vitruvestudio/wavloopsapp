import type { Metadata } from "next";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Claim your spot — Wavloops Early Access",
  description:
    "Founding Producer Program — answer a few quick questions to claim one of the first 20 spots.",
};

export default function OnboardingEarlyPage() {
  return <OnboardingFlow />;
}
