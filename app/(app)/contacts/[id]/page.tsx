/**
 * /contacts/[id] — Per-contact detail page.
 *
 * Server component. Parallel-fetches everything the producer's
 * "address book entry" page needs:
 *
 *   - the contact + its server memberships (via server_contacts ⨝
 *     servers)
 *   - every like the contact has placed (joined to the beat row)
 *   - every listen the contact has placed (joined to the beat row,
 *     grouped + counted in JS so each beat appears once with its
 *     play count)
 *
 * All four queries are RLS-gated to the producer's own data —
 * contacts.owner_id, the server_contacts owner-of-server check, and
 * the listens / likes owner-of-server policies do the work.
 *
 * 404 if the contact doesn't exist or isn't owned by the requester.
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactDetailPage } from "./ContactDetailPage";
import type {
  BeatRow,
  ContactRow,
} from "@/lib/supabase/database.types";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Shape PostgREST returns for a likes / listens row joined to
 *  the parent beat. `beats` is single-row because beat_id is a 1:1 FK. */
interface BeatJoinRow {
  beat_id: string;
  beats: BeatRow | null;
}

/** Shape of contact + nested server_contacts join. */
interface ContactJoinRow extends ContactRow {
  server_contacts: Array<{
    servers: { id: string; name: string; slug: string } | null;
  }>;
}

/** One row in the "LISTENING HISTORY" column. */
export interface HistoryEntry {
  beat: BeatRow;
  playCount: number;
  liked: boolean;
}

export interface ContactStats {
  totalPlays: number;
  beatsLiked: number;
  beatsHeard: number;
  serversCount: number;
}

export default async function ContactRoute({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const contactRes = await supabase
    .from("contacts")
    .select(
      "id, owner_id, email, name, phone, socials, avatar_url, roles, first_seen_at, last_active_at, server_contacts(servers(id, name, slug))",
    )
    .eq("id", id)
    .maybeSingle<ContactJoinRow>();

  const contact = contactRes.data;
  if (!contact) notFound();

  const [likesRes, listensRes, allServersRes] = await Promise.all([
    supabase
      .from("likes")
      .select("beat_id, beats!inner(*)")
      .eq("contact_id", id)
      .order("liked_at", { ascending: false })
      .returns<BeatJoinRow[]>(),
    supabase
      .from("listens")
      .select("beat_id, beats!inner(*)")
      .eq("contact_id", id)
      .order("listened_at", { ascending: false })
      .returns<BeatJoinRow[]>(),
    // All the producer's servers — used by the Edit Contact modal's
    // "Add to servers" chip group so the producer can attach the
    // contact to (or detach from) any of their servers.
    supabase
      .from("servers")
      .select("id, name, slug")
      .order("name", { ascending: true })
      .returns<Array<{ id: string; name: string; slug: string }>>(),
  ]);

  // Liked beats — flatten the join.
  const likedBeats: BeatRow[] = (likesRes.data ?? [])
    .map((r) => r.beats)
    .filter((b): b is BeatRow => b !== null);
  const likedBeatIds = new Set(likedBeats.map((b) => b.id));

  // Listening history — group listens by beat_id, count occurrences,
  // keep the most recent beat reference.
  const playCountByBeat = new Map<string, number>();
  const beatById = new Map<string, BeatRow>();
  for (const r of listensRes.data ?? []) {
    if (!r.beats) continue;
    playCountByBeat.set(r.beat_id, (playCountByBeat.get(r.beat_id) ?? 0) + 1);
    if (!beatById.has(r.beat_id)) beatById.set(r.beat_id, r.beats);
  }
  const history: HistoryEntry[] = Array.from(beatById.entries())
    .map(([beatId, beat]) => ({
      beat,
      playCount: playCountByBeat.get(beatId) ?? 0,
      liked: likedBeatIds.has(beatId),
    }))
    .sort((a, b) => b.playCount - a.playCount);

  // Server stubs for the "ENTERED VIA" line + the SERVERS stat card.
  const servers = (contact.server_contacts ?? [])
    .map((sc) => sc.servers)
    .filter(
      (s): s is { id: string; name: string; slug: string } => s !== null,
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const stats: ContactStats = {
    totalPlays: listensRes.data?.length ?? 0,
    beatsLiked: likedBeats.length,
    beatsHeard: beatById.size,
    serversCount: servers.length,
  };

  return (
    <ContactDetailPage
      contact={{
        id: contact.id,
        owner_id: contact.owner_id,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        socials: contact.socials,
        avatar_url: contact.avatar_url,
        roles: contact.roles ?? [],
        first_seen_at: contact.first_seen_at,
        last_active_at: contact.last_active_at,
      }}
      servers={servers}
      allServers={allServersRes.data ?? []}
      stats={stats}
      liked={likedBeats}
      history={history}
    />
  );
}
