/**
 * Beat detail server actions — save edits + delete.
 *
 * Authorised by Postgres RLS: the policies on `beats` only let the
 * owning producer UPDATE/DELETE their own rows, so the action only
 * needs to check that the auth session exists and pass the payload
 * through.
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BeatType } from "@/lib/supabase/database.types";

export interface UpdateBeatPayload {
  id: string;
  title: string;
  type: BeatType | null;
  bpm: number | null;
  key: string | null;
  mood: string[];
  artist_types: string[];
  description: string | null;
}

export interface ActionResult {
  error: string | null;
}

export async function updateBeatAction(
  payload: UpdateBeatPayload,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const cleanTitle = payload.title.trim();
  if (!cleanTitle) return { error: "Title is required." };

  const { error } = await supabase
    .from("beats")
    .update({
      title: cleanTitle,
      type: payload.type,
      bpm: payload.bpm,
      key: payload.key,
      mood: payload.mood,
      artist_types: payload.artist_types,
      description: payload.description?.trim() || null,
    })
    .eq("id", payload.id);

  if (error) return { error: error.message };

  revalidatePath("/library", "page");
  revalidatePath(`/beats/${payload.id}`, "page");
  return { error: null };
}

export async function deleteBeatAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  // 1. Resolve storage paths BEFORE the row goes away. RLS scopes
  // SELECT to the producer's own beats, so the lookup doubles as a
  // soft ownership check — if the lookup returns nothing, the
  // subsequent DELETE would also be a no-op.
  const { data: beat } = await supabase
    .from("beats")
    .select("audio_url, artwork_url")
    .eq("id", id)
    .maybeSingle<{ audio_url: string | null; artwork_url: string | null }>();

  // 2. Best-effort storage cleanup. We run these BEFORE the DB
  // delete so a failure here doesn't leave the row in a half-
  // deleted state. Errors are logged but never rolled back —
  // an orphan file in storage is recoverable; a stuck row isn't.
  if (beat?.audio_url) {
    const { error: rmAudio } = await supabase.storage
      .from("beat-audio")
      .remove([beat.audio_url]);
    if (rmAudio) {
      console.warn(
        "[deleteBeat] audio remove failed",
        beat.audio_url,
        rmAudio.message,
      );
    }
  }
  if (beat?.artwork_url) {
    // artwork_url is persisted as a public URL (the upload flow
    // calls getPublicUrl on the bucket and stores the result), so
    // we strip the bucket-relative path back out before passing
    // it to storage.remove(). If parsing fails we skip — better
    // to leave a small orphan file than crash a delete.
    const path = artworkPathFromUrl(beat.artwork_url);
    if (path) {
      const { error: rmArt } = await supabase.storage
        .from("beat-covers")
        .remove([path]);
      if (rmArt) {
        console.warn("[deleteBeat] artwork remove failed", path, rmArt.message);
      }
    }
  }

  // 3. DB delete — FK cascades clean server_beats, listens, likes,
  // beat_notes, beat_comments. notifications use ON DELETE SET NULL
  // so the artist's bell history survives the beat going away.
  const { error } = await supabase.from("beats").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/library", "page");
  revalidatePath("/dashboard", "page");
  // Artist surfaces see the beat disappear from server detail pages
  // they had access to.
  revalidatePath("/listen", "layout");
  redirect("/library");
}

/** Parse the bucket-relative path out of a Supabase storage public
 *  URL. Format: ".../storage/v1/object/public/<bucket>/<path>".
 *  Returns null when the input doesn't match — caller skips the
 *  remove() rather than feeding storage a bad key. */
function artworkPathFromUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/beat-covers/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}
