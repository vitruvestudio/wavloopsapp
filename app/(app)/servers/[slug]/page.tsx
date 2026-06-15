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

  const serverRes = await supabase
    .from("servers_with_stats")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<ServerWithStatsRow>();

  const server = serverRes.data;
  if (!server) notFound();

  const [pivotRes, contactsRes, likesCountRes, userRes, libraryRes] =
    await Promise.all([
      supabase
        .from("server_beats")
        .select("beat_id, position")
        .eq("server_id", server.id)
        .order("position", { ascending: true }),
      // Contacts attached to THIS server, via the server_contacts
      // pivot (post-migration #7 contacts are owner-scoped, not
      // server-scoped). Each row is a contact + its membership
      // metadata; we flatten in JS below.
      supabase
        .from("server_contacts")
        .select(
          "granted_at, contacts!inner(id, owner_id, email, name, phone, socials, first_seen_at, last_active_at)",
        )
        .eq("server_id", server.id)
        .order("granted_at", { ascending: false })
        .returns<
          Array<{ granted_at: string; contacts: ContactRow | null }>
        >(),
      supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("server_id", server.id),
      supabase.auth.getUser(),
      // The producer's full library — used to populate the
      // "Add beats" modal. RLS scopes it to their own beats only.
      supabase
        .from("beats_with_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<BeatWithStatsRow[]>(),
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

  const contacts: ContactRow[] = (contactsRes.data ?? [])
    .map((r) => r.contacts)
    .filter((c): c is ContactRow => c !== null);

  return (
    <ServerDetailPage
      server={server}
      beats={orderedBeats}
      contacts={contacts}
      likesCount={likesCountRes.count ?? 0}
      userId={userRes.data.user?.id ?? ""}
      library={libraryRes.data ?? []}
    />
  );
}
