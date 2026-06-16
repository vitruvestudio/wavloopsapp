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
import { Avatar } from "@/components/ui/Avatar";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { hashSeed } from "@/lib/seed";
import { PLATFORM_ICON } from "@/lib/socials";
import type { MockBeat, MockProducer, MockServer } from "../_mock";
import {
  bannerGradient,
  BANNER_FADE_MASK,
  BANNER_GLOW_MASK,
} from "./banner";
import { BeatNoteModal } from "./BeatNoteModal";

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
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${photoSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          // Heavy blur + slight desaturation + lift brightness
          // turns the image into a soft tinted cloud rather than
          // a recognisable photo. Scale 1.4 hides blur edges.
          filter: "blur(90px) saturate(0.75) brightness(1.05)",
          transform: "scale(1.4)",
          // Opacity is the key dial — at 0.45 the cover colour
          // tints the page background instead of replacing it, so
          // light theme reads as a pastel wash exactly like the
          // COLOR mesh, and dark theme reads as a muted glow.
          opacity: 0.45,
          // Same upper-centre glow shape as the COLOR mesh — the
          // banner converges on one premium look regardless of
          // which artwork mode produced it.
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
      className="absolute inset-0"
      style={{
        background: bannerGradient(hue),
        WebkitMaskImage: BANNER_FADE_MASK,
        maskImage: BANNER_FADE_MASK,
        zIndex: 0,
      }}
    />
  );
}

type Filter = "all" | "new" | "liked";

interface ServerViewProps {
  producer: MockProducer;
  server: MockServer;
}

export function ServerView({ producer, server }: ServerViewProps) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  // Local override of the mock liked/listened state — toggling on
  // a row updates this map and the row re-renders.
  const [overrides, setOverrides] = React.useState<
    Record<string, { liked?: boolean; listened?: boolean }>
  >({});
  /** Per-beat private notes, keyed by beat id. Empty string = no note.
   *  Phase 3 will swap for a beat_notes table scoped to the artist's
   *  contact id. */
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  /** Beat whose note modal is currently open; null = closed. */
  const [noteFor, setNoteFor] = React.useState<MockBeat | null>(null);

  const beats = server.beats.map((b) => ({
    ...b,
    liked: overrides[b.id]?.liked ?? b.liked,
    listened: overrides[b.id]?.listened ?? b.listened,
  }));

  const counts = {
    all: beats.length,
    new: beats.filter((b) => b.isNew).length,
    liked: beats.filter((b) => b.liked).length,
  };

  const visible = beats.filter((b) => {
    if (filter === "new") return Boolean(b.isNew);
    if (filter === "liked") return b.liked;
    return true;
  });

  const toggleLike = (id: string) =>
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], liked: !(prev[id]?.liked ?? beats.find((b) => b.id === id)?.liked ?? false) },
    }));

  const toggleListened = (id: string) =>
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        listened: !(prev[id]?.listened ?? beats.find((b) => b.id === id)?.listened ?? false),
      },
    }));

  const togglePlay = (id: string) => {
    setPlayingId((cur) => (cur === id ? null : id));
    // Auto-mark listened on first play.
    if (playingId !== id) toggleListened(id);
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

              Mobile: stack mosaic, title block, play button
              vertically. Desktop: horizontal row. ──────────────── */}
      <section
        className="relative overflow-hidden px-[18px] pb-[60px] pt-[24px] lg:px-[36px] lg:pb-[80px] lg:pt-[32px]"
      >
        {/* Background — mode-aware (auto / color / image), masked
            to fade out at the bottom. */}
        <BannerBackground server={server} />

        <div
          className="relative flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left"
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

          {/* Big play all — slightly smaller on mobile. */}
          <button
            type="button"
            aria-label={`Play all ${server.name}`}
            onClick={() => {
              const first = visible[0];
              if (first) togglePlay(first.id);
            }}
            className="shrink-0 inline-flex items-center justify-center cursor-pointer transition-transform duration-fast hover:scale-105 w-[56px] h-[56px] lg:w-[64px] lg:h-[64px]"
            style={{
              borderRadius: "50%",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              boxShadow:
                "0 14px 30px -10px oklch(0 0 0 / 0.4), 0 6px 12px oklch(0 0 0 / 0.2)",
            }}
          >
            <Icon
              name="play"
              size={28}
              style={{ marginLeft: 3 }}
            />
          </button>
        </div>
      </section>

      {/* ── Toolbar — filter chips + sort. Mobile: filters scroll
              horizontally if they overflow, sort moves below. */}
      <div
        className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-0 px-[18px] pt-[18px] pb-[10px] lg:px-[30px] lg:pt-[20px] lg:pb-[12px]"
      >
        <div
          className="flex items-center overflow-x-auto"
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
        </div>
        <button
          type="button"
          className="inline-flex items-center self-start lg:self-auto cursor-pointer"
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
          NEWEST FIRST
          <Icon name="chevron-down" size={12} />
        </button>
      </div>

      {/* ── Beat list ──────────────────────────────────────── */}
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
        ) : (
          visible.map((b) => (
            <BeatRow
              key={b.id}
              beat={b}
              hasNote={Boolean((notes[b.id] ?? "").trim())}
              playing={playingId === b.id}
              onTogglePlay={() => togglePlay(b.id)}
              onToggleLike={() => toggleLike(b.id)}
              onToggleListened={() => toggleListened(b.id)}
              onOpenNote={() => setNoteFor(b)}
            />
          ))
        )}
      </div>

      {noteFor && (
        <BeatNoteModal
          beat={noteFor}
          initialNote={notes[noteFor.id] ?? ""}
          onClose={() => setNoteFor(null)}
          onSave={(next) =>
            setNotes((cur) => ({ ...cur, [noteFor.id]: next }))
          }
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
      className="inline-flex items-center cursor-pointer transition-colors duration-fast"
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
  hasNote,
  playing,
  onTogglePlay,
  onToggleLike,
  onToggleListened,
  onOpenNote,
}: {
  beat: MockBeat;
  /** True when the artist has saved a private note for this beat —
   *  drives the small accent dot on the message icon. */
  hasNote: boolean;
  playing: boolean;
  onTogglePlay: () => void;
  onToggleLike: () => void;
  onToggleListened: () => void;
  onOpenNote: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center transition-colors duration-fast"
      style={{
        gap: 14,
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

      {/* Title + meta — exactly the producer BeatRow's shape:
          title (+ co-producers inline) on top, then a meta row of
          type tag → "BPM · KEY · LENGTH" → mood tags. */}
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
          {beat.coProducers && beat.coProducers.length > 0 && (
            <span
              className="t-mono-s truncate"
              style={{ color: "var(--fg-3)" }}
            >
              {beat.coProducers
                .map((p) => p.toUpperCase())
                .join(" · ")}
            </span>
          )}
        </div>
        <div
          className="flex items-center flex-wrap"
          style={{ gap: 7, marginTop: 5 }}
        >
          {/* Type tag — same DS variants as producer BeatRow:
              COMP = accent + waves, LOOP = solid + repeat. */}
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
          {/* Inline meta line, duration BEFORE mood tags, joined
              by " · " bullets — exactly the producer MetaRow. */}
          <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
            {[`${beat.bpm} BPM`, beat.key, beat.duration].join(" · ")}
          </span>
          {/* Mood tags — DS Tag default variant (no fill, hairline
              border + fg-3 text), same as producer. */}
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

      {/* Private note */}
      <button
        type="button"
        aria-label="Private note"
        onClick={onOpenNote}
        className="relative inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
          border: "none",
          background: "transparent",
          color: hasNote ? "var(--accent-text)" : "var(--fg-4)",
        }}
      >
        <Icon name="message" size={16} />
        {hasNote && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
        )}
      </button>

      {/* Listened toggle (eye) */}
      <button
        type="button"
        aria-label={
          beat.listened ? "Mark as unlistened" : "Mark as listened"
        }
        onClick={onToggleListened}
        className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
          border: "none",
          background: "transparent",
          color: beat.listened ? "var(--fg-2)" : "var(--fg-4)",
        }}
      >
        <Icon
          name={beat.listened ? "eye" : "eye-off"}
          size={16}
        />
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
    </div>
  );
}
