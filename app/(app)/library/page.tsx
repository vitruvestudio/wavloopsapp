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
import { createClient } from "@/lib/supabase/server";
import type {
  BeatWithStatsRow,
  ServerRow,
} from "@/lib/supabase/database.types";
import { LibraryFilters } from "./LibraryFilters";
import { UploadTrigger } from "./UploadTrigger";

export default async function LibraryPage() {
  const supabase = await createClient();

  const [beatsRes, serversRes, membershipsRes] = await Promise.all([
    supabase
      .from("beats_with_stats")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<BeatWithStatsRow[]>(),
    supabase
      .from("servers")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<ServerRow[]>(),
    supabase
      .from("server_beats")
      .select("beat_id, server_id")
      .returns<Array<{ beat_id: string; server_id: string }>>(),
  ]);

  const list = beatsRes.data ?? [];
  const servers = serversRes.data ?? [];
  const memberships = membershipsRes.data ?? [];

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
      <PageHeader
        title="Beat library"
        sub={`${list.length} BEAT${list.length === 1 ? "" : "S"} · ${compCount} COMPOSITION${compCount === 1 ? "" : "S"} · ${loopCount} LOOP${loopCount === 1 ? "" : "S"}`}
        right={
          <UploadTrigger>
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
        <Dropzone />

        {list.length === 0 ? (
          <EmptyState />
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

function Dropzone() {
  return (
    <UploadTrigger block>
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

function EmptyState() {
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
      <UploadTrigger>
        <Button size="lg" icon="upload">
          Upload your first beat
        </Button>
      </UploadTrigger>
    </div>
  );
}
