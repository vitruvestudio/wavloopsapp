/**
 * Waveform — Wavloops V3 signature element.
 *
 * Mirrors the prototype's Waveform (components.jsx) exactly:
 *   - Bars use `flex: 1` so they share container width equally (responsive)
 *   - Heights are `%` of the container (min 8%, max 100%)
 *   - Deterministic per `seed` (same beat = same shape forever)
 *   - Played bars = `accent` colour + optional glow shadow
 *   - Hovered (between progress and cursor) = `fg-3` preview tint
 *   - Click-to-seek when `interactive`
 *
 * Generation: gentle `sin((i/n)*π)` envelope × (rnd*0.7 + rnd*0.3),
 *             min height 0.16. Deterministic LCG keyed on seed.
 */

"use client";

import * as React from "react";

interface WaveformProps {
  seed: string;
  bars?: number;
  /** Played fraction 0..1 */
  progress?: number;
  /** Pixel height of the waveform container. */
  height?: number;
  barGap?: number;
  /** Click-to-seek handler. Set to omit for read-only displays. */
  onSeek?: (progress: number) => void;
  /** Unplayed bar colour token. Default `--fg-4`. */
  color?: string;
  /** Played bar colour token. Default `--accent`. */
  accent?: string;
  glow?: boolean;
  className?: string;
}

/** Stable hash → uint, matches the proto's `hashSeed`. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic LCG bar generator — matches the proto's `genBars`. */
function genBars(seed: string, n: number): number[] {
  let s = hashSeed(seed) || 1;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / n) * Math.PI) * 0.5 + 0.5; // gentle envelope
    const v = 0.16 + (rnd() * 0.7 + rnd() * 0.3) * env;
    out.push(Math.min(1, v));
  }
  return out;
}

export function Waveform({
  seed,
  bars = 80,
  progress = 0,
  height = 40,
  barGap = 2,
  onSeek,
  color = "var(--fg-4)",
  accent = "var(--accent)",
  glow = false,
  className,
}: WaveformProps) {
  const heights = React.useMemo(() => genBars(seed, bars), [seed, bars]);
  const ref = React.useRef<HTMLDivElement>(null);
  const [hoverX, setHoverX] = React.useState<number | null>(null);

  const interactive = Boolean(onSeek);

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    onSeek?.(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  const handleMove = (e: React.MouseEvent) => {
    if (!interactive || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setHoverX((e.clientX - r.left) / r.width);
  };

  return (
    <div
      ref={ref}
      onClick={interactive ? handleClick : undefined}
      onMouseMove={interactive ? handleMove : undefined}
      onMouseLeave={() => setHoverX(null)}
      className={[
        "flex w-full items-center",
        interactive ? "cursor-pointer" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ height, gap: barGap }}
      aria-hidden
    >
      {heights.map((hgt, i) => {
        const frac = (i + 0.5) / bars;
        const played = frac <= progress;
        const hovered = hoverX != null && frac <= hoverX && frac > progress;
        const bg = played ? accent : hovered ? "var(--fg-3)" : color;
        return (
          <span
            key={i}
            className="block transition-[background-color] duration-fast"
            style={{
              flex: 1,
              height: `${Math.max(8, hgt * 100)}%`,
              borderRadius: 2,
              background: bg,
              boxShadow:
                played && glow ? "0 0 6px -1px var(--accent-glow)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}
