/**
 * LikedSongsView — `/listen/liked`.
 *
 * Cross-producer aggregation of every beat the artist has liked.
 * Different shape from ServerView: the cover is a fixed accent
 * heart-card (no mosaic), and the list is a 4-column table
 * (# / BEAT / FROM SERVER / TIME) instead of the meta-rich beat
 * rows we use inside a server.
 *
 * Liked / note / play state is held locally for Phase 1 — Phase 3
 * swaps for real DB-backed state tied to the artist's contact ids.
 */

"use client";

import * as React from "react";
import { usePlayer } from "@/components/app/PlayerContext";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import {
  saveBeatNoteAction,
  toggleLikeAction,
} from "../actions";
import type {
  ArtistLikedEntry,
  ArtistServerViewBeat,
} from "../_data";
import type {
  BeatNote,
  BeatNoteVisibility,
} from "../_mock";
import { BeatNoteModal } from "./BeatNoteModal";
import { toPlayerBeat as toPlayerBeatMock } from "./toPlayerBeat";
import type { MockBeat } from "../_mock";

type LikedEntry = ArtistLikedEntry;

/** Inline shim so the existing dock contract (Beat from
 *  PlayerContext + toPlayerBeat which expects MockBeat) keeps
 *  working without a wider refactor — the real-data beat has the
 *  same shape minus a few mock-only flags. */
function toMockBeat(b: ArtistServerViewBeat): MockBeat {
  return {
    id: b.id,
    title: b.title,
    type: b.type,
    bpm: b.bpm,
    key: b.key,
    mood: b.mood,
    duration: b.duration,
    addedAt: b.addedAt,
    liked: b.liked,
    listened: b.listened,
    commentCount: b.latestCommentBody ? 1 : 0,
    artSeed: b.artSeed,
    coverUrl: b.coverUrl ?? undefined,
    audioUrl: b.audioUrl ?? undefined,
    isNew: b.isNew,
  };
}

interface LikedSongsViewProps {
  entries: ArtistLikedEntry[];
}

export function LikedSongsView({ entries }: LikedSongsViewProps) {
  const all = entries;

  /** Local override map for the like state — toggling off removes
   *  the row from the visible list. Phase 3 deletes the likes row. */
  const [unliked, setUnliked] = React.useState<Record<string, boolean>>({});
  /** Per-beat notes, keyed by beat id. Same dual-visibility shape
   *  as ServerView — private notes stay with the artist, shared
   *  notes reach the producer who owns the beat. */
  const [notes, setNotes] = React.useState<Record<string, BeatNote>>(
    {},
  );
  /** Entry (producer + beat) whose note modal is open. Keeping the
   *  whole entry rather than just the beat means the modal can show
   *  the right producer @handle on the share-with copy. */
  const [noteFor, setNoteFor] = React.useState<LikedEntry | null>(null);

  // Playback comes from the global PlayerContext (mounted in
  // ArtistShell) — the dock is the source of truth for which beat
  // is current, so the row's play overlay just mirrors it.
  const player = usePlayer();
  const playingId =
    player.current && player.playing ? player.current.id : null;

  const visible = all.filter((e) => !unliked[e.beat.id]);
  const count = visible.length;

  const toggleLike = (beatId: string, slug: string) => {
    // Optimistic: hide the row immediately. Action is authoritative
    // and idempotent — it reads the DB and deletes the like (or no-
    // ops if it's already gone). revalidate refreshes /listen/liked
    // on the next navigation in.
    setUnliked((prev) => ({ ...prev, [beatId]: true }));
    void toggleLikeAction(slug, beatId).then((r) => {
      if (!r.ok) console.warn("[toggleLikeAction]", r.error);
    });
  };
  const togglePlay = (beat: ArtistServerViewBeat) =>
    player.toggle(toPlayerBeatMock(toMockBeat(beat)));
  const saveNote = (
    id: string,
    text: string,
    visibility: BeatNoteVisibility,
    slug: string,
  ) => {
    setNotes((prev) => ({ ...prev, [id]: { text, visibility } }));
    void saveBeatNoteAction(slug, id, text, visibility).then((r) => {
      if (!r.ok) console.warn("[saveBeatNoteAction]", r.error);
    });
  };

  return (
    <main className="flex-1 min-w-0">
      {/* ── Header — accent heart card + eyebrow + title + play
              all. Backdrop is the design-system's spec'd vertical
              wash: top → bottom from --accent-surface (16% in
              dark, 10% in light — auto-adapts via the token) to
              transparent at 70% of the box height. The wash is
              applied to the section itself which then breaks out
              of the 1440 column via the negative-margin trick so
              it bleeds to the visible column edges; equal positive
              paddings pull the inner content back to its original
              alignment. ──────────────────────────────────────── */}
      <section
        className="relative pt-[24px] pb-[40px] lg:pt-[32px] lg:pb-[56px]"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          paddingLeft: "calc(50vw - 50%)",
          paddingRight: "calc(50vw - 50%)",
          background:
            "linear-gradient(180deg, var(--accent-surface), transparent 70%)",
        }}
      >
        <div
          className="flex flex-col items-center text-center lg:flex-row lg:items-end lg:text-left px-[18px] lg:px-[36px]"
          style={{ gap: 22 }}
        >
          {/* Heart cover — brand-fixed 140° diagonal from the
              indigo accent to a violet/magenta (per the design
              system's gradient spec for the Liked Songs tile).
              Same gradient regardless of theme so the cover
              stays visually consistent across light + dark. */}
          <div
            className="relative shrink-0 overflow-hidden flex items-center justify-center w-[150px] h-[150px] lg:w-[200px] lg:h-[200px]"
            style={{
              borderRadius: "var(--r-md)",
              background:
                "linear-gradient(140deg, var(--accent), oklch(0.5 0.22 320))",
              boxShadow:
                "0 10px 30px -10px oklch(0 0 0 / 0.35), 0 2px 6px oklch(0 0 0 / 0.18)",
            }}
          >
            <Icon name="heart" size={72} style={{ color: "white" }} />
          </div>

          {/* Title block */}
          <div className="min-w-0 flex-1">
            <div
              className="t-mono-s"
              style={{
                color: "var(--accent-text)",
                letterSpacing: "0.12em",
                marginBottom: 10,
              }}
            >
              PLAYLIST · AUTO
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(28px, 6vw, 54px)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                color: "var(--fg-1)",
                margin: 0,
                marginBottom: 14,
              }}
            >
              Liked Songs
            </h1>
            <div
              className="t-mono-s"
              style={{ color: "var(--fg-3)" }}
            >
              {count} BEAT{count === 1 ? "" : "S"} · SAVED ACROSS
              ALL YOUR PRODUCERS
            </div>
          </div>

          {/* Play all — kicks off the dock on the first liked
              beat. Disabled when the list is empty. */}
          {/* Shuffle + Play cluster — mirrors the ServerView
              header: outline-less shuffle on the left, flat
              accent play on the right, no drop-shadow. */}
          <div
            className="shrink-0 inline-flex items-center"
            style={{ gap: 14 }}
          >
            <button
              type="button"
              aria-label="Shuffle liked"
              disabled={count === 0}
              onClick={() => {
                if (visible.length === 0) return;
                const i = Math.floor(Math.random() * visible.length);
                togglePlay(visible[i].beat);
              }}
              className="grid place-items-center cursor-pointer transition-transform duration-fast hover:scale-105"
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "transparent",
                border: "none",
                color: "var(--fg-1)",
                opacity: count === 0 ? 0.4 : 1,
              }}
            >
              <Icon name="shuffle" size={22} />
            </button>
            <button
              type="button"
              aria-label="Play all liked"
              disabled={count === 0}
              onClick={() => {
                const first = visible[0]?.beat;
                if (first) togglePlay(first);
              }}
              className="grid place-items-center cursor-pointer transition-transform duration-fast hover:scale-105"
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "var(--accent)",
                border: "none",
                color: "white",
                opacity: count === 0 ? 0.4 : 1,
              }}
            >
              <Icon name="play" size={22} style={{ marginLeft: 2 }} />
            </button>
          </div>
        </div>
      </section>

      {/* ── List — same flat row shape as the ServerView so the
              Liked Songs surface feels like just another server,
              rather than a database table. ─────────────────── */}
      <section className="px-[12px] pb-12 lg:px-[28px]">
        {count === 0 ? (
          <EmptyState />
        ) : (
          visible.map((entry) => (
            <LikedRow
              key={entry.beat.id}
              entry={entry}
              noteVisibility={
                // Hydrate from the server payload the same way
                // ServerView does, so a beat that was already
                // commented or noted lights up the message icon
                // on first paint. Local optimistic edit wins.
                notes[entry.beat.id]?.text?.trim()
                  ? notes[entry.beat.id].visibility
                  : entry.beat.latestCommentBody?.trim()
                    ? "shared"
                    : entry.beat.noteBody?.trim()
                      ? "private"
                      : null
              }
              playing={playingId === entry.beat.id}
              onTogglePlay={() => togglePlay(entry.beat)}
              onToggleLike={() => toggleLike(entry.beat.id, entry.server.slug)}
              onOpenNote={() => setNoteFor(entry)}
            />
          ))
        )}
      </section>

      {noteFor && (
        <BeatNoteModal
          beat={{
            ...noteFor.beat,
            // MockBeat uses string | undefined for nullable URLs;
            // ArtistServerViewBeat keeps string | null. Normalize
            // here so the spread doesn't propagate the null.
            coverUrl: noteFor.beat.coverUrl ?? undefined,
            audioUrl: noteFor.beat.audioUrl ?? undefined,
            // MockBeat surfaces commentCount; the artist view
            // stores latestCommentBody (one preview row) instead.
            // Mirror page.tsx's beatToMock conversion.
            commentCount: noteFor.beat.latestCommentBody ? 1 : 0,
          }}
          initialNote={notes[noteFor.beat.id]?.text ?? ""}
          initialVisibility={
            notes[noteFor.beat.id]?.visibility ?? "private"
          }
          producerHandle={noteFor.producer.handle}
          onClose={() => setNoteFor(null)}
          onSave={(text, visibility) => {
            saveNote(noteFor.beat.id, text, visibility, noteFor.server.slug);
            setNoteFor(null);
          }}
        />
      )}
    </main>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

interface LikedRowProps {
  entry: LikedEntry;
  noteVisibility: BeatNoteVisibility | null;
  playing: boolean;
  onTogglePlay: () => void;
  onToggleLike: () => void;
  onOpenNote: () => void;
}

/** Mirrors the ServerView BeatRow shape: cover · title / @producer
 *  (mobile) or title + COMP/meta line (desktop) · message + heart
 *  + […] popover cluster pinned right. */
function LikedRow({
  entry,
  noteVisibility,
  playing,
  onTogglePlay,
  onToggleLike,
  onOpenNote,
}: LikedRowProps) {
  const { producer, beat } = entry;
  const [hovered, setHovered] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const detailsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!detailsOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!detailsRef.current?.contains(e.target as Node))
        setDetailsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailsOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [detailsOpen]);

  const metaLine = [`${beat.bpm} BPM`, beat.key, beat.duration].join(" · ");
  const producerAt = producer.handle.startsWith("@")
    ? producer.handle
    : `@${producer.handle}`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center transition-colors duration-fast"
      style={{
        gap: 12,
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        background: hovered ? "var(--bg-2)" : "transparent",
      }}
    >
      {/* Cover with play overlay */}
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="relative shrink-0 overflow-hidden cursor-pointer"
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--r-sm)",
          border: "none",
          padding: 0,
        }}
      >
        <CoverArt fill seed={beat.artSeed} src={beat.coverUrl ?? undefined} />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              hovered || playing ? "oklch(0 0 0 / 0.5)" : "transparent",
            transition: "background var(--dur-fast) var(--ease)",
            color: "#fff",
          }}
        >
          {(hovered || playing) && (
            <Icon
              name={playing ? "pause" : "play"}
              size={18}
              style={{ marginLeft: playing ? 0 : 2 }}
            />
          )}
        </div>
      </button>

      {/* Title + producer (mobile) or title + meta line (desktop). */}
      <div className="min-w-0 flex-1">
        <div className="truncate" style={{ minWidth: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14.5,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {beat.title}
          </span>
        </div>

        {/* Mobile: @producer directly under the title. */}
        <div
          className="sm:hidden truncate t-mono-s"
          style={{
            color: "var(--fg-3)",
            marginTop: 1,
            lineHeight: 1.3,
          }}
        >
          {producerAt.toUpperCase()}
        </div>

        {/* Desktop: COMP tag + inline meta + mood tags. */}
        <div
          className="hidden sm:flex items-center flex-wrap"
          style={{ gap: 7, marginTop: 5 }}
        >
          {beat.type === "comp" && (
            <Tag variant="accent" icon="waves">
              COMP
            </Tag>
          )}
          {beat.type === "loop" && (
            <Tag variant="solid" icon="repeat">
              LOOP
            </Tag>
          )}
          <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
            {metaLine}
          </span>
          <span
            className="t-mono-s truncate"
            style={{ color: "var(--fg-4)" }}
          >
            · {producerAt.toUpperCase()}
          </span>
          {beat.mood.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
      </div>

      {/* Action cluster — message, heart, … (mobile popover). */}
      <div className="flex items-center" style={{ gap: 2 }}>
        <button
          type="button"
          aria-label={
            noteVisibility === "shared"
              ? "Open note (shared with producer)"
              : noteVisibility === "private"
                ? "Open note (private)"
                : "Open note"
          }
          onClick={onOpenNote}
          className="relative inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
          style={{
            width: 32,
            height: 32,
            border: "none",
            borderRadius: "var(--r-sm)",
            background:
              noteVisibility === "shared"
                ? "var(--accent-surface)"
                : noteVisibility === "private"
                  ? "var(--bg-2)"
                  : "transparent",
            color:
              noteVisibility === "shared"
                ? "var(--accent-text)"
                : noteVisibility === "private"
                  ? "var(--fg-2)"
                  : "var(--fg-4)",
          }}
        >
          <Icon name="message" size={16} />
          {noteVisibility === "shared" && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                border: "1.5px solid var(--bg-0)",
              }}
            />
          )}
        </button>
        <button
          type="button"
          aria-label="Unlike"
          onClick={onToggleLike}
          className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
          style={{
            width: 32,
            height: 32,
            border: "none",
            borderRadius: "var(--r-sm)",
            background: "transparent",
            color: "var(--accent)",
          }}
        >
          <Icon
            name="heart"
            size={16}
            style={{ fill: "var(--accent)" }}
          />
        </button>

        {/* Mobile-only "…" details popover */}
        <div ref={detailsRef} className="relative shrink-0 sm:hidden">
          <button
            type="button"
            aria-label="Show beat details"
            aria-expanded={detailsOpen}
            onClick={(e) => {
              e.stopPropagation();
              setDetailsOpen((v) => !v);
            }}
            className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--r-sm)",
              border: "none",
              background: detailsOpen ? "var(--bg-3)" : "transparent",
              color: "var(--fg-4)",
            }}
          >
            <Icon name="more" size={16} />
          </button>
          {detailsOpen && <DetailsPopover beat={beat} />}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: "64px 24px",
        color: "var(--fg-3)",
        gap: 12,
      }}
    >
      <div
        className="grid place-items-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--bg-2)",
          color: "var(--fg-4)",
        }}
      >
        <Icon name="heart" size={24} />
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          color: "var(--fg-1)",
        }}
      >
        No liked songs yet
      </div>
      <div className="t-mono-s">
        Hit ♥ on a beat from any server to save it here.
      </div>
    </div>
  );
}

/* ============================================================
   DetailsPopover — mirrors the ServerView popover. Two-column
   key/value rows on top, mood chips underneath, generous
   padding so the surface feels premium instead of cramped.
   ============================================================ */

function DetailsPopover({
  beat,
}: {
  beat: ArtistServerViewBeat;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "TEMPO", value: `${beat.bpm} BPM` },
    { label: "KEY", value: beat.key },
    { label: "LENGTH", value: beat.duration },
    { label: "TYPE", value: beat.type.toUpperCase() },
  ];
  return (
    <div
      role="dialog"
      aria-label="Beat details"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        zIndex: 20,
        width: "min(260px, calc(100vw - 24px))",
        padding: "16px 18px",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-1)",
        background: "var(--bg-1)",
        boxShadow: "var(--shadow-pop)",
        color: "var(--fg-1)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        className="t-mono-s"
        style={{
          color: "var(--accent-text)",
          letterSpacing: "0.1em",
          marginBottom: 2,
        }}
      >
        DETAILS
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          rowGap: 8,
          columnGap: 14,
        }}
      >
        {rows.map((r) => (
          <React.Fragment key={r.label}>
            <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
              {r.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--fg-1)",
                textAlign: "right",
              }}
            >
              {r.value}
            </span>
          </React.Fragment>
        ))}
      </div>
      {beat.mood.length > 0 && (
        <>
          <div
            aria-hidden
            style={{ height: 1, background: "var(--border-1)" }}
          />
          <div
            className="t-mono-s"
            style={{ color: "var(--fg-4)", marginBottom: -4 }}
          >
            MOOD
          </div>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {beat.mood.map((m) => (
              <span
                key={m}
                className="t-mono-s"
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--border-1)",
                  color: "var(--fg-2)",
                  letterSpacing: "0.06em",
                }}
              >
                {m.toUpperCase()}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
