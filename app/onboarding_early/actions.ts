"use server";

import { headers } from "next/headers";
import { sendOnboardingEmails } from "@/lib/resend/onboarding-emails";
import { getServerSupabase } from "@/lib/supabase/server";
import type {
  InterestLevel,
  OnboardingSubmission,
  SubmissionResult,
} from "./types";

const VALID_INTEREST_LEVELS: InterestLevel[] = [
  "early-access",
  "test-real-kit",
  "curious",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function submitOnboarding(
  data: OnboardingSubmission,
): Promise<SubmissionResult> {
  // Honeypot — bots fill all visible-like fields
  if (data._honeypot && data._honeypot.trim().length > 0) {
    return { ok: false, error: "Submission rejected." };
  }

  const producerName = sanitize(data.producerName, 200);
  const email = sanitize(data.email, 200).toLowerCase();
  const workUrl = sanitize(data.workUrl, 500);
  const interestLevel = sanitize(data.interestLevel, 50);
  const growGoals = Array.isArray(data.growGoals)
    ? data.growGoals
        .filter((g): g is string => typeof g === "string")
        .map((g) => g.trim())
        .filter((g) => g.length > 0)
        .slice(0, 20)
    : [];

  // Validation
  if (!producerName) {
    return { ok: false, error: "Producer name is required." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }
  if (!workUrl) {
    return { ok: false, error: "Work URL is required." };
  }
  if (!VALID_INTEREST_LEVELS.includes(interestLevel as InterestLevel)) {
    return { ok: false, error: "Please select an interest level." };
  }

  // Collect request metadata for anti-spam
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;
  const userAgent = headersList.get("user-agent") || null;

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from("onboarding_early").insert({
      producer_name: producerName,
      email,
      work_url: workUrl,
      grow_goals: growGoals,
      interest_level: interestLevel,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) {
      // 23505 = unique_violation (duplicate email)
      if (error.code === "23505") {
        return {
          ok: true, // Soft success — we already have them
        };
      }
      console.error("[onboarding_early] insert error:", error);
      return {
        ok: false,
        error: "Could not save your submission. Please try again.",
      };
    }

    // Fire emails — don't fail the request if these fail (row is already saved)
    try {
      await sendOnboardingEmails({
        producerName,
        email,
        workUrl,
        growGoals,
        interestLevel,
      });
    } catch (err) {
      console.error("[onboarding_early] email error:", err);
    }

    return { ok: true };
  } catch (err) {
    console.error("[onboarding_early] unexpected error:", err);
    return {
      ok: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
