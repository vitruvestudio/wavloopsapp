/**
 * Waveform — Wavloops signature element.
 *
 * Deterministic bar heights generated from a string seed (so the same
 * beat always renders the same visual). Played portion is rendered in
 * accent with a glow filter; the rest sits at fg-4 opacity.
 *
 * V1: visual only (no seek). The player dock will pass `progress` (0..1)
 * to animate the played mask. Click-to-seek and hover preview are
 * V1.1 polish.
 */

import * as React from "react";

interface WaveformProps {
  /** Stable seed string (e.g. beat id) — drives deterministic bar pattern. */
  seed: string;
  /** Number of bars. Wider docks pass more bars. */
  bars?: number;
  /** Played fraction 0..1. */
  progress?: number;
  /** Height of the tallest bar in px. Bars taper from there. */
  height?: number;
  /** Adds an accent glow on the played bars (recommended on the dock). */
  glow?: boolean;
  className?: string;
}

/** Fast hash of seed → uint. Same seed = same hash. */
function seedHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic 0..1 from (seed, index). Cheap LCG mixed with hash. */
function bar(seed: number, i: number): number {
  const x = Math.sin((seed + i * 9301) * 0.000731) * 43758.5453;
  return Math.abs(x - Math.floor(x));
}

export function Waveform({
  seed,
  bars = 80,
  progress = 0,
  height = 28,
  glow = false,
  className,
}: WaveformProps) {
  const seedNum = React.useMemo(() => seedHash(seed), [seed]);
  const heights = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
      // sine envelope: peak in the middle, taper at the edges
      const env = 0.45 + 0.55 * Math.sin((i / bars) * Math.PI);
      const noise = 0.35 + 0.65 * bar(seedNum, i);
      out.push(Math.max(0.18, env * noise));
    }
    return out;
  }, [seedNum, bars]);

  return (
    <div
      className={["flex items-center gap-[2px]", className ?? ""].join(" ")}
      style={{ height }}
      aria-hidden
    >
      {heights.map((h, i) => {
        const played = i / bars < progress;
        return (
          <span
            key={i}
            className="block w-[2px] shrink-0 rounded-[1.5px] transition-colors duration-fast"
            style={{
              height: `${Math.round(h * height)}px`,
              background: played ? "var(--accent)" : "var(--fg-4)",
              boxShadow:
                played && glow ? "0 0 6px var(--accent-glow)" : "none",
              opacity: played ? 1 : 0.6,
            }}
          />
        );
      })}
    </div>
  );
}
