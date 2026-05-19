export type InterestLevel = "early-access" | "test-real-kit" | "curious";

export type GrowGoal =
  | "Email list"
  | "Instagram followers"
  | "Tiktok followers"
  | "Youtube subscribers"
  | "Discord community"
  | "Future kit sales"
  | "Not sure yet";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted";

/**
 * Payload sent from the onboarding form to the Server Action.
 * Includes a honeypot field that should always be empty for real users.
 */
export type OnboardingSubmission = {
  producerName: string;
  email: string;
  workUrl: string;
  growGoals: string[];
  interestLevel: string;
  /** Honeypot — must be empty. Filled = bot. */
  _honeypot?: string;
};

/**
 * Result of a submission attempt.
 */
export type SubmissionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Row shape in Supabase `onboarding_early` table.
 * Matches the SQL schema in supabase-schema.sql.
 */
export type OnboardingEarlyRow = {
  id: string;
  created_at: string;
  producer_name: string;
  email: string;
  work_url: string;
  grow_goals: string[];
  interest_level: InterestLevel;
  status: ApplicationStatus;
  notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
};
