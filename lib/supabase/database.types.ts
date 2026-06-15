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
  /** Source URL the producer pasted. Optional for legacy compat —
   *  early records were stored without it and we can't recover the
   *  source. New records (onboarding + Settings editor) always
   *  populate this so the gate-page carousel can deep-link + use
   *  YouTube's thumbnail CDN for cover art. */
  url?: string;
}

/* ============================================================
   Servers & beats (migration #2)
   ============================================================ */

export type ArtworkMode = "auto" | "color" | "image";
export type Visibility = "public" | "private";
export type BeatType = "comp" | "loop";

export interface ServerRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  style_text: string | null;
  description: string | null;
  artist_types: string[];
  artwork_mode: ArtworkMode;
  accent_hue: number | null;
  artwork_image_url: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface BeatRow {
  id: string;
  owner_id: string;
  title: string;
  type: BeatType | null;
  bpm: number | null;
  key: string | null;
  audio_url: string | null;
  wave_seed: string;
  duration_seconds: number | null;
  mood: string[];
  has_stems: boolean;
  /* migration #4 */
  description: string | null;
  co_producers: string[];
  artist_types: string[];
  autotune_key: string | null;
  artwork_url: string | null;
  /* migration #5 — integrated loudness in LUFS, auto-detected via
     essentia.js LoudnessEBUR128. NULL if analysis failed. */
  loudness_lufs: number | null;
  /* */
  created_at: string;
  updated_at: string;
}

/** Row of `beats_with_stats` view — BeatRow + in_servers_count
 *  + plays_count + likes_count (migration #4). */
export interface BeatWithStatsRow extends BeatRow {
  in_servers_count: number;
  plays_count: number;
  likes_count: number;
}

export interface ServerBeatRow {
  server_id: string;
  beat_id: string;
  position: number;
  added_at: string;
}

/** Post-migration #7: contacts are top-level (owner-scoped, the
 *  producer's address book). The server_contacts pivot says which
 *  server(s) each contact has access to.
 *  Migration #8: avatar_url — populated by the "paste a social link"
 *  auto-fill in the Add Contact modal.
 *  Migration #9: roles — Producer / Beatmaker / Artist / Rapper /
 *  etc. — what this contact's professional role is (distinct from
 *  servers.artist_types, which describes a server's TARGET artist,
 *  not the producer themselves). */
export interface ContactRow {
  id: string;
  owner_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  socials: Record<string, string>;
  avatar_url: string | null;
  roles: string[];
  first_seen_at: string;
  last_active_at: string;
}

export interface ServerContactRow {
  server_id: string;
  contact_id: string;
  granted_at: string;
}

export interface ListenRow {
  id: string;
  contact_id: string;
  beat_id: string;
  server_id: string;
  listened_at: string;
  completion_pct: number | null;
}

export interface LikeRow {
  id: string;
  contact_id: string;
  beat_id: string;
  server_id: string;
  liked_at: string;
}

/** Row of the `servers_with_stats` view — ServerRow + the three counts
 *  the Dashboard needs in one query (see migration #3). */
export interface ServerWithStatsRow extends ServerRow {
  beats_count: number;
  contacts_count: number;
  plays_count: number;
}
