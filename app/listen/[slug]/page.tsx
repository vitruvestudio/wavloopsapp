/**
 * /listen/[slug] — server view inside the artist panel.
 *
 * Phase 1: resolves the slug against the mock data and hands the
 * (producer, server) pair to the client ServerView component.
 * 404 if the slug isn't in the mock — Phase 3 will hit the DB.
 */

import { notFound } from "next/navigation";
import { ServerView } from "../_components/ServerView";
import { findServer } from "../_mock";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArtistServerPage({ params }: PageProps) {
  const { slug } = await params;
  const hit = findServer(slug);
  if (!hit) notFound();
  return <ServerView producer={hit.producer} server={hit.server} />;
}
