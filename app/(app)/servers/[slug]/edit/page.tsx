/**
 * /servers/[slug]/edit — Edit server page.
 *
 * Server component. Reuses the `CreateServerPage` client form in
 * edit mode by passing `existing` + `existingBeatIds`. The form
 * itself handles the "edit vs create" branching (title, button
 * label, action call, cancel navigation).
 *
 * Parallel-fetches:
 *   - the server itself (by slug) — 404 if not found / not owned
 *   - the beat ids already attached to it, in position order, so the
 *     multi-select can pre-check them
 *   - the producer's full library, for the multi-select source list
 *   - the current user (for the storage-path prefix on artwork
 *     uploads)
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateServerPage } from "../../new/CreateServerPage";
import type {
  BeatWithStatsRow,
  ServerWithStatsRow,
} from "@/lib/supabase/database.types";

export const metadata = {
  title: "Edit server",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditServerPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Producer profile fence — same pattern as /servers/[slug].
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle<{ id: string }>()
    : { data: null };
  const profileId = profile?.id ?? null;
  if (!profileId) notFound();

  const serverRes = await supabase
    .from("servers_with_stats")
    .select("*")
    .eq("slug", slug)
    .eq("owner_id", profileId)
    .maybeSingle<ServerWithStatsRow>();
  const existing = serverRes.data;
  if (!existing) notFound();

  const [pivotRes, libraryRes] = await Promise.all([
    supabase
      .from("server_beats")
      .select("beat_id, position")
      .eq("server_id", existing.id)
      .order("position", { ascending: true }),
    supabase
      .from("beats_with_stats")
      .select("*")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: false })
      .returns<BeatWithStatsRow[]>(),
  ]);
  const userRes = { data: { user } };

  const existingBeatIds = (pivotRes.data ?? []).map((r) => r.beat_id);

  return (
    <CreateServerPage
      userId={userRes.data.user?.id ?? ""}
      beats={libraryRes.data ?? []}
      existing={existing}
      existingBeatIds={existingBeatIds}
    />
  );
}
