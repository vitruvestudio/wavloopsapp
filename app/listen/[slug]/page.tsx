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
  if (!view) notFound();
  const { producer, server } = adapt(view);
  return <ServerView producer={producer} server={server} />;
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
