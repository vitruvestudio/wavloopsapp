/**
 * /library — producer Beat library.
 *
 * Server component. Pulls the producer's beats via the
 * `beats_with_stats` view (migration #4) — one query, three counts per
 * row (in_servers_count, plays_count, likes_count).
 *
 * Layout:
 *   - PageHeader: title "Beat library" · sub "X BEATS · Y COMPOSITIONS
 *     · Z LOOPS" · right slot "Upload a beat" button → /library/upload
 *   - Body: <Dropzone /> permanent at the top (click → /library/upload
 *     for V1; drag-drop handling lands in J4.2 with the upload page)
 *   - Then either <EmptyState /> or the beat list.
 *
 * V1 scope (this commit):
 *   - List view only — no list/grid toggle, no Search input, no
 *     Segmented filter, no MOOD/BPM/KEY/SERVER chip filters, no Sort
 *     dropdown. All deferred to V1.1 — wired once the data flow is
 *     proven and we have enough rows to make them useful.
 *
 * `now` is computed once on the server and threaded down to BeatRow so
 * the relative-time formatter is stable through SSR + hydrate.
 */

import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { BeatRow } from "@/components/app/BeatRow";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import type { BeatWithStatsRow } from "@/lib/supabase/database.types";

export default async function LibraryPage() {
  const supabase = await createClient();

  const { data: beats } = await supabase
    .from("beats_with_stats")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BeatWithStatsRow[]>();

  const list = beats ?? [];
  const compCount = list.filter((b) => b.type === "comp").length;
  const loopCount = list.filter((b) => b.type === "loop").length;
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Beat library"
        sub={`${list.length} BEAT${list.length === 1 ? "" : "S"} · ${compCount} COMPOSITION${compCount === 1 ? "" : "S"} · ${loopCount} LOOP${loopCount === 1 ? "" : "S"}`}
        right={
          <Link href="/library/upload" className="shrink-0">
            <Button icon="upload" size="sm" className="lg:!h-[38px] lg:!text-[14px]">
              <span className="hidden sm:inline">Upload a beat</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </Link>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
        <Dropzone />

        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <BeatList beats={list} now={now} />
        )}
      </div>
    </>
  );
}

/* ============================================================
   Dropzone — permanent banner at the top of the library
   ============================================================ */

function Dropzone() {
  // V1: clickable shell that routes to the upload page. Full drag-drop
  // handling (browser-side file API + auto-detect) ships in J4.2.
  return (
    <Link
      href="/library/upload"
      className="flex items-center justify-between hover:bg-bg-1 transition-colors duration-fast mb-[24px]"
      style={{
        gap: 18,
        padding: "18px 22px",
        borderRadius: "var(--r-lg)",
        border: "1.5px dashed var(--border-2)",
        background: "transparent",
      }}
    >
      <div className="flex items-center min-w-0" style={{ gap: 16 }}>
        <div
          className="flex items-center justify-center shrink-0 text-accent-text"
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--r-md)",
            background: "var(--accent-surface)",
          }}
        >
          <Icon name="upload" size={20} />
        </div>
        <div className="min-w-0">
          <div className="t-title" style={{ fontSize: 15 }}>
            Drag &amp; drop your beats here
          </div>
          <div className="t-mono-s" style={{ marginTop: 3 }}>
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
    </Link>
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
      <Link href="/library/upload">
        <Button size="lg" icon="upload">
          Upload your first beat
        </Button>
      </Link>
    </div>
  );
}

/* ============================================================
   BeatList — table-like list with mono header row + BeatRows
   ============================================================ */

function BeatList({
  beats,
  now,
}: {
  beats: BeatWithStatsRow[];
  now: Date;
}) {
  return (
    <div>
      {/* Column headers — mono, fg-3, mirror BeatRow's right-cluster widths */}
      <div
        className="hidden md:flex items-center"
        style={{
          gap: 14,
          padding: "0 12px",
          marginBottom: 6,
        }}
      >
        <span className="t-mono-s" style={{ width: 46, flexShrink: 0 }} />
        <span
          className="t-mono-s flex-1"
          style={{ color: "var(--fg-4)" }}
        >
          BEAT
        </span>
        <span
          className="t-mono-s shrink-0"
          style={{
            width: 90,
            textAlign: "right",
            color: "var(--fg-4)",
          }}
        >
          ADDED
        </span>
        <span
          className="t-mono-s hidden lg:inline-block shrink-0"
          style={{
            width: 110,
            textAlign: "right",
            color: "var(--fg-4)",
          }}
        >
          IN SERVERS
        </span>
        <span
          className="t-mono-s hidden sm:inline-block shrink-0"
          style={{
            width: 14 * 3 + 38 + 38 + 38, // matches the right cluster width approximately
            textAlign: "right",
            color: "var(--fg-4)",
          }}
        >
          ENGAGEMENT
        </span>
        <span className="shrink-0" style={{ width: 32 }} />
      </div>

      <div className="flex flex-col" style={{ gap: 2 }}>
        {beats.map((b) => (
          <BeatRow key={b.id} beat={b} now={now} />
        ))}
      </div>
    </div>
  );
}
