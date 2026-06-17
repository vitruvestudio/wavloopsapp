/**
 * Artist-side server actions — persist like / listen / note /
 * comment from /listen/*.
 *
 * All actions resolve the (contact_id, server_id, owner_id) tuple
 * for the current user from the slug, server-side. The client only
 * has to pass the slug + beat_id (+ the toggle / body / visibility
 * payload), which keeps the call sites trivial and prevents the
 * client from spoofing a contact_id that isn't theirs.
 *
 * Auth scope: every action calls supabase.auth.getUser() and bails
 * with an error if there's no session. RLS on the underlying tables
 * is a second line of defense — every write also passes the
 * artist-owned policy check.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface ServerCtx {
  userId: string;
  contactId: string;
  serverId: string;
}

/** Resolves (user, contact, server) from the slug. Returns null on
 *  any miss — caller maps that to an "auth or scope" error. */
async function resolveCtx(slug: string): Promise<ServerCtx | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: serverRow } = await supabase
    .from("servers")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle<{ id: string; owner_id: string }>();
  if (!serverRow) return null;

  const { data: contactRow } = await supabase
    .from("contacts")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("owner_id", serverRow.owner_id)
    .maybeSingle<{ id: string }>();
  if (!contactRow) return null;

  return {
    userId: user.id,
    contactId: contactRow.id,
    serverId: serverRow.id,
  };
}

/* ============================================================
   Like
   ============================================================ */

/** Toggles the like state for (contact, beat). Authoritative —
 *  the action reads the current DB state itself instead of
 *  trusting a `currentlyLiked` flag from the client, so a stale
 *  local UI (or a duplicate click) can never desync into a unique-
 *  constraint violation. Idempotent: clicking like on an already-
 *  liked beat returns ok with no change. */
export async function toggleLikeAction(
  slug: string,
  beatId: string,
  _ignored?: boolean,
): Promise<ActionResult> {
  const ctx = await resolveCtx(slug);
  if (!ctx) return { ok: false, error: "Not signed in or not a contact." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("contact_id", ctx.contactId)
    .eq("beat_id", beatId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("likes").insert({
      contact_id: ctx.contactId,
      beat_id: beatId,
      server_id: ctx.serverId,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/listen/${slug}`);
  revalidatePath("/listen/liked");
  return { ok: true };
}

/* ============================================================
   Listen — fired on play. listens has no UNIQUE so every play is
   a row (good for engagement counters); the artist UI only cares
   whether at least one row exists.
   ============================================================ */

export async function markListenedAction(
  slug: string,
  beatId: string,
  completionPct?: number,
): Promise<ActionResult> {
  const ctx = await resolveCtx(slug);
  if (!ctx) return { ok: false, error: "Not signed in or not a contact." };
  const supabase = await createClient();

  const { error } = await supabase.from("listens").insert({
    contact_id: ctx.contactId,
    beat_id: beatId,
    server_id: ctx.serverId,
    completion_pct:
      typeof completionPct === "number"
        ? Math.max(0, Math.min(1, completionPct))
        : null,
  });
  if (error) return { ok: false, error: error.message };

  // No revalidate — listens count is a stat shown to the producer,
  // not surfaced to the artist's UI.
  return { ok: true };
}

/* ============================================================
   Note — branches on visibility:
     "private" → UPSERT beat_notes (one per artist+beat).
     "shared"  → INSERT beat_comments (many per artist+beat, kept
                 as a history the producer reads).
   Empty body in either mode is treated as a delete of the private
   note (shared comments are never auto-deleted — they were already
   sent to the producer).
   ============================================================ */

export async function saveBeatNoteAction(
  slug: string,
  beatId: string,
  body: string,
  visibility: "private" | "shared",
): Promise<ActionResult> {
  const ctx = await resolveCtx(slug);
  if (!ctx) return { ok: false, error: "Not signed in or not a contact." };
  const supabase = await createClient();
  const trimmed = body.trim();

  if (visibility === "private") {
    if (!trimmed) {
      const { error } = await supabase
        .from("beat_notes")
        .delete()
        .eq("user_id", ctx.userId)
        .eq("beat_id", beatId);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("beat_notes").upsert(
        {
          user_id: ctx.userId,
          beat_id: beatId,
          body: trimmed,
        },
        { onConflict: "beat_id,user_id" },
      );
      if (error) return { ok: false, error: error.message };
    }
  } else {
    // Sharing an empty body is a no-op — there's nothing to send.
    if (trimmed) {
      const { error } = await supabase.from("beat_comments").insert({
        user_id: ctx.userId,
        beat_id: beatId,
        body: trimmed,
      });
      if (error) return { ok: false, error: error.message };
    }
  }

  revalidatePath(`/listen/${slug}`);
  return { ok: true };
}
