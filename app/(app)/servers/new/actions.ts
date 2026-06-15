/**
 * Create-Server server action.
 *
 * Inputs the full form payload, INSERTs the `servers` row, then
 * INSERTs one `server_beats` row per checked beat id. Handles slug
 * collisions by suffixing -2, -3, … and retrying up to 10 times.
 * Revalidates /dashboard so the new card shows up immediately and
 * redirects to /dashboard (the per-server `/servers/<slug>` view
 * arrives in J3.5).
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type {
  ArtworkMode,
  Visibility,
} from "@/lib/supabase/database.types";

export interface CreateServerPayload {
  name: string;
  style_text: string | null;
  description: string | null;
  artist_types: string[];
  artwork_mode: ArtworkMode;
  accent_hue: number | null;
  visibility: Visibility;
  beat_ids: string[];
}

export interface CreateServerResult {
  error: string | null;
}

const POSTGRES_UNIQUE_VIOLATION = "23505";

export async function createServerAction(
  payload: CreateServerPayload,
): Promise<CreateServerResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

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

  const cleanName = payload.name.trim();
  if (!cleanName) return { error: "Server name is required." };

  const baseSlug = slugify(cleanName) || "server";

  // Try the base slug first, then -2, -3, … up to -10. Anything beyond
  // that and we fall back to a short random suffix so the producer
  // isn't blocked.
  let createdServer: { id: string; slug: string } | null = null;
  let lastErr: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("servers")
      .insert({
        owner_id: profile.id,
        name: cleanName,
        slug,
        style_text: payload.style_text || null,
        description: payload.description || null,
        artist_types: payload.artist_types,
        artwork_mode: payload.artwork_mode,
        accent_hue: payload.accent_hue,
        visibility: payload.visibility,
      })
      .select("id, slug")
      .single();

    if (!error && data) {
      createdServer = data;
      break;
    }

    lastErr = { code: error?.code, message: error?.message ?? "Insert failed" };
    if (error?.code !== POSTGRES_UNIQUE_VIOLATION) {
      return { error: error?.message ?? "Could not create the server." };
    }
    // Loop and try the next suffix.
  }

  if (!createdServer) {
    // Random suffix fallback — better than dead-ending the form.
    const rand = Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase
      .from("servers")
      .insert({
        owner_id: profile.id,
        name: cleanName,
        slug: `${baseSlug}-${rand}`,
        style_text: payload.style_text || null,
        description: payload.description || null,
        artist_types: payload.artist_types,
        artwork_mode: payload.artwork_mode,
        accent_hue: payload.accent_hue,
        visibility: payload.visibility,
      })
      .select("id, slug")
      .single();
    if (error || !data) {
      return { error: lastErr?.message ?? "Could not create the server." };
    }
    createdServer = data;
  }

  // Attach checked beats — same order as the form
  if (payload.beat_ids.length > 0) {
    const rows = payload.beat_ids.map((bid, i) => ({
      server_id: createdServer!.id,
      beat_id: bid,
      position: i,
    }));
    const { error: pivotErr } = await supabase
      .from("server_beats")
      .insert(rows);
    if (pivotErr) {
      return {
        error: `Server created but couldn't attach beats: ${pivotErr.message}`,
      };
    }
  }

  revalidatePath("/dashboard", "page");
  revalidatePath("/library", "page");
  // J3.5 will replace this with `/servers/${createdServer.slug}`.
  redirect("/dashboard");
}
