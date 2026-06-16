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
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { likedBeats, type MockBeat, type MockProducer, type MockServer } from "../_mock";
import { BeatNoteModal } from "./BeatNoteModal";

type LikedEntry = {
  producer: MockProducer;
  server: MockServer;
  beat: MockBeat;
};

export function LikedSongsView() {
  const all = likedBeats();

  /** Local override map for the like state — toggling off removes
   *  the row from the visible list. Phase 3 deletes the likes row. */
  const [unliked, setUnliked] = React.useState<Record<string, boolean>>({});
  /** Per-beat private notes, keyed by beat id (mirrors ServerView). */
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  /** Beat whose note modal is open. */
  const [noteFor, setNoteFor] = React.useState<MockBeat | null>(null);
  /** Currently-playing beat id (one-at-a-time). */
  const [playingId, setPlayingId] = React.useState<string | null>(null);

  const visible = all.filter((e) => !unliked[e.beat.id]);
  const count = visible.length;

  const toggleLike = (id: string) =>
    setUnliked((prev) => ({ ...prev, [id]: !prev[id] }));
  const togglePlay = (id: string) =>
    setPlayingId((cur) => (cur === id ? null : id));
  const saveNote = (id: string, next: string) =>
    setNotes((prev) => ({ ...prev, [id]: next }));

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

          {/* Play all — disabled when empty. */}
          <button
            type="button"
            aria-label="Play all liked"
            disabled={count === 0}
            className="shrink-0 grid place-items-center cursor-pointer"
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
      </section>

      {/* ── Table ──────────────────────────────────────────────── */}
      <section className="px-[12px] pb-12 lg:px-[28px]">
        {count === 0 ? (
          <EmptyState />
        ) : (
          <>
            <TableHeader />
            {visible.map((entry, i) => (
              <LikedRow
                key={entry.beat.id}
                index={i + 1}
                entry={entry}
                noteCount={notes[entry.beat.id]?.length ? 1 : 0}
                playing={playingId === entry.beat.id}
                onTogglePlay={() => togglePlay(entry.beat.id)}
                onToggleLike={() => toggleLike(entry.beat.id)}
                onOpenNote={() => setNoteFor(entry.beat)}
              />
            ))}
          </>
        )}
      </section>

      {noteFor && (
        <BeatNoteModal
          beat={noteFor}
          initialNote={notes[noteFor.id] ?? ""}
          onClose={() => setNoteFor(null)}
          onSave={(next) => {
            saveNote(noteFor.id, next);
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

function TableHeader() {
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: "28px 1fr minmax(140px, 220px) 110px",
        gap: 12,
        padding: "0 12px 8px",
        marginBottom: 4,
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
        #
      </span>
      <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
        BEAT
      </span>
      {/* Hidden on narrow screens — the FROM SERVER cell collapses
          under the title in LikedRow. */}
      <span
        className="t-mono-s hidden sm:inline"
        style={{ color: "var(--fg-4)" }}
      >
        FROM SERVER
      </span>
      <span
        className="t-mono-s"
        style={{ color: "var(--fg-4)", textAlign: "right" }}
      >
        TIME
      </span>
    </div>
  );
}

interface LikedRowProps {
  index: number;
  entry: LikedEntry;
  noteCount: number;
  playing: boolean;
  onTogglePlay: () => void;
  onToggleLike: () => void;
  onOpenNote: () => void;
}

function LikedRow({
  index,
  entry,
  noteCount,
  playing,
  onTogglePlay,
  onToggleLike,
  onOpenNote,
}: LikedRowProps) {
  const { producer, server, beat } = entry;
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="grid items-center"
      style={{
        gridTemplateColumns: "28px 1fr minmax(140px, 220px) 110px",
        gap: 12,
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        background: hovered ? "var(--bg-2)" : "transparent",
      }}
    >
      {/* # */}
      <span
        className="t-mono-s"
        style={{ color: "var(--fg-4)", textAlign: "left" }}
      >
        {String(index).padStart(2, "0")}
      </span>

      {/* BEAT — cover thumb + title + @handle + type chip + meta */}
      <div className="flex items-center min-w-0" style={{ gap: 12 }}>
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
          <CoverArt fill seed={beat.artSeed} src={beat.coverUrl} />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                hovered || playing
                  ? "oklch(0 0 0 / 0.5)"
                  : "transparent",
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

        <div className="min-w-0 flex-1">
          <div
            className="flex items-center min-w-0"
            style={{ gap: 8 }}
          >
            <span
              className="truncate"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14.5,
                fontWeight: 600,
                color: "var(--fg-1)",
              }}
            >
              {beat.title}
            </span>
            <span
              className="t-mono-s truncate"
              style={{ color: "var(--fg-3)" }}
            >
              @{producer.handle}
            </span>
          </div>
          <div
            className="flex items-center flex-wrap"
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
            <span
              className="t-mono-s"
              style={{ color: "var(--fg-3)" }}
            >
              {`${beat.bpm} BPM`} · {beat.key}
            </span>
            {beat.mood.map((m) => (
              <Tag key={m}>{m}</Tag>
            ))}
          </div>
        </div>
      </div>

      {/* FROM SERVER — server name + producer @ underneath. Hidden
          on narrow screens; the producer @ is already shown next to
          the beat title above. */}
      <div className="min-w-0 hidden sm:block">
        <div
          className="t-mono-s truncate"
          style={{
            color: "var(--fg-2)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {server.name}
        </div>
        <div
          className="t-mono-s truncate"
          style={{ color: "var(--fg-4)" }}
        >
          @{producer.handle}
        </div>
      </div>

      {/* TIME + actions */}
      <div className="flex items-center justify-end" style={{ gap: 4 }}>
        <span
          className="t-mono-s"
          style={{ color: "var(--fg-3)", minWidth: 36, textAlign: "right" }}
        >
          {beat.duration}
        </span>
        <button
          type="button"
          aria-label="Open note"
          onClick={onOpenNote}
          className="inline-flex items-center justify-center cursor-pointer"
          style={{
            width: 32,
            height: 32,
            border: "none",
            borderRadius: "var(--r-sm)",
            background: "transparent",
            color:
              noteCount > 0 ? "var(--accent)" : "var(--fg-4)",
          }}
        >
          <Icon name="comment-blank" size={16} />
        </button>
        <button
          type="button"
          aria-label="Unlike"
          onClick={onToggleLike}
          className="inline-flex items-center justify-center cursor-pointer"
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
