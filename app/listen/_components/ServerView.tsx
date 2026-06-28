/**
 * ServerView — main content for `/listen/<slug>`.
 *
 * Top → bottom:
 *   1. Banner — gradient + 4-cover mosaic on the left, server title +
 *      producer mini-card + socials in the middle, big play-all button
 *      on the right.
 *   2. Toolbar — filter chips (ALL / NEW / LIKED) and a sort dropdown.
 *   3. Beat list — each row shows a small cover, title, BPM · KEY,
 *      mood chips, duration, and three actions: comment, mark
 *      listened (eye), like (heart).
 *
 * Liked / listened state is held in local React state for Phase 1
 * — Phase 3 swaps these for real likes/listens rows tied to the
 * artist's contact.id.
 */

"use client";

import * as React from "react";
import { usePlayer } from "@/components/app/PlayerContext";
import { Avatar } from "@/components/ui/Avatar";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { hashSeed } from "@/lib/seed";
import { PLATFORM_ICON } from "@/lib/socials";
import type {
  BeatNote,
  BeatNoteVisibility,
  MockBeat,
  MockProducer,
  MockServer,
} from "../_mock";
import {
  bannerGradient,
  BANNER_FADE_MASK,
  BANNER_GLOW_MASK,
} from "./banner";
import {
  markListenedAction,
  saveBeatNoteAction,
  toggleLikeAction,
} from "../actions";
import { BeatNoteModal } from "./BeatNoteModal";
import { toPlayerBeat } from "./toPlayerBeat";

/** Banner backdrop dispatcher — mirrors the producer's choice in
 *  the Create Server form (servers.artwork_mode):
 *    IMAGE → producer's uploaded artwork, washed down to a soft
 *            pastel cloud (heavy blur, desaturate, opacity 0.45,
 *            glow-mask).
 *    AUTO  → same treatment on the first beat cover URL — Spotify-
 *            style "this pack's colour" but at premium density.
 *            Falls back to a slug-seeded hue mesh if no cover is
 *            attached yet.
 *    COLOR → existing hue mesh built from accent_hue.
 *  Every mode shares the same fade-to-bg-0 bottom feel so the
 *  banner blends into the page background without a hard line. */
function BannerBackground({ server }: { server: MockServer }) {
  // Source URL for the photo-backed modes (IMAGE or AUTO). Both go
  // through the identical filter stack — only the source differs.
  const photoSrc =
    server.artworkMode === "image"
      ? server.artworkImageUrl
      : server.artworkMode === "auto"
        ? server.artUrls?.[0]
        : null;

  if (photoSrc) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${photoSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(90px) saturate(0.75) brightness(1.05)",
          transform: "scale(1.4)",
          opacity: 0.45,
          WebkitMaskImage: BANNER_GLOW_MASK,
          maskImage: BANNER_GLOW_MASK,
          zIndex: 0,
        }}
      />
    );
  }
  // COLOR (or AUTO fallback when no cover URL yet) — hue mesh.
  const hue =
    server.accentHue ?? hashSeed(server.slug) % 360;
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background: bannerGradient(hue),
        WebkitMaskImage: BANNER_FADE_MASK,
        maskImage: BANNER_FADE_MASK,
        zIndex: 0,
      }}
    />
  );
}

type Filter = "all" | "new" | "liked" | "hidden";

interface ServerViewProps {
  producer: MockProducer;
  server: MockServer;
}

export function ServerView({ producer, server }: ServerViewProps) {
  const [filter, setFilter] = React.useState<Filter>("all");
  // Mood pill — single-select. null = no mood filter.
  const [moodFilter, setMoodFilter] = React.useState<string | null>(null);
  // Layout toggle — mirror the producer Library's list/grid switch.
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  // Sort order — toggles between newest-first and oldest-first.
  // Default newest so the latest uploads sit at the top.
  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest">(
    "newest",
  );
  // Playback state is owned by the global PlayerContext (mounted in
  // ArtistShell) so the dock can survive route changes and other
  // pages can observe the same currently-playing beat.
  const player = usePlayer();
  const playingId =
    player.current && player.playing ? player.current.id : null;
  // Local override of the mock liked/listened state — toggling on
  // a row updates this map and the row re-renders.
  const [overrides, setOverrides] = React.useState<
    Record<string, { liked?: boolean; listened?: boolean }>
  >({});
  // Per-beat "hidden" state, decoupled from listened. listened is
  // auto-stamped when the artist hits play (so the producer's
  // play count grows); hidden is only set when the artist taps
  // the eye button. Without the split, playing a beat would
  // immediately move it into the Hidden tab. Local-only for V1
  // — persisting it lands with a `hidden_beats` table later.
  const [hidden, setHidden] = React.useState<Record<string, boolean>>(
    {},
  );
  /** Per-beat notes, keyed by beat id. The artist picks visibility
   *  inside the modal — private notes stay local to them, shared
   *  notes reach the producer (Phase 3 splits at the DB:
   *  beat_notes vs. beat_comments). */
  const [notes, setNotes] = React.useState<Record<string, BeatNote>>(
    {},
  );
  /** Beat whose note modal is currently open; null = closed. */
  const [noteFor, setNoteFor] = React.useState<MockBeat | null>(null);

  const beats = server.beats.map((b) => ({
    ...b,
    liked: overrides[b.id]?.liked ?? b.liked,
    listened: overrides[b.id]?.listened ?? b.listened,
    // Local-only hidden flag — independent of the listened
    // auto-stamp. true = artist tapped the eye button.
    hidden: hidden[b.id] ?? false,
  }));

  const counts = {
    all: beats.filter((b) => !b.hidden).length,
    new: beats.filter((b) => b.isNew && !b.hidden).length,
    liked: beats.filter((b) => b.liked && !b.hidden).length,
    hidden: beats.filter((b) => b.hidden).length,
  };

  // Mood pills surfaced under the existing filter chips. Compute
  // the unique mood set across the current beats so empty mood
  // tags don't render dead chips.
  const moodOptions = Array.from(
    new Set(beats.flatMap((b) => b.mood)),
  ).sort();

  const filtered = beats.filter((b) => {
    // Hidden is the only tab that shows hidden beats; every
    // other view excludes them.
    if (filter === "hidden") {
      if (!b.hidden) return false;
    } else if (b.hidden) {
      return false;
    }
    if (filter === "new" && !b.isNew) return false;
    if (filter === "liked" && !b.liked) return false;
    if (moodFilter && !b.mood.includes(moodFilter)) return false;
    return true;
  });
  // The server payload arrives in pivot-position order (which is
  // the producer's curated newest-first ordering). For "oldest
  // first" we reverse the visible array — no extra field needed,
  // and the cost is O(n) on what is at most a few dozen beats.
  const visible =
    sortOrder === "oldest" ? [...filtered].reverse() : filtered;

  const toggleLike = (id: string) => {
    // Optimistic flip on the override, then fire the action. The
    // action is authoritative — it reads the DB and either deletes
    // or inserts based on what's there, never failing on a stale
    // client state. revalidatePath() inside the action refreshes
    // the server-rendered beats, which propagates the new liked
    // value to this component on the next render — even if the
    // optimistic override is now wrong, the re-render's
    // beats[i].liked wins via the override fallback (override
    // only sticks while the user keeps clicking; the fresh server
    // data is the truth on quiet states).
    const prevLiked =
      overrides[id]?.liked ??
      beats.find((b) => b.id === id)?.liked ??
      false;
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], liked: !prevLiked },
    }));
    void toggleLikeAction(server.slug, id).then((r) => {
      if (!r.ok) console.warn("[toggleLikeAction]", r.error);
    });
  };

  // Toggle the local hidden flag — independent of listened. The
  // eye button on each row calls this; the auto-listen path on
  // play() never touches it.
  const toggleHidden = (id: string) =>
    setHidden((prev) => ({ ...prev, [id]: !prev[id] }));

  // Auto-listen override (used at play-time only) — separate so
  // it doesn't drag the row into the Hidden tab.
  const markListenedLocal = (id: string) =>
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], listened: true },
    }));

  const togglePlay = (beat: MockBeat) => {
    // Auto-mark listened the FIRST time the artist hits play on a
    // given beat — same semantic as before, just gated on whether
    // the global player is already on this beat.
    const isCurrent = player.current?.id === beat.id;
    if (!isCurrent) {
      markListenedLocal(beat.id);
      // Persist a `listens` row. completion_pct is omitted at
      // play-start; a follow-up "did they actually finish it"
      // signal can write a second row later. Errors logged only —
      // we don't want a flaky network to undo the play feeling.
      void markListenedAction(server.slug, beat.id).then((r) => {
        if (!r.ok) console.warn("[markListenedAction]", r.error);
      });
    }
    player.toggle(toPlayerBeat(beat));
  };

  const styleTags = server.styleText
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const socialEntries = Object.entries(producer.socials).filter(
    ([k, v]) => v && PLATFORM_ICON[k],
  );

  return (
    <main className="flex-1 min-w-0">
      {/* ── Banner — deep jewel-toned mesh radiating from the top,
              fading INTO the page bg at the bottom (no hard line).
              The gradient lives on an absolute layer behind the
              content so the mask only affects the colour cloud,
              not the title / artwork / play button.

              Section uses the same negative-margin full-bleed trick
              as the Liked Songs hero: it breaks out of the 1440
              column to span the visible column width, then equal
              positive paddings pull the inner content back to its
              original column alignment. The BannerBackground div
              still fills the section via inset-0 — it just covers
              a wider area now.

              Mobile: stack mosaic, title block, play button
              vertically. Desktop: horizontal row. ──────────────── */}
      <section
        className="relative pb-[60px] pt-[24px] lg:pb-[80px] lg:pt-[32px]"
      >
        {/* Background — mode-aware (auto / color / image), masked
            to fade out at the bottom. */}
        <BannerBackground server={server} />

        <div
          className="relative flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left px-[18px] lg:px-[36px]"
          style={{ gap: 22, zIndex: 1 }}
        >
          {/* 4-cover mosaic — slightly smaller on mobile so the
              stacked title still fits above the fold. */}
          <div
            className="relative shrink-0 overflow-hidden w-[150px] h-[150px] lg:w-[180px] lg:h-[180px]"
            style={{
              borderRadius: "var(--r-md)",
              boxShadow:
                "0 10px 30px -10px oklch(0 0 0 / 0.35), 0 2px 6px oklch(0 0 0 / 0.18)",
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: 2,
                width: "100%",
                height: "100%",
              }}
            >
              {server.artSeeds.slice(0, 4).map((seed, i) => (
                <div key={i} className="relative overflow-hidden">
                  <CoverArt
                    fill
                    seed={seed}
                    src={server.artUrls?.[i]}
                  />
                </div>
              ))}
            </div>
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
              SERVER ·{" "}
              {styleTags.map((t) => t.toUpperCase()).join(" · ")}
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
              {server.name}
            </h1>

            {/* Producer mini-card — theme-aware text tokens so the
                light theme reads dark-on-pastel and dark mode reads
                white-on-jewel-mesh without two hardcoded colour
                paths. Centred on mobile, left-aligned on lg+. */}
            <div
              className="flex items-center flex-wrap justify-center lg:justify-start"
              style={{ gap: 12 }}
            >
              <Avatar
                name={producer.name}
                src={producer.avatarUrl}
                size={32}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13.5,
                  color: "var(--fg-1)",
                }}
              >
                {producer.name} ·{" "}
                <span style={{ color: "var(--fg-3)" }}>
                  @{producer.handle}
                </span>
              </span>
              <span
                className="t-mono-s"
                style={{ color: "var(--fg-3)" }}
              >
                · {server.beats.length} BEATS
              </span>
              {socialEntries.length > 0 && (
                <div
                  className="inline-flex items-center"
                  style={{ gap: 8 }}
                >
                  {socialEntries.map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${platform}`}
                      className="inline-flex items-center justify-center transition-colors duration-fast"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "var(--bg-2)",
                        border: "1px solid var(--border-1)",
                        color: "var(--fg-2)",
                      }}
                    >
                      <Icon
                        name={PLATFORM_ICON[platform] as IconName}
                        size={13}
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Play-all cluster — shuffle + play, side-by-side,
              no drop-shadow (Spotify/Deezer pattern). Shuffle on
              the left as a flat outline-only button; play on the
              right as the filled accent CTA. */}
          <div
            className="shrink-0 inline-flex items-center"
            style={{ gap: 14 }}
          >
            <button
              type="button"
              aria-label={`Shuffle ${server.name}`}
              onClick={() => {
                if (visible.length === 0) return;
                const i = Math.floor(Math.random() * visible.length);
                togglePlay(visible[i]);
              }}
              className="inline-flex items-center justify-center cursor-pointer transition-transform duration-fast hover:scale-105 w-[44px] h-[44px] lg:w-[48px] lg:h-[48px]"
              style={{
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "var(--fg-1)",
              }}
            >
              <Icon name="shuffle" size={22} />
            </button>
            <button
              type="button"
              aria-label={`Play all ${server.name}`}
              onClick={() => {
                const first = visible[0];
                if (first) togglePlay(first);
              }}
              className="inline-flex items-center justify-center cursor-pointer transition-transform duration-fast hover:scale-105 w-[56px] h-[56px] lg:w-[64px] lg:h-[64px]"
              style={{
                borderRadius: "50%",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              <Icon name="play" size={28} style={{ marginLeft: 3 }} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Toolbar — filter chips on the left, sort + grid toggle
              on the right. position relative + zIndex ensures the
              chips sit above the banner's faded gradient tail,
              which otherwise (despite living in a sibling section)
              can swallow clicks in some browser layout passes. */}
      <div
        className="relative flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-3 px-[18px] pt-[18px] pb-[10px] lg:px-[30px] lg:pt-[20px] lg:pb-[12px]"
        style={{ zIndex: 2 }}
      >
        {/* Filter chips — horizontal scroll on mobile so the 4th
            "Hidden" chip stays reachable without wrapping or
            clipping. shrink-0 on each FilterChip prevents flex
            from squishing them. */}
        <div
          className="flex items-center overflow-x-auto -mx-[18px] px-[18px] lg:mx-0 lg:px-0"
          style={{ gap: 8, scrollbarWidth: "none" }}
        >
          <FilterChip
            label="All"
            count={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="New"
            icon="zap"
            count={counts.new}
            active={filter === "new"}
            onClick={() => setFilter("new")}
          />
          <FilterChip
            label="Liked"
            icon="heart"
            count={counts.liked}
            active={filter === "liked"}
            onClick={() => setFilter("liked")}
          />
          <FilterChip
            label="Hidden"
            icon="eye-off"
            count={counts.hidden}
            active={filter === "hidden"}
            onClick={() => setFilter("hidden")}
          />
        </div>

        {/* Right cluster — sort + grid toggle, kept out of the
            overflow container so neither one clips. */}
        <div
          className="flex items-center self-start lg:self-auto shrink-0"
          style={{ gap: 8 }}
        >
          <div
            className="inline-flex items-center shrink-0"
            style={{
              border: "1px solid var(--border-1)",
              borderRadius: "var(--r-md)",
              padding: 2,
              gap: 2,
              height: 32,
            }}
          >
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className="inline-flex items-center justify-center cursor-pointer"
              style={{
                width: 28,
                height: 24,
                border: "none",
                borderRadius: "var(--r-sm)",
                background:
                  viewMode === "list" ? "var(--bg-2)" : "transparent",
                color:
                  viewMode === "list" ? "var(--fg-1)" : "var(--fg-3)",
              }}
            >
              <Icon name="view-list" size={14} />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className="inline-flex items-center justify-center cursor-pointer"
              style={{
                width: 28,
                height: 24,
                border: "none",
                borderRadius: "var(--r-sm)",
                background:
                  viewMode === "grid" ? "var(--bg-2)" : "transparent",
                color:
                  viewMode === "grid" ? "var(--fg-1)" : "var(--fg-3)",
              }}
            >
              <Icon name="view-grid" size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              setSortOrder((cur) =>
                cur === "newest" ? "oldest" : "newest",
              )
            }
            aria-label="Toggle sort order"
            className="inline-flex items-center cursor-pointer"
            style={{
              gap: 8,
              padding: "0 12px",
              height: 32,
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-1)",
              background: "transparent",
              color: "var(--fg-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="clock" size={12} />
            {sortOrder === "newest" ? "NEWEST FIRST" : "OLDEST FIRST"}
            <Icon name="chevron-down" size={12} />
          </button>
        </div>
      </div>

      {/* Mood pills — horizontal-scroll row under the toolbar.
          Single-select; tapping the active pill clears it. */}
      {moodOptions.length > 0 && (
        <div
          className="flex items-center overflow-x-auto px-[18px] pb-[10px] lg:px-[30px]"
          style={{ gap: 8, scrollbarWidth: "none" }}
        >
          {moodOptions.map((m) => {
            const active = moodFilter === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() =>
                  setMoodFilter((cur) => (cur === m ? null : m))
                }
                className="inline-flex items-center shrink-0 cursor-pointer transition-colors duration-fast"
                style={{
                  padding: "6px 14px",
                  height: 30,
                  borderRadius: 999,
                  border: active
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border-1)",
                  background: active
                    ? "var(--accent-surface)"
                    : "transparent",
                  color: active
                    ? "var(--accent-text)"
                    : "var(--fg-2)",
                  fontFamily: "var(--font-body)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Beat list / grid ───────────────────────────────── */}
      <div className="px-[12px] lg:px-[22px]" style={{ paddingBottom: 32 }}>
        {visible.length === 0 ? (
          <div
            className="text-center t-body"
            style={{
              padding: "32px 16px",
              color: "var(--fg-3)",
            }}
          >
            No beats match this filter.
          </div>
        ) : viewMode === "grid" ? (
          <div
            className="grid"
            style={{
              gap: 16,
              gridTemplateColumns:
                "repeat(auto-fill, minmax(160px, 1fr))",
            }}
          >
            {visible.map((b) => (
              <BeatCard
                key={b.id}
                beat={b}
                producerHandle={producer.handle}
                playing={playingId === b.id}
                onTogglePlay={() => togglePlay(b)}
                onToggleLike={() => toggleLike(b.id)}
              />
            ))}
          </div>
        ) : (
          visible.map((b) => (
            <BeatRow
              key={b.id}
              beat={b}
              producerHandle={producer.handle}
              noteVisibility={
                notes[b.id]?.text?.trim()
                  ? notes[b.id].visibility
                  : b.latestCommentBody?.trim()
                    ? "shared"
                    : b.noteBody?.trim()
                      ? "private"
                      : null
              }
              playing={playingId === b.id}
              onTogglePlay={() => togglePlay(b)}
              onToggleLike={() => toggleLike(b.id)}
              onToggleListened={() => toggleHidden(b.id)}
              downloadHref={
                server.downloadsAllowed
                  ? `/api/beats/${b.id}/download`
                  : undefined
              }
              onOpenNote={() => setNoteFor(b)}
            />
          ))
        )}
      </div>

      {noteFor && (
        <BeatNoteModal
          beat={noteFor}
          initialNote={notes[noteFor.id]?.text ?? ""}
          initialVisibility={
            notes[noteFor.id]?.visibility ?? "private"
          }
          producerHandle={producer.handle}
          onClose={() => setNoteFor(null)}
          onSave={(text, visibility) => {
            // Optimistic local update so the row icon flips
            // colour immediately even if the network is slow.
            setNotes((cur) => ({
              ...cur,
              [noteFor.id]: { text, visibility },
            }));
            void saveBeatNoteAction(
              server.slug,
              noteFor.id,
              text,
              visibility,
            ).then((r) => {
              if (!r.ok) console.warn("[saveBeatNoteAction]", r.error);
            });
          }}
        />
      )}
    </main>
  );
}

function FilterChip({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string;
  icon?: IconName;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center shrink-0 cursor-pointer transition-colors duration-fast"
      style={{
        gap: 8,
        padding: "0 14px",
        height: 32,
        borderRadius: "var(--r-pill)",
        border: active ? "none" : "1px solid var(--border-1)",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--fg-2)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {icon && <Icon name={icon} size={12} />}
      {label}
      <span style={{ opacity: 0.7 }}>{count}</span>
    </button>
  );
}

function BeatRow({
  beat,
  producerHandle,
  noteVisibility,
  playing,
  onTogglePlay,
  onToggleLike,
  onToggleListened,
  onOpenNote,
  downloadHref,
}: {
  beat: MockBeat & { hidden?: boolean };
  /** Producer's @handle — surfaced on the row's first line on
   *  mobile so the artist always knows whose pack they're in,
   *  even when scrolled deep into the beat list. */
  producerHandle: string;
  /** When set, an inline download icon is rendered on sm+
   *  before the 'more' dot menu. The producer toggled
   *  downloads_allowed = true on the parent server, so
   *  /api/beats/<id>/download will sign the audio URL. */
  downloadHref?: string;
  /** Visibility of the saved note, or null when no note exists.
   *  Drives the message icon's colour:
   *    null    → fg-4    (no note)
   *    private → fg-2    (artist has a note, but it's just for them)
   *    shared  → accent  (note was sent to the producer) */
  noteVisibility: BeatNoteVisibility | null;
  playing: boolean;
  onTogglePlay: () => void;
  onToggleLike: () => void;
  onToggleListened: () => void;
  onOpenNote: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const detailsRef = React.useRef<HTMLDivElement>(null);

  // Close the mobile-only details popover on outside click / Escape.
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
  const producerAt = producerHandle.startsWith("@")
    ? producerHandle
    : `@${producerHandle}`;

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

      {/* Title + meta — mobile gets a tighter 2-line shape:
            line 1 : title (truncated)
            line 2 : @PRODUCER  + […] details popover (BPM · KEY ·
                                                       LENGTH · COMP/LOOP)
          Desktop (sm+) keeps the original COMP tag + inline meta
          row with "BPM · KEY · LENGTH" + mood tags. */}
      <div className="min-w-0 flex-1">
        {/* Line 1 — title (+ desktop co-producers chip) */}
        <div
          className="flex items-baseline min-w-0"
          style={{ gap: 8 }}
        >
          <span
            className="truncate flex-1"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14.5,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {beat.title}
          </span>
          {beat.coProducers && beat.coProducers.length > 0 && (
            <span
              className="t-mono-s truncate hidden sm:inline"
              style={{ color: "var(--fg-3)" }}
            >
              {beat.coProducers
                .map((p) => p.toUpperCase())
                .join(" · ")}
            </span>
          )}
        </div>

        {/* Line 2 — mobile-only producer handle, tight against
            the title (Spotify-style stacked metadata). */}
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

        {/* Line 2 — desktop: COMP/LOOP tag + meta + mood tags. */}
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
          {beat.mood.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
      </div>

      {/* Added — same column as the producer library's ADDED.
          Hidden under sm so the row stays usable on phones. Duration
          lives inline in the meta row above (no separate column). */}
      <span
        className="t-mono-s shrink-0 hidden sm:inline"
        style={{
          color: "var(--fg-3)",
          width: 90,
          textAlign: "right",
        }}
      >
        {beat.addedAt}
      </span>

      {/* Action cluster (message + eye + heart + … on mobile,
          message + eye + heart on desktop). Tight gap so the
          buttons read as one row of right-aligned controls. */}
      <div className="flex items-center" style={{ gap: 2 }}>
      {/* Note button — three-state CHIP (no note / private /
          shared) so the artist can tell at a glance whether a beat
          carries something they wrote, and whether that something
          went to the producer. The background fill makes the state
          unambiguous — a pure text-colour switch reads as "did
          something change?" on most monitors. */}
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
          borderRadius: "var(--r-sm)",
          border: "none",
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

      {/* Hide / unhide toggle. Local-only flag, independent of
          listened — playing a beat doesn't auto-hide it. */}
      <button
        type="button"
        aria-label={beat.hidden ? "Unhide" : "Hide"}
        onClick={onToggleListened}
        className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
          border: "none",
          background: "transparent",
          color: beat.hidden ? "var(--fg-2)" : "var(--fg-4)",
        }}
      >
        <Icon name={beat.hidden ? "eye-off" : "eye"} size={16} />
      </button>

      {/* Like */}
      <button
        type="button"
        aria-label={beat.liked ? "Unlike" : "Like"}
        onClick={onToggleLike}
        className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
          border: "none",
          background: "transparent",
          color: beat.liked ? "var(--accent)" : "var(--fg-4)",
        }}
      >
        <Icon
          name="heart"
          size={16}
          style={{
            fill: beat.liked ? "var(--accent)" : "none",
          }}
        />
      </button>

      {/* Mobile-only "…" details popover, parked at the very end
          of the action cluster so the row reads: cover · title /
          producer · ●●● actions · ⋯. Hidden above sm because the
          desktop layout already spells the meta inline. */}
      <div
        ref={detailsRef}
        className="relative shrink-0 sm:hidden"
      >
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
        {detailsOpen && (
          <DetailsPopover beat={beat} />
        )}
      </div>
      {downloadHref && (
        <a
          href={downloadHref}
          download
          onClick={(e) => e.stopPropagation()}
          aria-label={`Download ${beat.title}`}
          className="hidden sm:inline-flex items-center justify-center transition-colors duration-fast"
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--r-sm)",
            color: "var(--fg-4)",
          }}
        >
          <Icon name="download" size={16} />
        </a>
      )}
      </div>{/* /action cluster */}
    </div>
  );
}

/* ============================================================
   BeatCard — grid-view tile. Big cover with play overlay, title +
   producer underneath, like heart in the bottom-right corner.
   Pattern mirrors the producer Library's card view; the artist
   surface lands on the same shape so the two feel like one DS.
   ============================================================ */

function BeatCard({
  beat,
  producerHandle,
  playing,
  onTogglePlay,
  onToggleLike,
}: {
  beat: MockBeat;
  producerHandle: string;
  playing: boolean;
  onTogglePlay: () => void;
  onToggleLike: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const producerAt = producerHandle.startsWith("@")
    ? producerHandle
    : `@${producerHandle}`;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="relative overflow-hidden cursor-pointer"
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "var(--r-md)",
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
              size={28}
              style={{ marginLeft: playing ? 0 : 2 }}
            />
          )}
        </div>
        <button
          type="button"
          aria-label={beat.liked ? "Unlike" : "Like"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          className="absolute inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
          style={{
            bottom: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: "none",
            background: "oklch(0 0 0 / 0.45)",
            color: beat.liked ? "var(--accent)" : "#fff",
          }}
        >
          <Icon
            name="heart"
            size={16}
            style={{
              fill: beat.liked ? "var(--accent)" : "none",
            }}
          />
        </button>
      </button>
      <div className="min-w-0">
        <div
          className="truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--fg-1)",
          }}
        >
          {beat.title}
        </div>
        <div
          className="t-mono-s truncate"
          style={{ color: "var(--fg-3)", marginTop: 2 }}
        >
          {producerAt.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DetailsPopover — premium beat-detail card the mobile [...]
   button reveals. Two-column key/value rows for the technical
   meta (Tempo, Key, Length, Type) and a wrap-friendly mood chip
   row underneath. Wider + airier than the original one-line
   string so the artist can actually read it.
   ============================================================ */

function DetailsPopover({ beat }: { beat: MockBeat }) {
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
            <span
              className="t-mono-s"
              style={{ color: "var(--fg-4)" }}
            >
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
          <div
            className="flex flex-wrap"
            style={{ gap: 6 }}
          >
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
