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
import { assertServerOwnership } from "@/lib/supabase/ownership";
import { createClient } from "@/lib/supabase/server";
import { sendAccessGrantedEmail } from "@/lib/resend/emails";
import { fanOutAddedToServer } from "@/lib/notifications/added-to-server";

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

  const guard = await assertServerOwnership(supabase, serverId);
  if (guard.error) return { error: guard.error, added: 0 };

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

  // Upload notifs are produced by the server_beats AFTER INSERT
  // trigger from migration #28 — that way the upload-page flow
  // (which INSERTs server_beats directly without going through
  // this action) also fans out. No JS-side fan-out here.

  revalidatePath(`/servers/${serverSlug}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/library", "page");
  revalidatePath("/listen", "layout");
  return { error: null, added: fresh.length };
}

/* ================================================================
   addArtistsToServerAction — bulk-attach existing address-book
   contacts to this server via the server_contacts pivot.
   ================================================================
   Same idempotency shape as addBeatsToServerAction:
     - dedup against the existing pivot rows so re-clicking on a
       briefly-stale modal doesn't 23505
     - INSERT only the fresh subset
     - revalidate the server detail + dashboard
   RLS via `server_contacts_owner_all` gates ownership of the server.
*/
export interface AddArtistsResult {
  error: string | null;
  added: number;
}

export interface RemoveArtistResult {
  error: string | null;
}

export interface RemoveBeatResult {
  error: string | null;
}

/**
 * removeBeatFromServerAction — DELETE the (server_id, beat_id) row
 * from server_beats so the beat disappears from THIS server's
 * playlist. The beat itself stays in the producer's library and
 * any other server memberships are untouched.
 *
 * RLS (server_beats_owner_all) already gates the delete; we also
 * re-check ownership in app code so the UI surfaces a clean
 * error string instead of a silent no-op when the policy denies.
 */
export async function removeBeatFromServerAction(
  serverId: string,
  beatId: string,
  serverSlug: string,
): Promise<RemoveBeatResult> {
  const supabase = await createClient();

  const guard = await assertServerOwnership(supabase, serverId);
  if (guard.error) return { error: guard.error };

  const { error } = await supabase
    .from("server_beats")
    .delete()
    .eq("server_id", serverId)
    .eq("beat_id", beatId);
  if (error) return { error: error.message };

  revalidatePath(`/servers/${serverSlug}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/library", "page");
  // Listen layout — granted artists' bell/server list should reflect
  // the change without waiting for the realtime tick.
  revalidatePath("/listen", "layout");
  return { error: null };
}

/**
 * removeArtistFromServerAction — DELETE the (server_id, contact_id)
 * row from server_contacts so the artist loses access to this
 * specific server. The contact itself stays in the address book,
 * any other server memberships are untouched.
 *
 * RLS (server_contacts_owner_all) already gates that the caller
 * owns the server; we still re-check ownership here so the UI
 * surfaces a clean error string instead of a silent no-op when
 * the policy denies the delete.
 */
export async function removeArtistFromServerAction(
  serverId: string,
  contactId: string,
  serverSlug: string,
): Promise<RemoveArtistResult> {
  const supabase = await createClient();

  const guard = await assertServerOwnership(supabase, serverId);
  if (guard.error) return { error: guard.error };

  const { error } = await supabase
    .from("server_contacts")
    .delete()
    .eq("server_id", serverId)
    .eq("contact_id", contactId);
  if (error) return { error: error.message };

  revalidatePath(`/servers/${serverSlug}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/contacts", "page");
  // Refresh the artist surface so the removed artist's bell stops
  // surfacing this server in their list without waiting for the
  // next realtime tick.
  revalidatePath("/listen", "layout");
  return { error: null };
}

export async function addArtistsToServerAction(
  serverId: string,
  contactIds: string[],
  serverSlug: string,
): Promise<AddArtistsResult> {
  const supabase = await createClient();

  if (contactIds.length === 0) return { error: null, added: 0 };

  const guard = await assertServerOwnership(supabase, serverId);
  if (guard.error) return { error: guard.error, added: 0 };

  const { data: existing } = await supabase
    .from("server_contacts")
    .select("contact_id")
    .eq("server_id", serverId)
    .in("contact_id", contactIds);
  const alreadyIn = new Set((existing ?? []).map((r) => r.contact_id));
  const fresh = contactIds.filter((id) => !alreadyIn.has(id));
  if (fresh.length === 0) return { error: null, added: 0 };

  const rows = fresh.map((cid) => ({
    server_id: serverId,
    contact_id: cid,
  }));
  const { error } = await supabase.from("server_contacts").insert(rows);
  if (error) return { error: error.message, added: 0 };

  // Phase 3.9.6.1 — fan-out side effects to each freshly-added
  // artist. Best-effort: a Resend hiccup or a missing
  // recipient row should NOT roll back the membership write —
  // the producer already saw "X added" and the contacts will
  // appear on the server. Errors are logged for ops triage.
  try {
    await fanOutAddedToServer(supabase, serverId, serverSlug, fresh);
  } catch (e) {
    console.warn("[addArtistsToServer] notif fan-out failed", e);
  }

  revalidatePath(`/servers/${serverSlug}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/contacts", "page");
  // Refresh the artist surface so new in-app notifs land on their
  // bell without waiting for the realtime sub to deliver.
  revalidatePath("/listen", "layout");
  return { error: null, added: fresh.length };
}


/* ============================================================
   Access-request approval flow (Phase 3.8.5)

   Two actions consumed by the Requests tab on /servers/[slug]:
     - approveAccessRequestAction → status='granted', granted_at=now
     - declineAccessRequestAction → DELETE the pending row

   RLS via server_contacts_owner_all already gates both writes to
   the producer who owns the server.

   The `.eq("status", "pending")` guard makes both calls no-ops if
   the row was already approved/declined by a parallel tab — keeps
   the producer's UI safe against double-clicks across windows.
   ============================================================ */

export interface AccessRequestResult {
  error: string | null;
}

export async function approveAccessRequestAction(
  serverId: string,
  contactId: string,
  serverSlug: string,
): Promise<AccessRequestResult> {
  const supabase = await createClient();

  const guard = await assertServerOwnership(supabase, serverId);
  if (guard.error) return { error: guard.error };

  const { error } = await supabase
    .from("server_contacts")
    .update({
      status: "granted",
      granted_at: new Date().toISOString(),
    })
    .eq("server_id", serverId)
    .eq("contact_id", contactId)
    .eq("status", "pending");
  if (error) return { error: error.message };

  // Fire the access-granted email to the artist. Best-effort — a
  // Resend failure should NOT roll back the approval. We fetch the
  // artist email + producer handle + server name in parallel; all
  // three reads pass through RLS owned by the producer's session.
  try {
    const [serverRes, contactRes] = await Promise.all([
      supabase
        .from("servers")
        .select("name, owner_id")
        .eq("id", serverId)
        .maybeSingle<{ name: string; owner_id: string }>(),
      supabase
        .from("contacts")
        .select("email, auth_user_id")
        .eq("id", contactId)
        .maybeSingle<{ email: string; auth_user_id: string | null }>(),
    ]);
    const ownerId = serverRes.data?.owner_id;
    const serverName = serverRes.data?.name;
    const artistEmail = contactRes.data?.email;
    const artistAuthId = contactRes.data?.auth_user_id ?? null;
    let producerHandle = "the producer";
    if (ownerId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("handle, name")
        .eq("id", ownerId)
        .maybeSingle<{ handle: string | null; name: string | null }>();
      const raw = profile?.handle ?? profile?.name ?? "producer";
      producerHandle = raw.startsWith("@") ? raw : `@${raw}`;
    }
    // Phase 3.9.7.1 — honor notif_prefs.email. Cold contacts
    // (auth_user_id null) always get the email since they have
    // no Settings page to opt out from.
    let wantsEmail = true;
    if (artistAuthId) {
      const { data: prefs } = await supabase
        .from("artist_profiles")
        .select("notif_prefs")
        .eq("user_id", artistAuthId)
        .maybeSingle<{ notif_prefs: Record<string, unknown> | null }>();
      wantsEmail = prefs?.notif_prefs?.email !== false;
    }
    if (artistEmail && serverName && wantsEmail) {
      await sendAccessGrantedEmail({
        artistEmail,
        producerHandle,
        serverName,
        serverSlug,
      });
    }
  } catch (e) {
    console.warn("[approve-action] access-granted email failed", e);
  }

  revalidatePath(`/servers/${serverSlug}`, "page");
  revalidatePath("/dashboard", "page");
  // The artist's /listen surface picks up the new server on next
  // read — layout revalidate covers their sidebar + server list.
  revalidatePath("/listen", "layout");
  return { error: null };
}

/** Delete a server. Cascades on:
 *   - server_beats          (FK ON DELETE CASCADE)
 *   - server_contacts       (FK ON DELETE CASCADE)
 *   - access_requests       (FK ON DELETE CASCADE)
 *   - server_invites        (FK ON DELETE CASCADE)
 *
 * Listens and likes use beat-level FKs, so they're untouched.
 *
 * Storage: best-effort cleanup of the uploaded artwork file if
 * any. Failure is logged but never rolls back the row delete —
 * an orphan PNG is recoverable; a stuck DB row isn't. */
export interface DeleteServerResult {
  error: string | null;
}

export async function deleteServerAction(
  serverId: string,
): Promise<DeleteServerResult> {
  const supabase = await createClient();

  const guard = await assertServerOwnership(supabase, serverId);
  if (guard.error) return { error: guard.error };

  // Resolve the artwork path BEFORE the delete so the storage
  // cleanup can target the right file.
  const { data: server } = await supabase
    .from("servers")
    .select("slug, artwork_image_url")
    .eq("id", serverId)
    .maybeSingle<{ slug: string; artwork_image_url: string | null }>();

  if (server?.artwork_image_url) {
    const path = serverArtworkPathFromUrl(server.artwork_image_url);
    if (path) {
      const { error: rmErr } = await supabase.storage
        .from("server-covers")
        .remove([path]);
      if (rmErr) {
        console.warn("[deleteServer] artwork remove failed", path, rmErr.message);
      }
    }
  }

  const { error } = await supabase
    .from("servers")
    .delete()
    .eq("id", serverId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard", "page");
  // Artist /listen surfaces lose this server from their feeds.
  revalidatePath("/listen", "layout");
  if (server?.slug) {
    revalidatePath(`/s/${server.slug}`, "page");
  }
  return { error: null };
}

/** Parse the bucket-relative path out of a Supabase storage
 *  public URL. Matches the format used by Create / Edit Server
 *  when it uploads to the `server-covers` bucket. Returns null
 *  when the input doesn't look like a server cover URL so the
 *  caller can skip the remove() rather than feed storage a bad
 *  key. */
function serverArtworkPathFromUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/server-covers/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export async function declineAccessRequestAction(
  serverId: string,
  contactId: string,
  serverSlug: string,
): Promise<AccessRequestResult> {
  const supabase = await createClient();

  const guard = await assertServerOwnership(supabase, serverId);
  if (guard.error) return { error: guard.error };

  const { error } = await supabase
    .from("server_contacts")
    .delete()
    .eq("server_id", serverId)
    .eq("contact_id", contactId)
    .eq("status", "pending");
  if (error) return { error: error.message };

  revalidatePath(`/servers/${serverSlug}`, "page");
  return { error: null };
}
