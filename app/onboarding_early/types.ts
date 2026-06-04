/**
 * Onboarding types — Release OS edition.
 *
 * History:
 *   - V1 concierge collected `growGoals` (string[]) + `interestLevel` (enum).
 *   - Release OS collects `painPoints` (string[]); `interestLevel` is dropped
 *     from the UI but kept in the DB as "early-access" for every new row.
 *
 * Compatibility:
 *   - The Supabase column `grow_goals` is REUSED to store pain points
 *     (avoids a schema migration; V1 rows still readable).
 *   - The Supabase column `interest_level` stays NOT NULL and is filled
 *     server-side with the default constant.
 */

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted";

/**
 * Payload sent from the onboarding form to the Server Action.
 * `_honeypot` must be empty for real users; any non-empty value = bot.
 */
export type OnboardingSubmission = {
  producerName: string;
  email: string;
  workUrl: string;
  /**
   * Pain points the producer wants Wavloops to handle first.
   * Persisted in the `grow_goals` column (legacy V1 name kept for compat).
   */
  painPoints: string[];
  _honeypot?: string;
};

export type SubmissionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Shape of a row in the Supabase `onboarding_early` table.
 * Matches the SQL schema in supabase-schema.sql.
 */
export type OnboardingEarlyRow = {
  id: string;
  created_at: string;
  producer_name: string;
  email: string;
  work_url: string;
  /** Originally "grow goals" (V1) — now stores pain points (Release OS). */
  grow_goals: string[];
  /** Always `"early-access"` for Release OS signups. */
  interest_level: string;
  status: ApplicationStatus;
  notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
};
