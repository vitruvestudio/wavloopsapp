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
import { PLAN_QUOTAS } from "@/lib/billing/plans";
import { getCurrentUserPlan } from "@/lib/billing/server";
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
    .select("id, name, handle")
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      name: string | null;
      handle: string | null;
    }>();

  // Default "Produced by" tag — fall through a sane chain so a
  // brand-new producer with no name set still sees something
  // meaningful instead of the literal placeholder "You". Theo's
  // report was that a logged-in account should never see "YOU" as
  // its own producer tag; pick the best available signal.
  const defaultProducerTag =
    profile?.name?.trim() ||
    (profile?.handle ? `@${profile.handle}` : null) ||
    user.email?.split("@")[0] ||
    "Me";

  const { data: servers } = profile
    ? await supabase
        .from("servers")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false })
        .returns<ServerRow[]>()
    : { data: [] as ServerRow[] };

  // Plan-aware audio format gating. The client gates the file
  // before any byte ships to Supabase Storage; the action re-checks
  // the format server-side for defense in depth.
  const plan = await getCurrentUserPlan();
  const allowedAudioExts = PLAN_QUOTAS[plan].allowedAudioExtensions;

  return (
    <UploadBeatPage
      userId={user.id}
      producerName={defaultProducerTag}
      servers={servers ?? []}
      currentPlan={plan}
      allowedAudioExts={allowedAudioExts}
    />
  );
}
