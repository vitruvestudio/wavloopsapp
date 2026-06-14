/**
 * Hand-written TypeScript shapes for the Wavloops DB.
 *
 * As we add more tables we'll switch to generating this file via
 *   `npx supabase gen types typescript --project-id <id> > database.types.ts`
 * For V1 (single `profiles` table) hand-written is faster.
 *
 * Keep these shapes in sync with supabase/migrations/*.sql.
 */

export interface ProfileRow {
  id: string;
  user_id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  socials: Record<string, string>;
  certifications: string[];
  placements: PlacementRecord[];
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlacementRecord {
  id: string;
  title: string;
  platform: "Spotify" | "YouTube";
  icon: string;
}
