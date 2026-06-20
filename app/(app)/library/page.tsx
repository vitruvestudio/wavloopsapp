/**
 * /library — producer Beat library.
 *
 * Server component. Fetches in parallel:
 *   - beats_with_stats   — the producer's beats + per-beat counts
 *   - servers            — for the SERVER filter dropdown
 *   - server_beats       — pivot rows used to build the
 *                          { beat_id → server_ids[] } map the
 *                          SERVER filter needs to evaluate locally.
 *
 * All filtering happens client-side inside <LibraryFilters />. Library
 * sizes (≤ ~hundreds of beats) make a fresh O(n) scan per keystroke
 * trivially cheap and side-steps a server roundtrip per filter
 * keystroke.
 *
 * `now` is computed once on the server and passed down so the BeatRow
 * relative-time formatter stays stable across SSR + hydrate.
 */

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PLAN_QUOTAS } from "@/lib/billing/plans";
import { getCurrentUserPlan } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProducerProfileId } from "@/lib/supabase/current";
import type {
  BeatWithStatsRow,
  ServerRow,
} from "@/lib/supabase/database.types";
import { LibraryFilters } from "./LibraryFilters";
import { UploadQuickAddSentinel } from "./UploadQuickAddSentinel";
import { UploadTrigger } from "./UploadTrigger";

export default async function LibraryPage() {
  const supabase = await createClient();

  // Resolve the producer's profile id so every query below can
  // scope strictly to rows they own. getCurrentProducerProfileId
  // is cache()'d per request, so the shell layout, this page,
  // and any deeper component all share one Supabase round-trip.
  const profileId = await getCurrentProducerProfileId();
  // No producer profile (artist-only user landing here by URL) →
  // return an empty library, never another producer's catalogue.
  if (!profileId) {
    return (
      <LibraryFilters
        beats={[]}
        servers={[]}
        beatServers={{}}
        now={new Date()}
      />
    );
  }

  const [beatsRes, serversRes, membershipsRes] = await Promise.all([
    supabase
      .from("beats_with_stats")
      .select("*")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: false })
      .returns<BeatWithStatsRow[]>(),
    supabase
      .from("servers")
      .select("*")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: false })
      .returns<ServerRow[]>(),
    supabase
      .from("server_beats")
      .select("beat_id, server_id, servers!inner(owner_id)")
      .eq("servers.owner_id", profileId)
      .returns<Array<{ beat_id: string; server_id: string }>>(),
  ]);

  const list = beatsRes.data ?? [];
  const servers = serversRes.data ?? [];
  const memberships = membershipsRes.data ?? [];

  // Plan-aware audio whitelist — passed down to every UploadTrigger
  // so the format gate fires at the picker (before navigating to
  // /library/upload). A Free user dropping a WAV gets the upgrade
  // modal in place; the Beat library stays underneath, no
  // intermediate setup page.
  const plan = await getCurrentUserPlan();
  const allowedAudioExts = PLAN_QUOTAS[plan].allowedAudioExtensions;

  // Group memberships by beat → array of server ids.
  const beatServers: Record<string, string[]> = {};
  for (const m of memberships) {
    (beatServers[m.beat_id] ??= []).push(m.server_id);
  }

  const compCount = list.filter((b) => b.type === "comp").length;
  const loopCount = list.filter((b) => b.type === "loop").length;
  const now = new Date();

  return (
    <>
      {/* Sidebar Quick add → "Upload a beat" deeplinks here with
              ?upload=1 — this sentinel auto-opens the picker once,
              then strips the param. */}
      <UploadQuickAddSentinel
        currentPlan={plan}
        allowedAudioExts={allowedAudioExts}
      />
      <PageHeader
        title="Beat library"
        sub={`${list.length} BEAT${list.length === 1 ? "" : "S"} · ${compCount} COMPOSITION${compCount === 1 ? "" : "S"} · ${loopCount} LOOP${loopCount === 1 ? "" : "S"}`}
        right={
          <UploadTrigger
            currentPlan={plan}
            allowedAudioExts={allowedAudioExts}
          >
            <Button
              icon="upload"
              size="sm"
              className="lg:!h-[38px] lg:!text-[14px]"
            >
              <span className="hidden sm:inline">Upload a beat</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </UploadTrigger>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
        <Dropzone
          currentPlan={plan}
          allowedAudioExts={allowedAudioExts}
        />

        {list.length === 0 ? (
          <EmptyState
            currentPlan={plan}
            allowedAudioExts={allowedAudioExts}
          />
        ) : (
          <LibraryFilters
            beats={list}
            servers={servers}
            beatServers={beatServers}
            now={now}
          />
        )}
      </div>
    </>
  );
}

/* ============================================================
   Dropzone — permanent banner that opens the Upload modal
   ============================================================ */

function Dropzone({
  currentPlan,
  allowedAudioExts,
}: {
  currentPlan: import("@/lib/billing/plans").PlanKey;
  allowedAudioExts: readonly string[];
}) {
  return (
    <UploadTrigger
      block
      currentPlan={currentPlan}
      allowedAudioExts={allowedAudioExts}
    >
      <div
        role="button"
        tabIndex={0}
        className={[
          "flex w-full items-center justify-between hover:bg-bg-1 transition-colors duration-fast cursor-pointer mb-[24px]",
          "gap-[12px] p-[20px_16px]",
          "sm:gap-[18px] sm:p-[22px_24px]",
        ].join(" ")}
        style={{
          borderRadius: "var(--r-lg)",
          border: "1.5px dashed var(--border-2)",
          background: "transparent",
        }}
      >
        <div
          className="flex items-center min-w-0 gap-[12px] sm:gap-[16px]"
        >
          <div
            className={[
              "flex items-center justify-center shrink-0 text-accent-text",
              "w-[36px] h-[36px] sm:w-[44px] sm:h-[44px]",
            ].join(" ")}
            style={{
              borderRadius: "var(--r-md)",
              background: "var(--accent-surface)",
            }}
          >
            <Icon name="upload" size={18} />
          </div>
          <div className="min-w-0">
            <div className="t-title" style={{ fontSize: 14.5 }}>
              <span className="sm:hidden">Drop a beat</span>
              <span className="hidden sm:inline">
                Drag &amp; drop your beats here
              </span>
            </div>
            <div
              className="t-mono-s hidden sm:block"
              style={{ marginTop: 3 }}
            >
              WAV or MP3 · add title and style/mood tags after upload
            </div>
          </div>
        </div>
        <span className="shrink-0">
          <Button variant="secondary" size="sm" icon="upload">
            <span className="hidden sm:inline">Browse files</span>
            <span className="sm:hidden">Browse</span>
          </Button>
        </span>
      </div>
    </UploadTrigger>
  );
}

/* ============================================================
   EmptyState — first-run message under the dropzone
   ============================================================ */

function EmptyState({
  currentPlan,
  allowedAudioExts,
}: {
  currentPlan: import("@/lib/billing/plans").PlanKey;
  allowedAudioExts: readonly string[];
}) {
  return (
    <div
      className="mx-auto flex flex-col items-center text-center"
      style={{ maxWidth: 460, marginTop: "6vh" }}
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
        <Icon name="library" size={34} />
      </div>
      <h2 className="t-h2" style={{ marginBottom: 10 }}>
        Your library is empty
      </h2>
      <p className="t-body-l" style={{ marginBottom: 24 }}>
        Drop a beat above or upload one from your computer. Auto-detect
        tempo, key and length — add mood tags afterwards.
      </p>
      <UploadTrigger
        currentPlan={currentPlan}
        allowedAudioExts={allowedAudioExts}
      >
        <Button size="lg" icon="upload">
          Upload your first beat
        </Button>
      </UploadTrigger>
    </div>
  );
}
