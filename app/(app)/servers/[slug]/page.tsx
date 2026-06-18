/**
 * /servers/[slug] — Server detail page.
 *
 * Server component. Parallel-fetches:
 *   - the server itself (with its denormalised stats: beats_count,
 *     contacts_count, plays_count) from `servers_with_stats`
 *   - the beats attached to it (server_beats × beats_with_stats),
 *     ordered by position
 *   - the contacts (artists) for this server, newest-first
 *   - the total likes count for this server (the view doesn't carry
 *     this aggregate — keeping it as a separate HEAD count keeps the
 *     view stable)
 *
 * Returns 404 (`notFound()`) when the slug doesn't exist OR when RLS
 * hides it because the requester isn't the owner.
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentProducerProfileId,
  getCurrentUser,
} from "@/lib/supabase/current";
import { ServerDetailPage } from "./ServerDetailPage";
import type {
  BeatWithStatsRow,
  ContactRow,
  ServerWithStatsRow,
} from "@/lib/supabase/database.types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ServerPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Producer profile fence + cached resolver.
  const profileId = await getCurrentProducerProfileId();
  if (!profileId) notFound();

  const serverRes = await supabase
    .from("servers_with_stats")
    .select("*")
    .eq("slug", slug)
    .eq("owner_id", profileId)
    .maybeSingle<ServerWithStatsRow>();

  const server = serverRes.data;
  if (!server) notFound();

  const [
    pivotRes,
    contactsRes,
    likesCountRes,
    libraryRes,
    allServersRes,
    addressBookRes,
    user,
  ] = await Promise.all([
    supabase
      .from("server_beats")
      .select("beat_id, position")
      .eq("server_id", server.id)
      .order("position", { ascending: true }),
    // Contacts attached to THIS server, via the server_contacts
    // pivot (post-migration #7 contacts are owner-scoped, not
    // server-scoped). Each row is a contact + its membership
    // metadata; we flatten in JS below. status='granted' only —
    // pending rows surface in the separate Requests tab.
    supabase
      .from("server_contacts")
      .select(
        "granted_at, contacts!inner(id, owner_id, email, name, phone, socials, avatar_url, first_seen_at, last_active_at)",
      )
      .eq("server_id", server.id)
      .eq("status", "granted")
      .order("granted_at", { ascending: false })
      .returns<
        Array<{ granted_at: string; contacts: ContactRow | null }>
      >(),
    supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("server_id", server.id),
    // The producer's full library — used to populate the
    // "Add beats" modal. Owner-scoped explicitly so the
    // multi-role artist-leak path can't seed it with another
    // producer's beats.
    supabase
      .from("beats_with_stats")
      .select("*")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: false })
      .returns<BeatWithStatsRow[]>(),
    // The producer's full server list — used by the "Add artist"
    // create-new modal so the chip group can render every server
    // with the current one pre-selected via defaultServerIds.
    supabase
      .from("servers")
      .select("id, name, slug")
      .eq("owner_id", profileId)
      .order("name", { ascending: true })
      .returns<Array<{ id: string; name: string; slug: string }>>(),
    // The producer's full address book — populates the
    // AddArtistsModal's picker.
    supabase
      .from("contacts")
      .select("*")
      .eq("owner_id", profileId)
      .order("last_active_at", { ascending: false })
      .returns<ContactRow[]>(),
    getCurrentUser(),
  ]);

  // Re-order beats to match the pivot's position order — `.in()` on
  // `id` doesn't preserve order, so we do it in JS via a Map.
  const beatIds = (pivotRes.data ?? []).map((r) => r.beat_id);
  let orderedBeats: BeatWithStatsRow[] = [];
  if (beatIds.length > 0) {
    const { data: beatsData } = await supabase
      .from("beats_with_stats")
      .select("*")
      .in("id", beatIds)
      .returns<BeatWithStatsRow[]>();
    const byId = new Map<string, BeatWithStatsRow>(
      (beatsData ?? []).map((b) => [b.id, b]),
    );
    orderedBeats = (pivotRes.data ?? [])
      .map((r) => byId.get(r.beat_id))
      .filter((b): b is BeatWithStatsRow => Boolean(b));
  }

  // Pair each granted contact with the moment they got access to
  // THIS server (server_contacts.granted_at). The contact-level
  // first_seen_at is when they first entered the producer's
  // address book — which may pre-date their access to this
  // specific server. The Artists tab cares about the per-server
  // grant time, so we thread granted_at through.
  const contacts: Array<{ contact: ContactRow; grantedAt: string }> = (
    contactsRes.data ?? []
  )
    .filter(
      (r): r is { granted_at: string; contacts: ContactRow } =>
        r.contacts !== null && r.granted_at !== null,
    )
    .map((r) => ({ contact: r.contacts, grantedAt: r.granted_at }));

  // Pending access requests for this server — drives the Requests
  // tab on the producer page. Always fetched (cheap with the
  // server_contacts_pending_idx partial index) so the Requests tab
  // can show its count badge regardless of which tab is active.
  const { data: pendingRows } = await supabase
    .from("server_contacts")
    .select(
      "requested_at, contacts!inner(id, owner_id, email, name, phone, socials, avatar_url, first_seen_at, last_active_at)",
    )
    .eq("server_id", server.id)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .returns<
      Array<{ requested_at: string; contacts: ContactRow | null }>
    >();
  const pending: Array<{ requestedAt: string; contact: ContactRow }> = (
    pendingRows ?? []
  )
    .filter(
      (r): r is { requested_at: string; contacts: ContactRow } =>
        r.contacts !== null,
    )
    .map((r) => ({ requestedAt: r.requested_at, contact: r.contacts }));

  return (
    <ServerDetailPage
      server={server}
      beats={orderedBeats}
      contacts={contacts}
      pending={pending}
      likesCount={likesCountRes.count ?? 0}
      userId={user?.id ?? ""}
      library={libraryRes.data ?? []}
      allServers={allServersRes.data ?? []}
      addressBook={addressBookRes.data ?? []}
    />
  );
}
