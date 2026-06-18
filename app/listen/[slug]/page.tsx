/**
 * /listen/[slug] — server view inside the artist panel.
 *
 * Phase 3.3: fetches the real server + beats via loadServerView,
 * adapts the row shape to ServerView's MockServer / MockProducer /
 * MockBeat contract, and renders.
 *
 * Why adapt instead of refactoring ServerView: the view component
 * is large, the mock types are stable, and the adapter is a thin
 * pure function. Renaming the props' type identifiers across the
 * whole component lands in a later cleanup pass.
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PendingApprovalView } from "../_components/PendingApprovalView";
import { ServerView } from "../_components/ServerView";
import type {
  ArtistServerView,
  ArtistServerViewBeat,
} from "../_data";
import { loadServerView } from "../_data";
import type {
  MockBeat,
  MockProducer,
  MockServer,
} from "../_mock";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArtistServerPage({ params }: PageProps) {
  const { slug } = await params;
  const view = await loadServerView(slug);
  if (view) {
    const { producer, server } = adapt(view);
    return <ServerView producer={producer} server={server} />;
  }
  // loadServerView returned null — could be a real "no such server"
  // OR the artist has a pending request the RLS chain (rightly)
  // filters out. Distinguish so a pending visitor sees a friendly
  // waiting state instead of a misleading 404.
  return await resolveFallback(slug);
}

/** When the artist can't read the server through RLS, fall back
 *  to a SECURITY DEFINER lookup. If a pending row exists for THIS
 *  user, render the waiting screen; otherwise 404. */
async function resolveFallback(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // RLS helper 3b lets the artist read their own server_contacts
  // rows — pending or granted. If a pending row exists, we know
  // this slug maps to a server the artist already requested.
  const { data: serverByGate } = await supabase.rpc(
    "get_server_for_gate",
    { p_slug: slug },
  );
  const gate = (
    serverByGate as Array<{
      id?: string;
      name?: string;
      producer_handle?: string | null;
      producer_name?: string | null;
      producer_avatar_url?: string | null;
    }> | null
  )?.[0];
  if (!gate?.id) notFound();

  const { data: membership } = await supabase
    .from("server_contacts")
    .select("status")
    .eq("server_id", gate.id)
    .maybeSingle<{ status: "pending" | "granted" }>();
  if (membership?.status !== "pending") notFound();

  return (
    <PendingApprovalView
      serverName={gate.name ?? "this server"}
      producerHandle={
        gate.producer_handle ?? gate.producer_name ?? "the producer"
      }
      producerAvatarUrl={gate.producer_avatar_url ?? null}
    />
  );
}

/** Maps the loadServerView shape onto ServerView's MockProducer /
 *  MockServer / MockBeat contract. */
function adapt(view: ArtistServerView): {
  producer: MockProducer;
  server: MockServer;
} {
  const producer: MockProducer = {
    handle: view.producer.handle,
    name: view.producer.name,
    avatarSeed: view.producer.handle,
    avatarUrl: view.producer.avatarUrl,
    socials: view.producer.socials,
    // ServerView ignores producer.servers — the sidebar reads
    // producers from ArtistContext, not from the per-page prop.
    servers: [],
  };
  const server: MockServer = {
    slug: view.server.slug,
    name: view.server.name,
    styleText: view.server.styleText,
    unread: 0,
    artSeeds: deriveArtSeeds(view),
    artUrls: deriveArtUrls(view),
    artworkMode: view.server.artworkMode,
    accentHue: view.server.accentHue ?? undefined,
    artworkImageUrl: view.server.artworkImageUrl ?? undefined,
    beats: view.beats.map(beatToMock),
  };
  return { producer, server };
}

function beatToMock(b: ArtistServerViewBeat): MockBeat {
  return {
    id: b.id,
    title: b.title,
    type: b.type,
    bpm: b.bpm,
    key: b.key,
    mood: b.mood,
    duration: b.duration,
    addedAt: b.addedAt,
    liked: b.liked,
    listened: b.listened,
    commentCount: b.latestCommentBody ? 1 : 0,
    artSeed: b.artSeed,
    coverUrl: b.coverUrl ?? undefined,
    audioUrl: b.audioUrl ?? undefined,
    isNew: b.isNew,
    // Thread the note state so BeatRow can derive noteVisibility
    // ("shared" → accent chip + dot, "private" → bg-2 chip,
    // null → empty). Dropping these means the message icon
    // always reads as "no note" even after refresh.
    noteBody: b.noteBody,
    latestCommentBody: b.latestCommentBody,
  };
}

/** Banner mosaic needs 4 deterministic seeds. Use the first 4
 *  beat wave_seeds; pad with the slug-derived fallback when there
 *  are fewer than 4 beats. */
function deriveArtSeeds(view: ArtistServerView): string[] {
  const seeds = view.beats.slice(0, 4).map((b) => b.artSeed);
  while (seeds.length < 4) seeds.push(`${view.server.slug}-${seeds.length}`);
  return seeds;
}

/** Same idea on the cover URLs side — fall back to undefined when
 *  the beat has no uploaded artwork so the mosaic tile uses the
 *  seed-generated CoverArt. */
function deriveArtUrls(view: ArtistServerView): string[] | undefined {
  const urls = view.beats
    .slice(0, 4)
    .map((b) => b.coverUrl)
    .filter((u): u is string => !!u);
  return urls.length ? urls : undefined;
}
