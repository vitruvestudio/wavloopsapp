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
import { getCurrentProducerProfileId } from "@/lib/supabase/current";
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

/** One row in the "DOWNLOADED" log. Grouped per beat the same
 *  way listens are — a beat downloaded 3 times by the same
 *  contact appears once with downloadCount = 3. */
export interface DownloadEntry {
  beat: BeatRow;
  downloadCount: number;
  liked: boolean;
}

export interface ContactStats {
  totalPlays: number;
  beatsLiked: number;
  beatsHeard: number;
  serversCount: number;
  /** Total download events this contact has triggered across all
   *  of the producer's servers. Real action signal — surfaces the
   *  classic 'downloader-only' archetype who joins a server and
   *  grabs everything without ever streaming a beat. */
  totalDownloads: number;
  /** Distinct beats this contact has downloaded (vs totalDownloads
   *  which counts every event). A download-heavy contact with
   *  beatsDownloaded === server.beats_count downloaded the WHOLE
   *  pack — often the bot-y / leech-y signature. */
  beatsDownloaded: number;
}

export default async function ContactRoute({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Producer profile fence + cached resolver.
  const profileId = await getCurrentProducerProfileId();
  if (!profileId) notFound();

  const contactRes = await supabase
    .from("contacts")
    .select(
      "id, owner_id, email, name, phone, socials, avatar_url, roles, first_seen_at, last_active_at, server_contacts(servers(id, name, slug))",
    )
    .eq("id", id)
    .eq("owner_id", profileId)
    .maybeSingle<ContactJoinRow>();

  const contact = contactRes.data;
  if (!contact) notFound();

  const [likesRes, listensRes, downloadsRes, allServersRes] =
    await Promise.all([
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
      // Per-contact download events. Same shape as listens —
      // grouped client-side below so each beat appears once with
      // its download count. RLS scopes by server_owner via the
      // downloads_owner_select policy from migration #20260628130000.
      supabase
        .from("downloads")
        .select("beat_id, beats!inner(*)")
        .eq("contact_id", id)
        .order("downloaded_at", { ascending: false })
        .returns<BeatJoinRow[]>(),
      // All the producer's servers — used by the Edit Contact modal's
      // "Add to servers" chip group so the producer can attach the
      // contact to (or detach from) any of their servers.
      supabase
        .from("servers")
        .select("id, name, slug")
        .eq("owner_id", profileId)
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

  // Same shape as listens — group download events per beat so a
  // beat downloaded N times appears once with downloadCount = N.
  const downloadCountByBeat = new Map<string, number>();
  const downloadedBeatById = new Map<string, BeatRow>();
  for (const r of downloadsRes.data ?? []) {
    if (!r.beats) continue;
    downloadCountByBeat.set(
      r.beat_id,
      (downloadCountByBeat.get(r.beat_id) ?? 0) + 1,
    );
    if (!downloadedBeatById.has(r.beat_id)) {
      downloadedBeatById.set(r.beat_id, r.beats);
    }
  }
  const downloads = Array.from(downloadedBeatById.entries())
    .map(([beatId, beat]) => ({
      beat,
      downloadCount: downloadCountByBeat.get(beatId) ?? 0,
      liked: likedBeatIds.has(beatId),
    }))
    .sort((a, b) => b.downloadCount - a.downloadCount);

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
    totalDownloads: downloadsRes.data?.length ?? 0,
    beatsDownloaded: downloadedBeatById.size,
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
      downloads={downloads}
    />
  );
}
