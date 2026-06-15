/**
 * /beats/[id] — composition / loop detail page.
 *
 * Server component. Fetches in parallel:
 *   - the beat (from beats_with_stats — picks up plays / likes /
 *     in_servers counts in one query),
 *   - the servers this beat is shared in (server_beats × servers),
 *
 * If the beat doesn't exist or the producer doesn't own it the RLS
 * SELECT silently returns no rows → we 404.
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BeatDetailPage } from "./BeatDetailPage";
import type {
  BeatWithStatsRow,
  ServerRow,
} from "@/lib/supabase/database.types";

interface BeatPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BeatPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.title ? `${data.title} — Wavloops` : "Beat — Wavloops",
  };
}

export default async function BeatPage({ params }: BeatPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [beatRes, membershipRes] = await Promise.all([
    supabase
      .from("beats_with_stats")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("server_beats")
      .select("servers(*)")
      .eq("beat_id", id),
  ]);

  const beat = beatRes.data as BeatWithStatsRow | null;
  if (!beat) notFound();

  const memberships = (membershipRes.data ?? []) as unknown as Array<{
    servers: ServerRow | null;
  }>;
  const servers = memberships
    .map((r) => r.servers)
    .filter((s): s is ServerRow => Boolean(s));

  return <BeatDetailPage beat={beat} servers={servers} />;
}
