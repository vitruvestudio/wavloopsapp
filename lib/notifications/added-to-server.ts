/**
 * Shared 'added to server' fan-out.
 *
 * Two entry points add an artist to a server today:
 *   1. addArtistsToServerAction (servers/[slug]/actions.ts)
 *      — 'Pick from address book' path in AddArtistsModal.
 *   2. addContactAction (contacts/actions.ts)
 *      — 'Create new contact + add to servers' path in
 *        AddContactModal (also used by /servers/[slug] via the
 *        'Create new' button inside the picker).
 *
 * Before this helper existed, only path (1) fired the
 * notification + email fan-out. Path (2) silently INSERTed
 * server_contacts and returned — the artist never heard about
 * being added (no email, no in-app bell). This module centralises
 * the fan-out so both paths produce the same side effects.
 *
 * NOT a server action — kept outside any `'use server'` module
 * so it can be imported as a normal server-side helper without
 * leaking as a callable client endpoint.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendAddedToServerEmail } from "@/lib/resend/emails";
import { generateInviteMagicLink } from "@/lib/auth/invite-link";

/**
 * For each (serverId, contactId) freshly inserted in server_contacts,
 * write one in-app notification (for authed artists who haven't
 * opted out) and send one 'added to server' email (cold contacts
 * always; authed only if their notif_prefs allow it).
 *
 * Fire-and-forget per recipient — a Resend hiccup or a missing
 * artist_profiles row should NOT roll back the producer's add
 * action. Errors are logged for ops triage.
 *
 * @param supabase  An authenticated client (server-side); the caller
 *                  is responsible for RLS-gating the membership
 *                  insert that produced these contact ids.
 * @param serverId  The server the artists were added to.
 * @param serverSlug Slug for the gate URL embedded in the email.
 * @param freshContactIds Contacts newly attached to the server in
 *                  THIS request. Re-fanning out for an already-
 *                  attached contact would spam them, so the caller
 *                  must filter beforehand.
 */
export async function fanOutAddedToServer(
  supabase: SupabaseClient,
  serverId: string,
  serverSlug: string,
  freshContactIds: string[],
): Promise<void> {
  if (freshContactIds.length === 0) return;

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
    .in("id", freshContactIds)
    .returns<
      Array<{
        id: string;
        email: string;
        auth_user_id: string | null;
      }>
    >();
  if (!contacts?.length) return;

  // 3. notif_prefs for authed contacts so we honor added_to_server
  //    (in-app) + email (channel) toggles. Cold contacts (no
  //    auth_user_id) get the email by default — they're not yet on
  //    Wavloops and can't have a preference; the email IS the
  //    channel they have.
  const authedUserIds = contacts
    .map((c) => c.auth_user_id)
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

  // 5. Email — fire-and-forget per recipient. Skip when the authed
  //    artist has email=false in notif_prefs. Cold contacts (no
  //    auth_user_id) always get the email.
  //
  //    For each recipient we pre-generate a one-click magic-link
  //    via Supabase admin so the 'Join the server' CTA bypasses
  //    the public gate (and the 'Request access' form they're not
  //    supposed to see — the producer already added them). On
  //    success the click verifies the token, /auth/callback
  //    creates the session, and the artist lands on
  //    /listen/<slug>. On failure we fall back to the public
  //    /s/<slug> URL inside sendAddedToServerEmail so the email
  //    still ships (the existing gate's 'granted' branch will
  //    catch them eventually after a normal sign-in).
  for (const c of contacts) {
    if (c.auth_user_id) {
      const prefs = prefsFor(c.auth_user_id);
      if (!prefs.email || !prefs.added_to_server) continue;
    }
    let inviteUrl: string | null = null;
    try {
      inviteUrl = await generateInviteMagicLink({
        email: c.email,
        serverSlug,
      });
    } catch (e) {
      console.warn("[fanOutAddedToServer] magic-link generate", c.email, e);
    }
    try {
      await sendAddedToServerEmail({
        artistEmail: c.email,
        producerHandle,
        serverName: serverRow.name,
        serverSlug,
        inviteUrl,
      });
    } catch (e) {
      console.warn("[fanOutAddedToServer] email", c.email, e);
    }
  }
}
