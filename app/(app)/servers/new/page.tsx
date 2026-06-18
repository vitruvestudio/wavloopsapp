/**
 * /servers/new — Create Server page.
 *
 * Server component. Fetches the producer's beat library so the
 * "Add beats from your library" multi-select can render without a
 * client-side roundtrip. Passes the list down to the client form.
 *
 * Auth gating is handled by proxy.ts — anon visitors bounce to /auth
 * before this server component ever runs.
 */

import { createClient } from "@/lib/supabase/server";
import { CreateServerPage } from "./CreateServerPage";
import type { BeatWithStatsRow } from "@/lib/supabase/database.types";

export const metadata = {
  title: "Create a server",
};

export default async function NewServerPage() {
  const supabase = await createClient();

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

  const beatsRes = profileId
    ? await supabase
        .from("beats_with_stats")
        .select("*")
        .eq("owner_id", profileId)
        .order("created_at", { ascending: false })
        .returns<BeatWithStatsRow[]>()
    : { data: [] as BeatWithStatsRow[] };

  return (
    <CreateServerPage
      userId={user?.id ?? ""}
      beats={beatsRes.data ?? []}
    />
  );
}
