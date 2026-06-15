/**
 * CoverArt — generative placeholder cover, pixel-ported from prototype
 * `components.jsx` lines 246-271.
 *
 * Deterministic accent-tinted gradient + diagonal hatch + radial
 * highlight. No fake stock photos. Same `seed` → same cover forever.
 *
 *   ┌──────────────────────┐
 *   │   linear-gradient    │   135 + tilt deg
 *   │     hue → hue+40     │   OKLCH dark 0.32 → 0.16
 *   │     ───── overlay ─  │   repeating-linear-gradient hatch (45°+tilt)
 *   │    radial highlight  │   top-left, hue, opacity 0.35
 *   │                      │
 *   │  optional code text  │   bottom-left, mono fontSize 9
 *   └──────────────────────┘
 *
 * Three usage modes:
 *   - default       — 1:1 aspect ratio, `size` controls width
 *   - `fill`        — stretches to fill parent (used inside ServerCard
 *                     mosaic and the artist-side fullscreen background)
 *   - `src`         — bypass the generative gradient, render an uploaded
 *                     image instead (used when artwork_mode === 'image')
 *
 * Pass `hue` to override the seed-hashed hue. Useful when the DB stores
 * the server's `accent_hue` directly (e.g. a producer dialed in their
 * preferred colour).
 */

import * as React from "react";
import { hueFromSeed } from "@/lib/seed";
import { hashSeed } from "@/lib/seed";

interface CoverArtProps {
  /** Stable identifier — beat.id, server.slug, profile.handle, etc. */
  seed: string;
  /** Override the hue (0-359) instead of deriving from the seed. */
  hue?: number;
  /** Width when not `fill`. Default `100%`. Pass `120` for fixed px. */
  size?: string | number;
  /** Border-radius CSS value. Default `var(--r-md)`. */
  radius?: string | number;
  /** Stretch to fill parent (no aspect ratio, no fixed width). */
  fill?: boolean;
  /** Use this image instead of the generative gradient. */
  src?: string;
  /** Small mono caption rendered bottom-left (e.g. BPM, KEY). */
  code?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CoverArt({
  seed,
  hue: hueProp,
  size = "100%",
  radius = "var(--r-md)",
  fill,
  src,
  code,
  className,
  style,
}: CoverArtProps) {
  const hue = hueProp ?? hueFromSeed(seed);
  const h2 = (hue + 40) % 360;
  // Slight rotation per seed so two adjacent covers don't read identically.
  const tilt = (hashSeed(seed + "x") % 50) - 25;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        // The dark generative gradient + 1px border are the visible
        // surface for the no-image case. When `src` is set the image
        // covers the whole container, so the border + gradient would
        // only show through the rounded corners as dark fringes —
        // strip them in that case.
        ...(src
          ? { background: "transparent", border: "none" }
          : {
              border: "1px solid var(--border-1)",
              background: `linear-gradient(${135 + tilt}deg, oklch(0.32 0.07 ${hue}) 0%, oklch(0.16 0.04 ${h2}) 100%)`,
            }),
        ...(fill
          ? {
              width: "100%",
              height: "100%",
              borderRadius: 0,
            }
          : {
              width: size,
              aspectRatio: "1 / 1",
              borderRadius: radius,
            }),
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <>
          {/* Diagonal hatch overlay */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.5,
              backgroundImage: `repeating-linear-gradient(${tilt + 45}deg, transparent 0 6px, oklch(1 0 0 / 0.05) 6px 7px)`,
            }}
          />
          {/* Radial highlight, top-left */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(120% 90% at 22% 18%, oklch(0.6 0.18 ${hue} / 0.35), transparent 60%)`,
            }}
          />
        </>
      )}
      {code && (
        <span
          className="t-mono-s"
          style={{
            position: "absolute",
            left: 8,
            bottom: 7,
            color: "oklch(1 0 0 / 0.6)",
            fontSize: 9,
            textShadow: "0 1px 3px oklch(0 0 0 / 0.6)",
          }}
        >
          {code}
        </span>
      )}
    </div>
  );
}
