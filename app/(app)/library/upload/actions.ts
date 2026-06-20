/**
 * Upload Beat server actions.
 *
 * Audio file is NOT routed through the server action body (Next 16
 * server actions cap at ~1MB by default and a typical WAV is 30-100MB).
 * Instead the client component uploads directly from the browser to the
 * `beat-audio` Storage bucket using the user's session, then calls
 * `saveBeatAction` with the resulting storage path plus the form
 * metadata. The bucket RLS (migration #2) gates uploads to the user's
 * own folder.
 *
 * On success the action:
 *   1. INSERTs the beat row into `public.beats`
 *   2. INSERTs one `server_beats` row per checked server id
 *   3. Revalidates /library + /dashboard (in case a new server is now
 *      non-empty)
 *   4. redirect('/library')
 *
 * On any error the audio file is left in Storage; we don't bother
 * cleaning it up automatically in V1 — orphan files cost ~nothing and
 * a future janitor cron sweeps them.
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkAudioFormat, checkBeatQuota } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import type { BeatType } from "@/lib/supabase/database.types";

export interface SaveBeatPayload {
  title: string;
  type: BeatType | null;
  bpm: number | null;
  key: string | null;
  autotune_key: string | null;
  /** Integrated loudness in LUFS (EBU R 128), auto-detected. NULL if
   *  extraction failed. The column lives on `beats` (migration #5). */
  loudness_lufs: number | null;
  duration_seconds: number | null;
  mood: string[];
  artist_types: string[];
  co_producers: string[];
  description: string | null;
  has_stems: boolean;
  /** Storage path inside the `beat-audio` bucket, e.g.
   *  `<user_id>/<uuid>.wav`. Already uploaded by the browser client. */
  audio_path: string;
  /** Public URL of the uploaded custom cover (beat-covers bucket), or
   *  null when the producer kept the generative artwork. */
  artwork_url: string | null;
  /** Deterministic seed for the Waveform component. */
  wave_seed: string;
  /** Server ids the producer wants to attach this beat to. */
  server_ids: string[];
}

export interface SaveBeatResult {
  error: string | null;
}

export async function saveBeatAction(
  payload: SaveBeatPayload,
): Promise<SaveBeatResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

  // Resolve the producer's profile id (beats.owner_id references profiles, not auth.users)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      error:
        "Your producer profile isn't set up yet. Finish onboarding first.",
    };
  }

  if (!payload.title.trim()) {
    return { error: "Title is required." };
  }
  if (!payload.audio_path) {
    return { error: "Audio file is missing. Re-upload and try again." };
  }

  // Billing gates — count + format. The client-side upload page
  // already gates the format before bytes ship to Supabase Storage,
  // but a determined user could craft a saveBeatAction call with
  // a pre-uploaded WAV path, so we re-check server-side. Defense
  // in depth on a quota that costs real egress (Pro-only formats
  // are typically 5-10× heavier than MP3).
  const beatGate = await checkBeatQuota();
  if (!beatGate.ok) return { error: beatGate.reason };

  const ext = payload.audio_path.split(".").pop()?.toLowerCase() ?? "";
  const formatGate = await checkAudioFormat(ext);
  if (!formatGate.ok) return { error: formatGate.reason };

  // 1) Insert beat row
  const { data: inserted, error: insertErr } = await supabase
    .from("beats")
    .insert({
      owner_id: profile.id,
      title: payload.title.trim(),
      type: payload.type,
      bpm: payload.bpm,
      key: payload.key,
      autotune_key: payload.autotune_key,
      loudness_lufs: payload.loudness_lufs,
      duration_seconds: payload.duration_seconds,
      mood: payload.mood,
      artist_types: payload.artist_types,
      co_producers: payload.co_producers,
      description: payload.description?.trim() || null,
      has_stems: payload.has_stems,
      audio_url: payload.audio_path,
      artwork_url: payload.artwork_url,
      wave_seed: payload.wave_seed,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { error: insertErr?.message ?? "Could not save the beat." };
  }

  // 2) Insert server memberships
  if (payload.server_ids.length > 0) {
    const rows = payload.server_ids.map((sid, i) => ({
      server_id: sid,
      beat_id: inserted.id,
      position: i,
    }));
    const { error: pivotErr } = await supabase
      .from("server_beats")
      .insert(rows);
    if (pivotErr) {
      // Beat is saved but pivot failed — surface the error, producer can
      // attach the beat manually from the library afterwards.
      return {
        error: `Beat saved, but couldn't attach to servers: ${pivotErr.message}`,
      };
    }
  }

  revalidatePath("/library", "page");
  revalidatePath("/dashboard", "page");
  redirect("/library");
}
