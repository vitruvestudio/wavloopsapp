/**
 * /library/upload — Upload Beat page.
 *
 * Server component. Pulls:
 *   - The producer's profile (for the default "Produced by" chip)
 *   - The producer's existing servers (for the "Add to servers" multi-
 *     select section at the bottom of the form)
 *
 * Both are passed to the client UploadBeatPage component which owns all
 * form state. Direct browser-to-Storage upload happens there; this
 * server component just renders the shell.
 *
 * Auth gating: the (app) proxy already bounces anonymous visitors to
 * /auth. If a logged-in user without a profile reaches this route they
 * still see the form — the save action surfaces a "finish onboarding
 * first" error rather than redirecting (less surprising).
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadBeatPage } from "./UploadBeatPage";
import type { ServerRow } from "@/lib/supabase/database.types";

export const metadata = {
  title: "Upload a beat",
};

export default async function UploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; name: string | null }>();

  const { data: servers } = profile
    ? await supabase
        .from("servers")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false })
        .returns<ServerRow[]>()
    : { data: [] as ServerRow[] };

  return (
    <UploadBeatPage
      userId={user.id}
      producerName={profile?.name ?? "You"}
      servers={servers ?? []}
    />
  );
}
