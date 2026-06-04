"use server";

import { headers } from "next/headers";
import { sendOnboardingEmails } from "@/lib/resend/onboarding-emails";
import { getServerSupabase } from "@/lib/supabase/server";
import type { OnboardingSubmission, SubmissionResult } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Q5 ("interest level") was dropped in the Release OS flow — every new
 * submission is by definition an early-access signup, so we hard-code the
 * value before insert. Keeps the column NOT NULL constraint happy without
 * forcing a schema migration.
 */
const DEFAULT_INTEREST_LEVEL = "early-access";

function sanitize(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function submitOnboarding(
  data: OnboardingSubmission,
): Promise<SubmissionResult> {
  // Honeypot — bots fill all visible-like fields, real users skip it
  if (data._honeypot && data._honeypot.trim().length > 0) {
    return { ok: false, error: "Submission rejected." };
  }

  const producerName = sanitize(data.producerName, 200);
  const email = sanitize(data.email, 200).toLowerCase();
  const workUrl = sanitize(data.workUrl, 500);
  const painPoints = Array.isArray(data.painPoints)
    ? data.painPoints
        .filter((p): p is string => typeof p === "string")
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
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

  // Anti-spam request metadata
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
      // `grow_goals` column repurposed for Release OS pain points
      grow_goals: painPoints,
      interest_level: DEFAULT_INTEREST_LEVEL,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) {
      // 23505 = unique_violation (duplicate email). Soft success — we
      // already have them on the list, don't make them think they failed.
      if (error.code === "23505") {
        return { ok: true };
      }
      console.error("[onboarding_early] insert error:", error);
      // Dev-only: surface the Supabase error code/message in the UI so the
      // producer (or dev) can self-diagnose without tailing the terminal.
      const detail =
        process.env.NODE_ENV === "development"
          ? ` (${error.code || "?"}: ${error.message})`
          : "";
      return {
        ok: false,
        error: `Could not save your submission. Please try again.${detail}`,
      };
    }

    // Fire transactional emails — failures here are logged but don't fail the
    // request: the row is already saved so the lead isn't lost.
    try {
      await sendOnboardingEmails({
        producerName,
        email,
        workUrl,
        // Pass painPoints under the legacy growGoals param name (the email
        // template was written for V1 — we'll update it separately).
        growGoals: painPoints,
        interestLevel: DEFAULT_INTEREST_LEVEL,
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
