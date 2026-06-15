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
import { BeatRow } from "@/components/app/BeatRow";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { KEY_OPTIONS, MOOD_SUGGEST } from "@/lib/audio";
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

  /** Pool of unique moods present in the producer's library +
   *  defaults from MOOD_SUGGEST — gives the chip something to show
   *  even when the producer hasn't tagged any beats yet. */
  const moodOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const b of beats) for (const m of b.mood) set.add(m);
    for (const s of MOOD_SUGGEST) set.add(s);
    return Array.from(set).sort();
  }, [beats]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return beats.filter((b) => {
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
  }, [beats, type, search, mood, bpmRange, musicKey, serverId, beatServers]);

  return (
    <div>
      {/* Search + Segmented row — search has a fixed-ish width on
          desktop (340-360) so the segmented sits next to it as a
          paired toolbar instead of being pushed to the far right of
          the 1440 container. */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center"
        style={{ gap: 12, marginBottom: 14 }}
      >
        <SearchBeats value={search} onChange={setSearch} />
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

      {/* Filter chips row */}
      <div
        className="flex flex-wrap"
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
      </div>

      {/* Filtered BeatList */}
      <BeatList beats={filtered} now={now} totalCount={beats.length} />
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
      className="flex items-center bg-bg-inset border border-border-1 transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)] w-full sm:w-auto sm:flex-none"
      style={{
        height: 36,
        padding: "0 14px",
        gap: 9,
        borderRadius: "var(--r-pill)",
        // Constrained on desktop so the search input doesn't stretch
        // edge-to-edge — segmented sits right next to it instead of
        // being pushed to the far right of a 1440 container.
        flexBasis: 340,
        maxWidth: 360,
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
   BeatList — table-like list with mono header + filtered BeatRows
   ============================================================ */

function BeatList({
  beats,
  now,
  totalCount,
}: {
  beats: BeatWithStatsRow[];
  now: Date;
  totalCount: number;
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
          <BeatRow key={b.id} beat={b} now={now} />
        ))}
      </div>
    </div>
  );
}
