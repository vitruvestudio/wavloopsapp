/**
 * Server-detail-page actions.
 *
 * - `addBeatsToServerAction` — INSERT (server_id, beat_id, position)
 *   rows for the selected beats. Positions are computed as
 *   `current_max_position + 1` per inserted beat so the newcomers
 *   land at the end of the existing list. Duplicates are dropped at
 *   the action layer (server_beats has a PK on (server_id, beat_id),
 *   so a re-add would fail with 23505 — we filter beforehand to keep
 *   the message clean and to make the call idempotent).
 *
 * RLS gates everything: the `server_beats_owner_all` policy already
 * checks that the producer owns the parent server, so this action
 * doesn't need to re-validate ownership in app code.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AddBeatsResult {
  error: string | null;
  added: number;
}

export async function addBeatsToServerAction(
  serverId: string,
  beatIds: string[],
  serverSlug: string,
): Promise<AddBeatsResult> {
  const supabase = await createClient();

  if (beatIds.length === 0) return { error: null, added: 0 };

  // Find the current highest position so newcomers land at the end.
  const { data: maxRow } = await supabase
    .from("server_beats")
    .select("position")
    .eq("server_id", serverId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const startPosition = (maxRow?.position ?? -1) + 1;

  // Drop any beat that's already in the server — keeps the action
  // idempotent and avoids surfacing a unique-violation error to the
  // producer when the modal's filter is briefly stale.
  const { data: existing } = await supabase
    .from("server_beats")
    .select("beat_id")
    .eq("server_id", serverId)
    .in("beat_id", beatIds);
  const alreadyIn = new Set((existing ?? []).map((r) => r.beat_id));
  const fresh = beatIds.filter((id) => !alreadyIn.has(id));
  if (fresh.length === 0) return { error: null, added: 0 };

  const rows = fresh.map((bid, i) => ({
    server_id: serverId,
    beat_id: bid,
    position: startPosition + i,
  }));

  const { error } = await supabase.from("server_beats").insert(rows);
  if (error) return { error: error.message, added: 0 };

  revalidatePath(`/servers/${serverSlug}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/library", "page");
  return { error: null, added: fresh.length };
}
