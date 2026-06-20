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
import { checkServerQuota } from "@/lib/billing/gates";
import { assertServerOwnership } from "@/lib/supabase/ownership";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type {
  ArtworkMode,
  Visibility,
} from "@/lib/supabase/database.types";

export interface UpdateServerPayload {
  id: string;
  name: string;
  style_text: string | null;
  description: string | null;
  artist_types: string[];
  artwork_mode: ArtworkMode;
  accent_hue: number | null;
  /** Final URL to persist. The client decides between
   *    - the existing URL (no change)
   *    - a newly uploaded URL (replaced artwork)
   *    - null (artwork removed or mode != 'image')
   *  This action just stores what it's given. */
  artwork_image_url: string | null;
  visibility: Visibility;
  beat_ids: string[];
}

export interface UpdateServerResult {
  error: string | null;
  /** Same slug the server already had — we keep slugs stable across
   *  renames so shared artist links don't break. Returned for the
   *  client to redirect with. */
  slug: string | null;
}

export interface CreateServerPayload {
  name: string;
  style_text: string | null;
  description: string | null;
  artist_types: string[];
  artwork_mode: ArtworkMode;
  accent_hue: number | null;
  /** Public URL of the uploaded custom cover image (server-covers
   *  bucket), or null when artwork_mode !== 'image'. The client
   *  performs the upload before calling this action. */
  artwork_image_url: string | null;
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

  // Billing gate — Free plan capped at 1 server, Lifetime at 3.
  // checkServerQuota() reads the cached plan + live usage; this is
  // the only place that knows about quotas. Phase 4.
  const serverGate = await checkServerQuota();
  if (!serverGate.ok) return { error: serverGate.reason };

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
        artwork_image_url: payload.artwork_image_url,
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
    // crypto.randomUUID gives ~122 bits; we take 12 hex chars =
    // 48 bits. Sequential -2/-3 suffixes are predictable enough
    // that an attacker could lazily enumerate slugs they don't
    // own (RLS gates access either way, but no need to hand
    // them the existence signal).
    const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
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
        artwork_image_url: payload.artwork_image_url,
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
  redirect(`/servers/${createdServer.slug}`);
}

/* ================================================================
   updateServerAction — edit an existing server.
   ================================================================
   RLS via `servers_owner_update` policy gates this to the producer.
   Slug is kept stable on rename so shared links don't break. Beats
   are re-attached via a DELETE-then-INSERT — simpler than diffing
   and at V1 scale (a few dozen beats per server max) the cost is
   trivial. */
export async function updateServerAction(
  payload: UpdateServerPayload,
): Promise<UpdateServerResult> {
  const supabase = await createClient();

  const cleanName = payload.name.trim();
  if (!cleanName) return { error: "Server name is required.", slug: null };

  const guard = await assertServerOwnership(supabase, payload.id);
  if (guard.error) return { error: guard.error, slug: null };

  // UPDATE the server row. RLS prevents an attacker from touching
  // someone else's server — owner_id is implicit in the policy.
  const { data: updated, error: updateErr } = await supabase
    .from("servers")
    .update({
      name: cleanName,
      style_text: payload.style_text || null,
      description: payload.description || null,
      artist_types: payload.artist_types,
      artwork_mode: payload.artwork_mode,
      accent_hue: payload.accent_hue,
      artwork_image_url: payload.artwork_image_url,
      visibility: payload.visibility,
    })
    .eq("id", payload.id)
    .select("slug")
    .single();

  if (updateErr || !updated) {
    return {
      error: updateErr?.message ?? "Could not update the server.",
      slug: null,
    };
  }

  // Re-attach beats: wipe the pivot then re-INSERT in the new order.
  // Cleaner than diffing for our scale, and idempotent.
  const { error: delErr } = await supabase
    .from("server_beats")
    .delete()
    .eq("server_id", payload.id);
  if (delErr) {
    return {
      error: `Server updated but couldn't refresh its beats: ${delErr.message}`,
      slug: updated.slug,
    };
  }

  if (payload.beat_ids.length > 0) {
    const rows = payload.beat_ids.map((bid, i) => ({
      server_id: payload.id,
      beat_id: bid,
      position: i,
    }));
    const { error: pivotErr } = await supabase
      .from("server_beats")
      .insert(rows);
    if (pivotErr) {
      return {
        error: `Server updated but couldn't re-attach beats: ${pivotErr.message}`,
        slug: updated.slug,
      };
    }
  }

  revalidatePath(`/servers/${updated.slug}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/library", "page");
  return { error: null, slug: updated.slug };
}
