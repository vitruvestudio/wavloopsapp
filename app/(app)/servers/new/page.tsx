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

  const { data: beats } = await supabase
    .from("beats_with_stats")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BeatWithStatsRow[]>();

  return <CreateServerPage beats={beats ?? []} />;
}
