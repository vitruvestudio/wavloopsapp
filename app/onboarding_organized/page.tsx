import type { Metadata } from "next";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Claim your early-access spot — Wavloops",
  description:
    "Founding Producer Program — four quick questions to claim one of the first 20 spots. Lock your early-access price for life.",
};

export default function OnboardingOrganizedPage() {
  return <OnboardingFlow />;
}
