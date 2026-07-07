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
import { after } from "next/server";
import { checkServerQuota } from "@/lib/billing/gates";
import { assertServerOwnership } from "@/lib/supabase/ownership";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type {
  ArtworkMode,
  Visibility,
} from "@/lib/supabase/database.types";
import {
  capture as posthogCapture,
  flushServerEvents,
} from "@/lib/analytics/posthog-server";

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
  /** When true, granted artists can download the audio file of
   *  every beat in this server. UI hides the download affordance
   *  when false; the /api/beats/<id>/download route re-checks the
   *  same flag at the network layer (UI hiding is not security). */
  downloads_allowed: boolean;
  /** Display-only override. When true AND artwork_image_url is
   *  set, every beat rendered in this server's artist + producer
   *  surfaces borrows the server artwork instead of its own
   *  beats.artwork_url. Beats keep their original cover in the
   *  library and in other servers — the swap happens at the
   *  loader / adapter layer only. */
  force_artwork_on_beats: boolean;
  /** Persona this server targets — drives the producer-nurture
   *  email sequence:
   *    - 'producers' = loops for other producers to chop / flip.
   *      Contacts who joined the server enter the producer-
   *      nurture sequence after granted.
   *    - 'artists'   = beats for rappers / singers to topline on.
   *      No sequence yet (different copy ships in a later phase).
   *  Picked explicitly by the producer at the create / edit form
   *  rather than inferred from beat.type — inference would mis-
   *  fire on edge cases like loops shared with rappers (the
   *  scout-and-compose pattern), and the cost of mis-sending the
   *  wrong nurture sequence to the wrong persona is high. */
  audience_type: "producers" | "artists";
  beat_ids: string[];
}

export interface UpdateServerResult {
  error: string | null;
  /** Canonical slug after the save. Equals the previous slug when
   *  the rename produced no change; equals the new slug when the
   *  name change generated a fresh one — in that case the previous
   *  slug is preserved in `server_slug_aliases` so any link already
   *  shared keeps resolving through the route-level redirect. The
   *  caller redirects with this value. */
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
  /** See UpdateServerPayload.downloads_allowed. */
  downloads_allowed: boolean;
  /** See UpdateServerPayload.force_artwork_on_beats. */
  force_artwork_on_beats: boolean;
  /** See UpdateServerPayload.audience_type. */
  audience_type: "producers" | "artists";
  beat_ids: string[];
}

import type { PlanKey } from "@/lib/billing/plans";

export interface CreateServerResult {
  error: string | null;
  /** Set when the error came from a billing gate — the client
   *  uses this to swap the inline banner for the UpgradeRequired
   *  modal. Carries the current plan so the modal can render the
   *  right tiers. */
  upgradeRequired?: { plan: PlanKey };
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
  if (!serverGate.ok)
    return {
      error: serverGate.reason,
      upgradeRequired: { plan: serverGate.plan },
    };

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
        downloads_allowed: payload.downloads_allowed,
        force_artwork_on_beats: payload.force_artwork_on_beats,
        audience_type: payload.audience_type,
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
        downloads_allowed: payload.downloads_allowed,
        force_artwork_on_beats: payload.force_artwork_on_beats,
        audience_type: payload.audience_type,
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

  // PostHog: producer funnel event. Runs after the redirect so it
  // never delays navigation. Only fires on the happy path — errors
  // above returned early and short-circuited the funnel already.
  const serverIdForEvent = createdServer.id;
  const serverSlugForEvent = createdServer.slug;
  const beatCount = payload.beat_ids.length;
  const audienceType = payload.audience_type;
  const visibility = payload.visibility;
  after(async () => {
    try {
      await posthogCapture(user.id, "server_created", {
        server_id: serverIdForEvent,
        server_slug: serverSlugForEvent,
        audience_type: audienceType,
        visibility,
        starting_beat_count: beatCount,
      });
      await flushServerEvents();
    } catch (e) {
      console.warn("[server_created] posthog failed", e);
    }
  });

  redirect(`/servers/${createdServer.slug}`);
}

/* ================================================================
   updateServerAction — edit an existing server.
   ================================================================
   RLS via `servers_owner_update` policy gates this to the producer.
   Slug regenerates from the new name when it changes; the previous
   slug is preserved in `server_slug_aliases` so links already shared
   keep resolving via the route-level redirect. Beats are re-attached
   via a diff against the current pivot rows. */
export async function updateServerAction(
  payload: UpdateServerPayload,
): Promise<UpdateServerResult> {
  const supabase = await createClient();

  const cleanName = payload.name.trim();
  if (!cleanName) return { error: "Server name is required.", slug: null };

  const guard = await assertServerOwnership(supabase, payload.id);
  if (guard.error) return { error: guard.error, slug: null };

  // Read the current slug BEFORE the update so we can detect a
  // rename and preserve the old slug as an alias.
  const { data: existing } = await supabase
    .from("servers")
    .select("slug")
    .eq("id", payload.id)
    .maybeSingle<{ slug: string }>();
  const oldSlug = existing?.slug ?? null;

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
      downloads_allowed: payload.downloads_allowed,
        force_artwork_on_beats: payload.force_artwork_on_beats,
        audience_type: payload.audience_type,
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

  // ── Slug regeneration ────────────────────────────────────
  // When the name slug differs from the current slug, swap the
  // server to the new slug and preserve the old one as an alias
  // so links already shared keep working via the route-level
  // redirect (/s/[slug] + /listen/[slug]).
  //
  // Uniqueness: the candidate must not collide with any other
  // server's slug NOR with any alias pointing at a different
  // server. We probe up to 10 variants (base, base-2, base-3, …)
  // before falling back to keeping the existing slug — a producer
  // is never blocked from saving the rest of their edit.
  //
  // The whole block is best-effort: if the uniqueness probe or
  // the slug write fails partway, we keep oldSlug as the canonical
  // slug rather than ending up half-migrated.
  let finalSlug = updated.slug as string;
  const newBaseSlug = slugify(cleanName) || "server";
  if (oldSlug && newBaseSlug !== oldSlug) {
    let chosen: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate =
        attempt === 0 ? newBaseSlug : `${newBaseSlug}-${attempt + 1}`;

      // Does another server already own this slug?
      const { data: serverConflict } = await supabase
        .from("servers")
        .select("id")
        .eq("slug", candidate)
        .neq("id", payload.id)
        .maybeSingle();
      if (serverConflict) continue;

      // Does another server's alias already squat on it? Aliases
      // pointing at THIS server are fine — they just mean the
      // producer is reverting to a previous slug, in which case
      // we'll delete the matching alias below before the update.
      const { data: aliasConflict } = await supabase
        .from("server_slug_aliases")
        .select("alias")
        .eq("alias", candidate)
        .neq("server_id", payload.id)
        .maybeSingle();
      if (aliasConflict) continue;

      chosen = candidate;
      break;
    }

    if (chosen) {
      // Preserve the old slug as an alias. Upsert so repeated
      // renames don't error on the PK constraint.
      const { error: aliasErr } = await supabase
        .from("server_slug_aliases")
        .upsert(
          { alias: oldSlug, server_id: payload.id },
          { onConflict: "alias" },
        );
      if (!aliasErr) {
        // If the new slug matches an alias of THIS server (revert
        // case), drop that alias so we don't fight ourselves on
        // the slug write.
        await supabase
          .from("server_slug_aliases")
          .delete()
          .eq("alias", chosen)
          .eq("server_id", payload.id);

        const { error: slugErr } = await supabase
          .from("servers")
          .update({ slug: chosen })
          .eq("id", payload.id);
        if (!slugErr) {
          finalSlug = chosen;
        }
      }
    }
  }

  // Re-attach beats via a diff against the current pivot rows.
  //
  // We used to wipe-and-rebuild the whole pivot (DELETE + INSERT
  // every row) because at our scale the CPU cost is trivial. The
  // catch: server_beats carries an AFTER INSERT trigger
  // (notify_server_beat_added → migration 20260618170000) that
  // fans out an 'upload' notification PER row PER granted artist
  // and feeds the /api/cron/batch-upload-emails digest. So every
  // server edit — even one that just renamed the server — was
  // spamming every artist on the server with N notifications and,
  // 10 minutes later, a digest email about beats that weren't
  // actually new.
  //
  // The diff below fires the trigger ONLY for beats that are
  // genuinely new on this server. Removed beats DELETE silently
  // (no trigger). Beats that stay in the server but change
  // position UPDATE silently (no AFTER INSERT). Pure metadata
  // edits (name, visibility, downloads, …) touch zero pivot
  // rows now, which is the whole point.
  //
  // Position column has no unique constraint (the table's PK is
  // (server_id, beat_id)), so we can sequentially UPDATE
  // positions without swap collisions — no negative-position
  // intermediate step needed.
  const { data: currentRows, error: fetchErr } = await supabase
    .from("server_beats")
    .select("beat_id, position")
    .eq("server_id", payload.id);
  if (fetchErr) {
    return {
      error: `Server updated but couldn't read its beats: ${fetchErr.message}`,
      slug: finalSlug,
    };
  }

  const currentPositionByBeat = new Map<string, number>(
    (currentRows ?? []).map((r) => [
      r.beat_id as string,
      r.position as number,
    ]),
  );
  const incomingSet = new Set(payload.beat_ids);

  const toRemove: string[] = [];
  for (const beatId of currentPositionByBeat.keys()) {
    if (!incomingSet.has(beatId)) toRemove.push(beatId);
  }

  const toAdd: Array<{
    server_id: string;
    beat_id: string;
    position: number;
  }> = [];
  const toReposition: Array<{ beat_id: string; position: number }> = [];
  payload.beat_ids.forEach((bid, i) => {
    const currentPos = currentPositionByBeat.get(bid);
    if (currentPos === undefined) {
      toAdd.push({ server_id: payload.id, beat_id: bid, position: i });
    } else if (currentPos !== i) {
      toReposition.push({ beat_id: bid, position: i });
    }
  });

  // 1. Remove beats no longer in the list.
  if (toRemove.length > 0) {
    const { error: delErr } = await supabase
      .from("server_beats")
      .delete()
      .eq("server_id", payload.id)
      .in("beat_id", toRemove);
    if (delErr) {
      return {
        error: `Server updated but couldn't remove dropped beats: ${delErr.message}`,
        slug: finalSlug,
      };
    }
  }

  // 2. Insert genuinely-new beats. This is the only branch that
  //    fires the upload notification trigger — exactly what we
  //    want.
  if (toAdd.length > 0) {
    const { error: insErr } = await supabase
      .from("server_beats")
      .insert(toAdd);
    if (insErr) {
      return {
        error: `Server updated but couldn't add new beats: ${insErr.message}`,
        slug: finalSlug,
      };
    }
  }

  // 3. Reposition beats that stayed in the server. UPDATE doesn't
  //    fire the AFTER INSERT trigger, so no spurious notifs. Done
  //    sequentially since N is tiny (a few dozen at most) and the
  //    Supabase JS client doesn't batch updates with different
  //    WHERE clauses.
  for (const { beat_id, position } of toReposition) {
    const { error: posErr } = await supabase
      .from("server_beats")
      .update({ position })
      .eq("server_id", payload.id)
      .eq("beat_id", beat_id);
    if (posErr) {
      return {
        error: `Server updated but couldn't reorder beats: ${posErr.message}`,
        slug: finalSlug,
      };
    }
  }

  revalidatePath(`/servers/${finalSlug}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/library", "page");
  return { error: null, slug: finalSlug };
}
