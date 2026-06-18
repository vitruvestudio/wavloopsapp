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
import {
  sendAccessGrantedEmail,
  sendAddedToServerEmail,
} from "@/lib/resend/emails";

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

export async function addArtistsToServerAction(
  serverId: string,
  contactIds: string[],
  serverSlug: string,
): Promise<AddArtistsResult> {
  const supabase = await createClient();

  if (contactIds.length === 0) return { error: null, added: 0 };

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
    await fanOutAddedToServer(serverId, fresh, serverSlug);
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

/** Resolves producer + server + recipient details and sends
 *  (a) an "added to server" email and (b) an in-app notification
 *  row per freshly added artist. Skips artists whose contact has
 *  no auth_user_id (they're not yet authenticated on Wavloops) —
 *  they still get the email so they know about the invite. */
async function fanOutAddedToServer(
  serverId: string,
  freshContactIds: string[],
  serverSlug: string,
): Promise<void> {
  if (freshContactIds.length === 0) return;
  const supabase = await createClient();

  // 1. Server + producer identity for the email + notif body.
  const { data: serverRow } = await supabase
    .from("servers")
    .select("name, owner_id")
    .eq("id", serverId)
    .maybeSingle<{ name: string; owner_id: string }>();
  if (!serverRow) return;

  const { data: producer } = await supabase
    .from("profiles")
    .select("handle, name, user_id")
    .eq("id", serverRow.owner_id)
    .maybeSingle<{
      handle: string | null;
      name: string | null;
      user_id: string;
    }>();
  const rawHandle = producer?.handle ?? producer?.name ?? "the producer";
  const producerHandle = rawHandle.startsWith("@")
    ? rawHandle
    : `@${rawHandle}`;

  // 2. Recipient contacts in one IN() round-trip.
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, email, auth_user_id")
    .in("id", freshContactIds);
  if (!contacts?.length) return;

  // 3. Phase 3.9.7.1 — fetch notif_prefs for authed contacts so
  //    we can honor `added_to_server` (in-app) + `email` (channel)
  //    toggles. Cold contacts (no auth_user_id) get the email by
  //    default — they're not yet on Wavloops and can't have a
  //    preference; the email IS the channel they have.
  const authedUserIds = contacts
    .map((c) => c.auth_user_id as string | null)
    .filter((id): id is string => id !== null);
  const prefsByUser = new Map<
    string,
    { added_to_server: boolean; email: boolean }
  >();
  if (authedUserIds.length > 0) {
    const { data: prefRows } = await supabase
      .from("artist_profiles")
      .select("user_id, notif_prefs")
      .in("user_id", authedUserIds)
      .returns<
        Array<{
          user_id: string;
          notif_prefs: Record<string, unknown> | null;
        }>
      >();
    for (const row of prefRows ?? []) {
      const np = row.notif_prefs ?? {};
      prefsByUser.set(row.user_id, {
        added_to_server: np.added_to_server !== false,
        email: np.email !== false,
      });
    }
  }
  // Default-on for missing prefs row — matches the Settings page
  // initial state so unopened-Settings artists still get pinged.
  const prefsFor = (uid: string) =>
    prefsByUser.get(uid) ?? { added_to_server: true, email: true };

  // 4. Batch the notification INSERTs for authed contacts that
  //    haven't opted out of added_to_server.
  const notifRows = contacts
    .filter((c) => c.auth_user_id !== null)
    .filter((c) => prefsFor(c.auth_user_id as string).added_to_server)
    .map((c) => ({
      recipient_user_id: c.auth_user_id as string,
      kind: "added_to_server" as const,
      actor_name: producerHandle,
      actor_seed: producerHandle,
      actor_user_id: producer?.user_id ?? null,
      body: `added you to ${serverRow.name}.`,
      server_id: serverId,
    }));
  if (notifRows.length > 0) {
    const { error: notifErr } = await supabase
      .from("notifications")
      .insert(notifRows);
    if (notifErr) {
      console.warn("[fanOutAddedToServer] notif insert", notifErr.message);
    }
  }

  // 5. Email — fire-and-forget per recipient. Skip when the
  //    authed artist has email=false in notif_prefs. Cold
  //    contacts (no auth_user_id) always get the email.
  for (const c of contacts) {
    if (c.auth_user_id) {
      const prefs = prefsFor(c.auth_user_id);
      if (!prefs.email || !prefs.added_to_server) continue;
    }
    try {
      await sendAddedToServerEmail({
        artistEmail: c.email,
        producerHandle,
        serverName: serverRow.name,
        serverSlug,
      });
    } catch (e) {
      console.warn("[fanOutAddedToServer] email", c.email, e);
    }
  }
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

export async function declineAccessRequestAction(
  serverId: string,
  contactId: string,
  serverSlug: string,
): Promise<AccessRequestResult> {
  const supabase = await createClient();
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
