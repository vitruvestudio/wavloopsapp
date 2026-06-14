/**
 * ServerCard — dashboard tile for a single server.
 *
 * Pixel-ported from prototype `components_app.jsx` lines 37-80.
 *
 *   ┌──────────────────────────────────────────┐
 *   │  ┌─ cover mosaic (132h) ──────────────┐  │   ← 1 to 4 CoverArts, flex row
 *   │  │                                    │  │     darken-down gradient overlay
 *   │  │   ATLANTA NIGHTS   🔒 PRIVATE      │  │     name + style + VisBadge
 *   │  │   TRAP · DARK                      │  │     bottom-left, white
 *   │  └────────────────────────────────────┘  │
 *   │  ♫ 4   👥 3   ▶ 842            →         │   ← stats footer + chevron
 *   └──────────────────────────────────────────┘
 *
 * Hover: card lifts (translateY -3px) + shadow-md, chevron switches
 * to accent-text. Whole card is a Next <Link> to /servers/<slug>.
 *
 * Mosaic strategy (no real beat covers exist yet):
 *   - 0 beats   → 1 CoverArt with the server's accent_hue (or slug-hashed)
 *   - 1-3 beats → that many CoverArts, each seeded with the beat's
 *                 wave_seed (parent passes them in via `beatSeeds`)
 *   - 4+ beats  → first 4 CoverArts (proto's mosaic cap)
 *
 * Stats are denormalized at read time from the parent's query — this
 * component doesn't fetch anything.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { VisBadge } from "@/components/ui/VisBadge";
import type { ServerRow } from "@/lib/supabase/database.types";

interface ServerCardProps {
  server: ServerRow;
  /** Wave seeds of beats in this server, ordered. Used for the mosaic. */
  beatSeeds?: string[];
  stats: {
    beats: number;
    contacts: number;
    plays: number;
  };
}

export function ServerCard({ server, beatSeeds, stats }: ServerCardProps) {
  const [hovered, setHovered] = React.useState(false);

  // Pick seeds for the cover mosaic. Always at least 1 slice.
  const seeds = React.useMemo(() => {
    const beats = (beatSeeds ?? []).slice(0, 4);
    if (beats.length === 0) return [server.slug];
    return beats;
  }, [beatSeeds, server.slug]);

  // Overlay hue — use server.accent_hue if set, else hash slug.
  const overlayHue = server.accent_hue ?? null;

  return (
    <Link
      href={`/servers/${server.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block overflow-hidden border border-border-1 bg-bg-1 transition-all"
      style={{
        borderRadius: "var(--r-lg)",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "var(--shadow-md)" : "none",
        transitionDuration: "var(--dur)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {/* Cover mosaic */}
      <div
        className="relative flex overflow-hidden bg-bg-inset"
        style={{ height: 132, gap: 2 }}
      >
        {seeds.map((s, i) => (
          <div key={i} className="relative flex-1">
            <CoverArt
              fill
              seed={s}
              hue={
                // First slice picks up the server's accent if set so the
                // whole card reads "this server colour"; subsequent
                // slices keep their per-beat hue for visual variety.
                i === 0 && overlayHue != null ? overlayHue : undefined
              }
            />
          </div>
        ))}

        {/* Darken-down overlay tinted with the server's accent hue */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: overlayHue
              ? `linear-gradient(180deg, transparent 30%, oklch(0.14 0.02 ${overlayHue} / 0.65))`
              : "linear-gradient(180deg, transparent 30%, oklch(0.14 0.02 270 / 0.65))",
          }}
        />

        {/* Bottom strip — name + style + visibility */}
        <div
          className="absolute flex items-end justify-between"
          style={{ left: 14, right: 14, bottom: 12 }}
        >
          <div className="min-w-0">
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 19,
                letterSpacing: "-0.01em",
                color: "#fff",
              }}
            >
              {server.name}
            </div>
            {server.style_text && (
              <div
                className="t-mono-s truncate"
                style={{
                  color: "oklch(1 0 0 / 0.7)",
                  marginTop: 4,
                }}
              >
                {server.style_text.toUpperCase()}
              </div>
            )}
          </div>
          <VisBadge visibility={server.visibility} size="sm" />
        </div>
      </div>

      {/* Stats footer */}
      <div
        className="flex items-center"
        style={{ gap: 18, padding: "14px 16px" }}
      >
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-2)" }}
        >
          <Icon name="note" size={14} />
          {stats.beats}
        </span>
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-2)" }}
        >
          <Icon name="users" size={14} />
          {stats.contacts}
        </span>
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-2)" }}
        >
          <Icon name="play" size={13} />
          {stats.plays}
        </span>
        <span className="flex-1" />
        <Icon
          name="chevron-right"
          size={16}
          style={{
            color: hovered ? "var(--accent-text)" : "var(--fg-4)",
            transition: "color var(--dur-fast) var(--ease)",
          }}
        />
      </div>
    </Link>
  );
}
