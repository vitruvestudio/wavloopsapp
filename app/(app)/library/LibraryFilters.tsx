/**
 * LibraryFilters — interactive filtering layer for /library.
 *
 * The server component (page.tsx) fetches every beat + every server +
 * every server_beats membership the producer can see. This client
 * component owns the filter state, applies it locally (the list is
 * small enough that an O(n) scan per keystroke is instant), and renders
 * the filtered BeatList.
 *
 * Filters (top → bottom):
 *   - Search bar — case-insensitive substring match across title +
 *     mood tags + key.
 *   - Type Segmented — All / Compositions / Loops, mapped to
 *     beat.type.
 *   - 4 FilterChip popovers — MOOD (single-select from the producer's
 *     own set + suggestions), BPM (min/max range), KEY (single-select
 *     from KEY_OPTIONS), SERVER (single-select from the producer's
 *     servers, joined via server_beats memberships).
 *
 * Each FilterChip:
 *   - Inactive: pill "LABEL ▾" with border-2 + transparent bg.
 *   - Active: pill "LABEL: VALUE ✕" with accent border + accent
 *     surface bg. The ✕ stops propagation and clears the filter
 *     without re-opening the dropdown.
 *   - Click outside / Escape closes the popover.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteBeatAction } from "@/app/(app)/beats/[id]/actions";
import {
  BeatRow,
  type BeatRowAction,
} from "@/components/app/BeatRow";
import { usePlayer } from "@/components/app/PlayerContext";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Tag } from "@/components/ui/Tag";
import { fmtAgo, fmtDuration } from "@/lib/fmt";
import { KEY_OPTIONS, MOOD_SUGGEST } from "@/lib/audio";
import { createClient } from "@/lib/supabase/client";
import type {
  BeatWithStatsRow,
  ServerRow,
} from "@/lib/supabase/database.types";

interface LibraryFiltersProps {
  beats: BeatWithStatsRow[];
  servers: ServerRow[];
  /** Map of beat_id → array of server_ids that beat is in. */
  beatServers: Record<string, string[]>;
  now: Date;
}

type TypeFilter = "all" | "comp" | "loop";

type SortKey = "recent" | "oldest" | "az";

type ViewMode = "list" | "grid";

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "recent", label: "RECENT" },
  { value: "oldest", label: "OLDEST" },
  { value: "az", label: "A-Z" },
];

export function LibraryFilters({
  beats,
  servers,
  beatServers,
  now,
}: LibraryFiltersProps) {
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<TypeFilter>("all");
  const [mood, setMood] = React.useState<string | null>(null);
  const [bpmRange, setBpmRange] = React.useState<[number, number] | null>(
    null,
  );
  const [musicKey, setMusicKey] = React.useState<string | null>(null);
  const [serverId, setServerId] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<SortKey>("recent");
  const [view, setView] = React.useState<ViewMode>("list");

  /* ============================================================
     Playback — fetch a signed URL for the beat-audio bucket
     (private, RLS-gated) and hand it to the global PlayerDock.
     Same beat re-clicked just toggles play/pause; new beat
     swaps the source and auto-plays.
     ============================================================ */

  const player = usePlayer();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  /* Realtime — push refreshes when any artist activity lands on
     the producer's beats. The Supabase channel relays
     postgres_changes events that pass the table's RLS (producer
     only sees rows on their own server), so we don't need a
     server-id filter here. A short debounce groups bursts (e.g.
     a play immediately followed by a like) into a single
     router.refresh so we don't thrash the server fetch.

     Requires Realtime to be enabled on the listens + likes tables
     in Supabase Dashboard → Database → Replication. */
  React.useEffect(() => {
    let pending: ReturnType<typeof setTimeout> | null = null;
    const refresh = (table: string) => () => {
      console.log(`[realtime] ${table} event received → refresh`);
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => router.refresh(), 300);
    };
    const channel = supabase
      .channel("library-engagement")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listens" },
        refresh("listens"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        refresh("likes"),
      )
      .subscribe((status) => {
        console.log("[realtime] channel status:", status);
      });
    return () => {
      if (pending) clearTimeout(pending);
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const openBeat = React.useCallback(
    (beat: BeatWithStatsRow) => router.push(`/beats/${beat.id}`),
    [router],
  );

  const downloadBeat = React.useCallback(
    async (beat: BeatWithStatsRow) => {
      if (!beat.audio_url) return;
      const { data } = await supabase.storage
        .from("beat-audio")
        .createSignedUrl(beat.audio_url, 300);
      if (!data) return;
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = `${beat.title}.${beat.audio_url.split(".").pop() ?? "wav"}`;
      a.click();
    },
    [supabase],
  );

  const deleteBeat = React.useCallback(
    async (beat: BeatWithStatsRow) => {
      const result = await deleteBeatAction(beat.id);
      if (result?.error) {
        console.warn("[library] delete failed", result.error);
        return;
      }
      router.refresh();
    },
    [router],
  );

  const actionsFor = React.useCallback(
    (beat: BeatWithStatsRow): BeatRowAction[] => [
      { icon: "chevron-right", label: "Open", onClick: () => openBeat(beat) },
      {
        icon: "settings",
        label: "Edit info",
        onClick: () => router.push(`/beats/${beat.id}?tab=edit`),
      },
      {
        icon: "external",
        label: "Download",
        onClick: () => void downloadBeat(beat),
      },
      {
        icon: "trash",
        label: "Delete",
        onClick: () => void deleteBeat(beat),
        danger: true,
      },
    ],
    [openBeat, downloadBeat, deleteBeat, router],
  );

  const playBeat = React.useCallback(
    async (beat: BeatWithStatsRow) => {
      // Same beat clicked → toggle play/pause without re-fetching.
      if (player.current?.id === beat.id) {
        player.toggle(player.current);
        return;
      }
      if (!beat.audio_url) {
        console.warn("[library] beat has no audio_url");
        return;
      }
      const { data, error } = await supabase.storage
        .from("beat-audio")
        .createSignedUrl(beat.audio_url, 3600);
      if (error || !data) {
        console.warn("[library] failed to sign audio URL", error);
        return;
      }
      player.toggle({
        id: beat.id,
        title: beat.title,
        bpm: beat.bpm ?? 0,
        key: beat.key ?? "",
        dur: fmtDuration(beat.duration_seconds),
        img: beat.artwork_url,
        wave: beat.wave_seed,
        mood: beat.mood,
        audioUrl: data.signedUrl,
      });
    },
    [player, supabase],
  );

  const isCurrent = (beatId: string) => player.current?.id === beatId;
  const isPlayingNow = (beatId: string) =>
    isCurrent(beatId) && player.playing;

  /** Pool of unique moods present in the producer's library +
   *  defaults from MOOD_SUGGEST — gives the chip something to show
   *  even when the producer hasn't tagged any beats yet. */
  const moodOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const b of beats) for (const m of b.mood) set.add(m);
    for (const s of MOOD_SUGGEST) set.add(s);
    return Array.from(set).sort();
  }, [beats]);

  const filteredSorted = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = beats.filter((b) => {
      if (type === "comp" && b.type !== "comp") return false;
      if (type === "loop" && b.type !== "loop") return false;

      if (q) {
        const hay = `${b.title} ${b.mood.join(" ")} ${b.key ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (
        mood &&
        !b.mood.some((m) => m.toLowerCase() === mood.toLowerCase())
      ) {
        return false;
      }

      if (bpmRange && b.bpm != null) {
        const [lo, hi] = bpmRange;
        if (b.bpm < lo || b.bpm > hi) return false;
      }

      if (musicKey && b.key !== musicKey) return false;

      if (serverId) {
        const memberships = beatServers[b.id] ?? [];
        if (!memberships.includes(serverId)) return false;
      }

      return true;
    });

    // Sort in-place on the freshly filtered copy (no mutation of `beats`).
    switch (sort) {
      case "recent":
        return filtered.sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        );
      case "oldest":
        return filtered.sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        );
      case "az":
        return filtered.sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
        );
    }
  }, [
    beats,
    type,
    search,
    mood,
    bpmRange,
    musicKey,
    serverId,
    beatServers,
    sort,
  ]);

  return (
    <div>
      {/*
        Toolbar layout differs by breakpoint:

        ─ Mobile  (3 rows): Search | Segmented + view + SORT | chips
        ─ Desktop (2 rows): Search + Segmented | chips + view + SORT

        The view+SORT cluster has to move between rows, so we render
        it twice and toggle visibility with `hidden`/`sm:flex` rather
        than try to twist a single CSS grid into both layouts.
      */}

      {/* Row 1 — Search; paired with Segmented on sm+. */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center"
        style={{ gap: 12, marginBottom: 12 }}
      >
        <SearchBeats value={search} onChange={setSearch} />
        <div className="hidden sm:block">
          <Segmented<TypeFilter>
            options={[
              { value: "all", label: "All" },
              { value: "comp", label: "Compositions" },
              { value: "loop", label: "Loops" },
            ]}
            value={type}
            onChange={setType}
          />
        </div>
      </div>

      {/* Row 2 (mobile only) — Segmented + ViewToggle + SortChip. */}
      <div
        className="flex sm:hidden items-center justify-between"
        style={{ gap: 8, marginBottom: 12 }}
      >
        <Segmented<TypeFilter>
          size="sm"
          options={[
            { value: "all", label: "All" },
            { value: "comp", label: "Comp" },
            { value: "loop", label: "Loops" },
          ]}
          value={type}
          onChange={setType}
        />
        <div
          className="flex items-center shrink-0"
          style={{ gap: 8 }}
        >
          <ViewToggle value={view} onChange={setView} />
          <SortChip value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Row 2 (desktop) / Row 3 (mobile) — Filter chips on the left.
          On sm+ the ViewToggle + SortChip sit on the same row at the
          right edge via ml-auto. */}
      <div
        className="flex flex-wrap items-center"
        style={{ gap: 8, marginBottom: 22 }}
      >
        <FilterChip
          label="MOOD"
          selectedLabel={mood}
          onClear={() => setMood(null)}
        >
          {(close) => (
            <SingleSelectList
              value={mood}
              options={moodOptions}
              onPick={(v) => {
                setMood(v);
                close();
              }}
            />
          )}
        </FilterChip>

        <FilterChip
          label="BPM"
          selectedLabel={bpmRange ? `${bpmRange[0]}–${bpmRange[1]}` : null}
          onClear={() => setBpmRange(null)}
        >
          {(close) => (
            <BpmRangePicker
              value={bpmRange}
              onApply={(v) => {
                setBpmRange(v);
                close();
              }}
            />
          )}
        </FilterChip>

        <FilterChip
          label="KEY"
          selectedLabel={musicKey}
          onClear={() => setMusicKey(null)}
        >
          {(close) => (
            <SingleSelectList
              value={musicKey}
              options={[...KEY_OPTIONS]}
              onPick={(v) => {
                setMusicKey(v);
                close();
              }}
            />
          )}
        </FilterChip>

        <FilterChip
          label="SERVER"
          selectedLabel={
            serverId ? servers.find((s) => s.id === serverId)?.name ?? null : null
          }
          onClear={() => setServerId(null)}
        >
          {(close) => (
            <SingleSelectList
              value={
                serverId
                  ? servers.find((s) => s.id === serverId)?.name ?? null
                  : null
              }
              options={servers.map((s) => s.name)}
              onPick={(name) => {
                const found = servers.find((s) => s.name === name);
                setServerId(found?.id ?? null);
                close();
              }}
              emptyHint="You haven't created any servers yet."
            />
          )}
        </FilterChip>

        {/* Desktop only — ViewToggle + SortChip sit on the chip row */}
        <div
          className="hidden sm:flex ml-auto items-center"
          style={{ gap: 12 }}
        >
          <ViewToggle value={view} onChange={setView} />
          <SortChip value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Filtered BeatList — list or grid */}
      {view === "list" ? (
        <BeatList
          beats={filteredSorted}
          now={now}
          totalCount={beats.length}
          onPlay={playBeat}
          onOpen={openBeat}
          isCurrent={isCurrent}
          isPlaying={isPlayingNow}
          actions={actionsFor}
        />
      ) : (
        <BeatGrid
          beats={filteredSorted}
          totalCount={beats.length}
          now={now}
          onPlay={playBeat}
          onOpen={openBeat}
          isCurrent={isCurrent}
          isPlaying={isPlayingNow}
        />
      )}
    </div>
  );
}

/* ============================================================
   Search input
   ============================================================ */

function SearchBeats({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={[
        "flex items-center bg-bg-inset border border-border-1 transition-all duration-fast",
        "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]",
        // Mobile: take the full row width, natural height.
        "w-full",
        // sm+: constrained pill so the segmented sits next to it
        // instead of being pushed to the far right.
        "sm:w-auto sm:flex-none sm:basis-[340px] sm:max-w-[360px]",
      ].join(" ")}
      style={{
        height: 38,
        padding: "0 14px",
        gap: 9,
        borderRadius: "var(--r-md)",
      }}
    >
      <Icon name="search" size={15} className="text-fg-3" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your beats…"
        className="min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13.5,
        }}
      />
    </div>
  );
}

/* ============================================================
   FilterChip — pill button + click-outside popover wrapper
   ============================================================ */

function FilterChip({
  label,
  selectedLabel,
  onClear,
  children,
}: {
  label: string;
  selectedLabel: string | null;
  onClear: () => void;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPtr = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPtr);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPtr);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = selectedLabel != null;

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="t-mono-s inline-flex items-center cursor-pointer transition-colors duration-fast"
        style={{
          height: 30,
          padding: "0 11px",
          gap: 6,
          borderRadius: "var(--r-pill)",
          border: `1px solid ${active ? "var(--accent)" : "var(--border-1)"}`,
          background: active ? "var(--accent-surface)" : "transparent",
          color: active ? "var(--accent-text)" : "var(--fg-2)",
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>
          {label}
          {active && (
            <>
              <span style={{ color: "var(--fg-4)", margin: "0 4px" }}>·</span>
              {selectedLabel}
            </>
          )}
        </span>
        {active ? (
          <span
            role="button"
            aria-label={`Clear ${label} filter`}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="inline-flex items-center"
            style={{ marginLeft: -2, color: "var(--fg-3)" }}
          >
            <Icon name="close" size={11} />
          </span>
        ) : (
          <Icon
            name="chevron-down"
            size={11}
            style={{ color: "var(--fg-3)" }}
          />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute bg-bg-2 border border-border-2"
          style={{
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 220,
            maxWidth: 280,
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
            padding: 6,
            zIndex: 40,
          }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ViewToggle — small segmented for list / grid
   ============================================================ */

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const items: Array<{ value: ViewMode; icon: IconName; label: string }> = [
    { value: "list", icon: "view-list", label: "List view" },
    { value: "grid", icon: "view-grid", label: "Grid view" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Library view"
      className="inline-flex items-center bg-bg-inset border border-border-1"
      style={{
        padding: 2,
        gap: 0,
        borderRadius: "var(--r-md)",
      }}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={it.label}
            onClick={() => onChange(it.value)}
            className="inline-flex items-center justify-center cursor-pointer transition-all duration-fast border-0 w-[26px] h-[26px] sm:w-[30px] sm:h-[30px]"
            style={{
              borderRadius: "var(--r-sm)",
              // Match Segmented: bg-0 + soft shadow for the elevated
              // "active card" feel.
              background: active ? "var(--bg-0)" : "transparent",
              boxShadow: active
                ? "0 1px 3px oklch(0 0 0 / 0.08), 0 1px 1px oklch(0 0 0 / 0.04)"
                : "none",
              color: active ? "var(--fg-1)" : "var(--fg-3)",
            }}
          >
            <Icon name={it.icon} size={14} />
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   SortChip — always-active accent pill that opens a 3-option popover
   ============================================================ */

function SortChip({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPtr = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPtr);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPtr);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current =
    SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  return (
    <div className="inline-flex items-center" style={{ gap: 10 }}>
      {/* "SORT" prefix label — hidden on mobile to save horizontal
          room. The accent pill already carries the value, which is
          enough signal on a small screen. */}
      <span
        className="t-mono-s hidden sm:inline"
        style={{ color: "var(--fg-4)" }}
      >
        SORT
      </span>
      <div ref={wrapRef} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="t-mono-s inline-flex items-center cursor-pointer transition-colors duration-fast h-[28px] sm:h-[32px] px-[12px] sm:px-[14px]"
          style={{
            gap: 6,
            borderRadius: "var(--r-pill)",
            border: "none",
            background: "var(--accent-surface)",
            color: "var(--accent-text)",
          }}
        >
          {current.label}
          <Icon
            name="chevron-down"
            size={11}
            style={{ color: "var(--accent-text)" }}
          />
        </button>

        {open && (
          <div
            role="dialog"
            className="absolute bg-bg-2 border border-border-2"
            style={{
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 160,
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-pop)",
              padding: 6,
              zIndex: 40,
            }}
          >
            <div className="flex flex-col" style={{ gap: 2 }}>
              {SORT_OPTIONS.map((opt) => {
                const selected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="t-mono-s flex items-center cursor-pointer transition-colors duration-fast border-0"
                    style={{
                      height: 32,
                      padding: "0 12px",
                      borderRadius: "var(--r-sm)",
                      background: selected
                        ? "var(--accent-surface)"
                        : "transparent",
                      color: selected
                        ? "var(--accent-text)"
                        : "var(--fg-2)",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected)
                        e.currentTarget.style.background = "var(--bg-3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!selected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SingleSelectList — used by MOOD / KEY / SERVER popovers
   ============================================================ */

function SingleSelectList({
  value,
  options,
  onPick,
  emptyHint,
}: {
  value: string | null;
  options: string[];
  onPick: (v: string) => void;
  emptyHint?: string;
}) {
  if (options.length === 0) {
    return (
      <div
        className="t-body-s"
        style={{
          padding: "12px 10px",
          color: "var(--fg-3)",
          textAlign: "center",
        }}
      >
        {emptyHint ?? "No options."}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{ gap: 2, maxHeight: 280 }}
    >
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            className="t-mono-s flex items-center cursor-pointer transition-colors duration-fast border-0"
            style={{
              height: 32,
              padding: "0 12px",
              borderRadius: "var(--r-sm)",
              background: selected
                ? "var(--accent-surface)"
                : "transparent",
              color: selected ? "var(--accent-text)" : "var(--fg-2)",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (!selected)
                e.currentTarget.style.background = "var(--bg-3)";
            }}
            onMouseLeave={(e) => {
              if (!selected)
                e.currentTarget.style.background = "transparent";
            }}
          >
            {opt.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   BpmRangePicker — min + max numeric inputs + Apply button
   ============================================================ */

function BpmRangePicker({
  value,
  onApply,
}: {
  value: [number, number] | null;
  onApply: (v: [number, number] | null) => void;
}) {
  const [min, setMin] = React.useState<string>(
    value ? String(value[0]) : "60",
  );
  const [max, setMax] = React.useState<string>(
    value ? String(value[1]) : "200",
  );

  const apply = () => {
    const lo = Math.max(20, Math.min(280, Number(min) || 60));
    const hi = Math.max(lo, Math.min(280, Number(max) || 200));
    onApply([lo, hi]);
  };

  return (
    <div style={{ padding: 6, minWidth: 220 }}>
      <div className="t-mono-s" style={{ marginBottom: 10 }}>
        BPM RANGE
      </div>
      <div className="flex items-center" style={{ gap: 8 }}>
        <input
          inputMode="numeric"
          value={min}
          onChange={(e) =>
            setMin(e.target.value.replace(/[^0-9]/g, ""))
          }
          className="bg-bg-inset border border-border-2 text-fg-1 outline-none t-mono-lg flex-1 min-w-0 focus:border-accent"
          style={{
            height: 36,
            padding: "0 10px",
            borderRadius: "var(--r-sm)",
            textAlign: "center",
          }}
        />
        <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
          —
        </span>
        <input
          inputMode="numeric"
          value={max}
          onChange={(e) =>
            setMax(e.target.value.replace(/[^0-9]/g, ""))
          }
          className="bg-bg-inset border border-border-2 text-fg-1 outline-none t-mono-lg flex-1 min-w-0 focus:border-accent"
          style={{
            height: 36,
            padding: "0 10px",
            borderRadius: "var(--r-sm)",
            textAlign: "center",
          }}
        />
      </div>
      <button
        type="button"
        onClick={apply}
        className="w-full t-mono-s cursor-pointer transition-colors duration-fast bg-accent text-accent-fg hover:bg-accent-hover border-0"
        style={{
          height: 32,
          marginTop: 10,
          borderRadius: "var(--r-sm)",
        }}
      >
        APPLY
      </button>
    </div>
  );
}

/* ============================================================
   BeatGrid — card grid for ViewMode="grid"
   ============================================================ */

function BeatGrid({
  beats,
  totalCount,
  now,
  onPlay,
  onOpen,
  isCurrent,
  isPlaying,
}: {
  beats: BeatWithStatsRow[];
  totalCount: number;
  now: Date;
  onPlay: (b: BeatWithStatsRow) => void;
  onOpen: (b: BeatWithStatsRow) => void;
  isCurrent: (id: string) => boolean;
  isPlaying: (id: string) => boolean;
}) {
  if (beats.length === 0) {
    return (
      <div
        className="t-body"
        style={{
          padding: "32px 12px",
          textAlign: "center",
          color: "var(--fg-3)",
        }}
      >
        {totalCount === 0
          ? "No beats yet."
          : "No beats match these filters."}
      </div>
    );
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 20,
      }}
    >
      {beats.map((b) => (
        <BeatCard
          key={b.id}
          beat={b}
          now={now}
          onPlay={() => onPlay(b)}
          onOpen={() => onOpen(b)}
          current={isCurrent(b.id)}
          playing={isPlaying(b.id)}
        />
      ))}
    </div>
  );
}

function BeatCard({
  beat,
  now,
  onPlay,
  onOpen,
  current,
  playing,
}: {
  beat: BeatWithStatsRow;
  now: Date;
  onPlay: () => void;
  onOpen: () => void;
  current: boolean;
  playing: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  const showOverlay = hovered || current;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      className="cursor-pointer"
    >
      {/* Square cover — clicking it plays instead of opening the
          detail page. */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className="relative overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          borderRadius: "var(--r-md)",
          marginBottom: 10,
        }}
      >
        <CoverArt
          seed={beat.wave_seed || beat.id}
          src={beat.artwork_url ?? undefined}
          fill
          radius={0}
        />

        {/* COMP / LOOP type tag — top-left overlay */}
        {beat.type && (
          <div
            className="absolute"
            style={{ top: 10, left: 10, zIndex: 2 }}
          >
            <Tag
              variant={beat.type === "comp" ? "accent" : "solid"}
              icon={beat.type === "comp" ? "waves" : "repeat"}
            >
              {beat.type === "comp" ? "COMP" : "LOOP"}
            </Tag>
          </div>
        )}

        {/* Hover / current overlay — subtle gradient + accent floating
            play (or pause) button at the bottom-left. */}
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-fast"
          style={{
            background:
              "linear-gradient(180deg, oklch(0 0 0 / 0.05), oklch(0 0 0 / 0.32))",
            opacity: showOverlay ? 1 : 0,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          className="absolute flex items-center justify-center transition-all duration-fast"
          style={{
            left: 12,
            bottom: 12,
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            boxShadow: "0 6px 20px -6px var(--accent-glow)",
            opacity: showOverlay ? 1 : 0,
            transform: showOverlay ? "translateY(0)" : "translateY(6px)",
            pointerEvents: "none",
          }}
        >
          <Icon name={playing ? "pause" : "play"} size={17} />
        </div>
      </div>

      {/* Meta stack */}
      <div className="min-w-0 flex flex-col" style={{ gap: 4 }}>
        {/* Row 1 — title + producer credit inline */}
        <div
          className="flex items-baseline min-w-0"
          style={{ gap: 8 }}
        >
          <span
            className="t-title truncate min-w-0"
            style={{ fontSize: 14 }}
          >
            {beat.title}
          </span>
          {beat.co_producers.length > 0 && (
            <span
              className="t-mono-s shrink-0 truncate"
              style={{
                color: "var(--fg-3)",
                maxWidth: 120,
              }}
            >
              {beat.co_producers.join(" · ")}
            </span>
          )}
        </div>

        {/* Row 2 — BPM · KEY · LENGTH */}
        <div
          className="t-mono-s"
          style={{ color: "var(--fg-3)" }}
        >
          {[
            beat.bpm != null ? `${beat.bpm} BPM` : null,
            beat.key,
            beat.duration_seconds != null
              ? fmtDuration(beat.duration_seconds)
              : null,
          ]
            .filter((s): s is string => Boolean(s))
            .join(" · ")}
        </div>

        {/* Row 3 — engagement (plays · likes) + servers count */}
        <div
          className="flex items-center justify-between"
          style={{ gap: 10 }}
        >
          <div
            className="flex items-center"
            style={{ gap: 12 }}
          >
            <span
              className="t-mono-s inline-flex items-center"
              style={{ gap: 5, color: "var(--fg-3)" }}
            >
              <Icon name="play" size={11} />
              {beat.plays_count}
            </span>
            <span
              className="t-mono-s inline-flex items-center"
              style={{ gap: 5, color: "var(--fg-3)" }}
            >
              <Icon name="heart" size={11} />
              {beat.likes_count}
            </span>
          </div>
          {beat.in_servers_count > 0 ? (
            <span
              className="t-mono-s inline-flex items-center shrink-0"
              style={{ gap: 5, color: "var(--fg-3)" }}
            >
              <Icon name="server" size={11} />
              {beat.in_servers_count} SERVER
              {beat.in_servers_count > 1 ? "S" : ""}
            </span>
          ) : (
            <span
              className="t-mono-s shrink-0"
              style={{ color: "var(--fg-4)" }}
            >
              —
            </span>
          )}
        </div>

        {/* Row 4 — added (relative time) */}
        <div
          className="t-mono-s"
          style={{ color: "var(--fg-4)" }}
        >
          ADDED {fmtAgo(beat.created_at, now)}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BeatList — table-like list with mono header + filtered BeatRows
   ============================================================ */

function BeatList({
  beats,
  now,
  totalCount,
  onPlay,
  onOpen,
  isCurrent,
  isPlaying,
  actions,
}: {
  beats: BeatWithStatsRow[];
  now: Date;
  totalCount: number;
  onPlay: (b: BeatWithStatsRow) => void;
  onOpen: (b: BeatWithStatsRow) => void;
  isCurrent: (id: string) => boolean;
  isPlaying: (id: string) => boolean;
  actions: (b: BeatWithStatsRow) => BeatRowAction[];
}) {
  if (beats.length === 0) {
    return (
      <div
        className="t-body"
        style={{
          padding: "32px 12px",
          textAlign: "center",
          color: "var(--fg-3)",
        }}
      >
        {totalCount === 0
          ? "No beats yet."
          : "No beats match these filters."}
      </div>
    );
  }

  return (
    <div>
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
          className="t-mono-s shrink-0"
          style={{
            width: 100,
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
          <BeatRow
            key={b.id}
            beat={b}
            now={now}
            onPlay={() => onPlay(b)}
            onOpen={() => onOpen(b)}
            isCurrent={isCurrent(b.id)}
            playing={isPlaying(b.id)}
            actions={actions(b)}
          />
        ))}
      </div>
    </div>
  );
}
