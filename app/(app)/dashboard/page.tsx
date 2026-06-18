/**
 * Dashboard — producer's servers grid.
 *
 * Server component. Fetches `servers_with_stats` (view from migration
 * #3) — one query, three counts per row. Renders either:
 *   - empty state (centred CTA, 8vh top margin) when the producer has
 *     no servers yet
 *   - responsive grid of <ServerCard> (1 col mobile, 2 sm, 3 lg)
 *
 * PageHeader sub line is dynamic:
 *   "X ACTIVE · Y ARTISTS REACHED"
 * where Y is the sum of `contacts_count` across all the producer's
 * servers (de-dup across servers happens in V1.1 — for V1 we count
 * memberships, which is what shows in the proto).
 *
 * "Create" button is a Next <Link> to /servers/new (route arrives in
 * J3.4 — until then it 404s).
 */

import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { ServerCard, type BeatCover } from "@/components/app/ServerCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProducerProfileId } from "@/lib/supabase/current";
import type { ServerWithStatsRow } from "@/lib/supabase/database.types";

/** Row shape returned by the `server_beats → beats` join below. The
 *  `beats` join is single-row (FK on beat_id), so we type it as one
 *  object — Supabase-js wraps single-FK joins in {…} not [{…}]. */
interface ServerBeatJoinRow {
  server_id: string;
  position: number;
  beats: { artwork_url: string | null; wave_seed: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Owner-scoped fence + cached profile resolver shared with the
  // shell layout — see lib/supabase/current.ts.
  const profileId = await getCurrentProducerProfileId();

  // Parallel: the producer's servers (with stats) + the join that
  // gives us each beat's cover for the mosaic.
  const [serversRes, pivotRes] = profileId
    ? await Promise.all([
        supabase
          .from("servers_with_stats")
          .select("*")
          .eq("owner_id", profileId)
          .order("created_at", { ascending: false })
          .returns<ServerWithStatsRow[]>(),
        supabase
          .from("server_beats")
          .select(
            "server_id, position, beats!inner(artwork_url, wave_seed), servers!inner(owner_id)",
          )
          .eq("servers.owner_id", profileId)
          .order("position", { ascending: true })
          .returns<ServerBeatJoinRow[]>(),
      ])
    : [
        { data: [] as ServerWithStatsRow[] },
        { data: [] as ServerBeatJoinRow[] },
      ];

  const list = serversRes.data ?? [];
  const activeCount = list.length;
  const artistsReached = list.reduce((sum, s) => sum + s.contacts_count, 0);

  // Group the first 4 beat covers per server, keyed by server_id.
  // Rows arrive ordered by position so the first hit per server is
  // also the first slot in the mosaic.
  const coversByServerId = new Map<string, BeatCover[]>();
  for (const row of pivotRes.data ?? []) {
    if (!row.beats) continue;
    const existing = coversByServerId.get(row.server_id) ?? [];
    if (existing.length >= 4) continue;
    existing.push({ seed: row.beats.wave_seed, src: row.beats.artwork_url });
    coversByServerId.set(row.server_id, existing);
  }

  return (
    <>
      <PageHeader
        title="Servers"
        sub={`${activeCount} ACTIVE · ${artistsReached} ARTISTS REACHED`}
        right={
          <Link href="/servers/new" className="shrink-0">
            <Button icon="plus" size="sm" className="lg:!h-[38px] lg:!text-[14px]">
              <span className="hidden sm:inline">Create a server</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </Link>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <ServersGrid servers={list} coversByServerId={coversByServerId} />
        )}
      </div>
    </>
  );
}

/* ============================================================
   EmptyState
   ============================================================ */

function EmptyState() {
  return (
    <div
      className="mx-auto flex flex-col items-center text-center"
      style={{ maxWidth: 460, marginTop: "8vh" }}
    >
      <div
        className="flex items-center justify-center text-accent-text"
        style={{
          width: 72,
          height: 72,
          borderRadius: "var(--r-xl)",
          background: "var(--accent-surface)",
          marginBottom: 22,
        }}
      >
        <Icon name="server" size={34} />
      </div>
      <h2 className="t-h2" style={{ marginBottom: 10 }}>
        Create your first server
      </h2>
      <p className="t-body-l" style={{ marginBottom: 24 }}>
        A server is a living folder of beats. Share its link, capture
        artists&rsquo; emails, and watch the plays roll in.
      </p>
      <Link href="/servers/new">
        <Button size="lg" icon="plus">
          Create a server
        </Button>
      </Link>
    </div>
  );
}

/* ============================================================
   ServersGrid — responsive 1 / 2 / 3 columns
   ============================================================ */

function ServersGrid({
  servers,
  coversByServerId,
}: {
  servers: ServerWithStatsRow[];
  coversByServerId: Map<string, BeatCover[]>;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      style={{ gap: 18 }}
    >
      {servers.map((s) => (
        <ServerCard
          key={s.id}
          server={s}
          beatCovers={coversByServerId.get(s.id) ?? []}
          stats={{
            beats: s.beats_count,
            contacts: s.contacts_count,
            plays: s.plays_count,
          }}
        />
      ))}
    </div>
  );
}
