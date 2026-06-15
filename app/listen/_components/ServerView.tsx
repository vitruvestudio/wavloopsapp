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
import { hashSeed } from "@/lib/seed";
import { PLATFORM_ICON } from "@/lib/socials";
import type { MockBeat, MockProducer, MockServer } from "../_mock";

/** Generate a soft pastel 2-stop gradient from a seed string. The
 *  hues drift apart by 50-130° so the sweep has visible variation
 *  without going jarring. High lightness + medium chroma keeps the
 *  result Spotify-airy: dark text reads cleanly on top, the banner
 *  feels lifted from the artwork rather than slapped on.
 *  Phase 3 will swap this for real palette extraction off the
 *  cover image bytes — for Phase 1 the deterministic hash already
 *  gives every server a stable, distinct mood. */
function bannerGradient(seed: string): string {
  const h1 = hashSeed(seed) % 360;
  const h2 = (h1 + 60 + (hashSeed(seed + "~b") % 70)) % 360;
  return [
    "linear-gradient(115deg,",
    ` oklch(0.86 0.09 ${h1}) 0%,`,
    ` oklch(0.82 0.11 ${(h1 + h2) / 2}) 55%,`,
    ` oklch(0.83 0.12 ${h2}) 100%)`,
  ].join("");
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
      {/* ── Banner — soft pastel gradient derived from the server
              slug. Dark text on a light, airy surface (Spotify /
              Apple Music style) so the banner feels lifted from
              the artwork rather than slapped on. ───────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          padding: "30px 36px 36px",
          background: bannerGradient(server.slug),
          color: "var(--fg-1)",
        }}
      >
        <div
          className="relative flex items-center"
          style={{ gap: 28, zIndex: 1 }}
        >
          {/* 4-cover mosaic */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width: 180,
              height: 180,
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
                  <CoverArt fill seed={seed} />
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
                fontSize: "clamp(34px, 5vw, 54px)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                color: "oklch(0.18 0.02 270)",
                margin: 0,
                marginBottom: 16,
              }}
            >
              {server.name}
            </h1>

            {/* Producer mini-card */}
            <div
              className="flex items-center flex-wrap"
              style={{ gap: 14 }}
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
                  color: "oklch(0.25 0.02 270)",
                }}
              >
                {producer.name} ·{" "}
                <span style={{ color: "oklch(0.4 0.02 270)" }}>
                  @{producer.handle}
                </span>
              </span>
              <span
                className="t-mono-s"
                style={{ color: "oklch(0.45 0.02 270)" }}
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
                        background: "oklch(1 0 0 / 0.55)",
                        border: "1px solid oklch(1 0 0 / 0.7)",
                        color: "oklch(0.25 0.02 270)",
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

          {/* Big play all */}
          <button
            type="button"
            aria-label={`Play all ${server.name}`}
            onClick={() => {
              const first = visible[0];
              if (first) togglePlay(first.id);
            }}
            className="shrink-0 inline-flex items-center justify-center cursor-pointer transition-transform duration-fast hover:scale-105"
            style={{
              width: 64,
              height: 64,
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

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "20px 30px 12px" }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
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
          }}
        >
          <Icon name="clock" size={12} />
          NEWEST FIRST
          <Icon name="chevron-down" size={12} />
        </button>
      </div>

      {/* ── Beat list ──────────────────────────────────────── */}
      <div style={{ padding: "0 22px 32px" }}>
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
              playing={playingId === b.id}
              onTogglePlay={() => togglePlay(b.id)}
              onToggleLike={() => toggleLike(b.id)}
              onToggleListened={() => toggleListened(b.id)}
            />
          ))
        )}
      </div>
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
  playing,
  onTogglePlay,
  onToggleLike,
  onToggleListened,
}: {
  beat: MockBeat;
  playing: boolean;
  onTogglePlay: () => void;
  onToggleLike: () => void;
  onToggleListened: () => void;
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
        <CoverArt fill seed={beat.artSeed} />
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

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--fg-1)",
          }}
        >
          {beat.title}
        </div>
        <div
          className="flex items-center flex-wrap"
          style={{ gap: 8, marginTop: 4 }}
        >
          <span
            className="t-mono-s"
            style={{ color: "var(--fg-3)" }}
          >
            {beat.bpm} BPM
          </span>
          <span
            className="t-mono-s"
            style={{ color: "var(--fg-3)" }}
          >
            · {beat.key}
          </span>
          {beat.mood.map((m) => (
            <span
              key={m}
              className="inline-flex items-center"
              style={{
                height: 20,
                padding: "0 8px",
                borderRadius: "var(--r-sm)",
                background: "var(--bg-2)",
                color: "var(--fg-2)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Duration */}
      <span
        className="t-mono-s shrink-0"
        style={{
          color: "var(--fg-3)",
          minWidth: 36,
          textAlign: "right",
        }}
      >
        {beat.duration}
      </span>

      {/* Comment */}
      <button
        type="button"
        aria-label="Comments"
        className="relative inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
          border: "none",
          background: "transparent",
          color: "var(--fg-4)",
        }}
      >
        <Icon name="message" size={16} />
        {beat.commentCount > 0 && (
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
