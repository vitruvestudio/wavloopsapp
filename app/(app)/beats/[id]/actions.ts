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

  // server_beats cascades on beat delete; the audio file in Storage
  // will be cleaned up by a janitor cron post-launch.
  const { error } = await supabase.from("beats").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/library", "page");
  redirect("/library");
}
