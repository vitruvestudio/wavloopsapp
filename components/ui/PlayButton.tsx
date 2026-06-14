/**
 * PlayButton — signature primitive. Circular accent fill with optional glow.
 *
 * Mirrors the prototype's PlayButton (components.jsx):
 *   - Circle, size 44 default (override per use: player dock 40, full-screen 80)
 *   - Background: accent → accent-hover on mouse hover
 *   - Hover: scale(1.06) — playful, signals interactivity
 *   - Optional glow (default ON): `0 6px 22px -6px var(--accent-glow)` —
 *     the only place outer glow is allowed in the app (per DS spec).
 *   - Play icon is nudged 0.04 * size to the right for optical centering
 *     of the asymmetric triangle. Pause stays centred.
 *
 * Used by PlayerDock (center transport) and full-screen now-playing.
 */

"use client";

import * as React from "react";
import { Icon } from "./Icon";

interface PlayButtonProps {
  size?: number;
  playing?: boolean;
  glow?: boolean;
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function PlayButton({
  size = 44,
  playing = false,
  glow = true,
  onClick,
  className,
  label,
}: PlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? (playing ? "Pause" : "Play")}
      className={[
        "inline-flex items-center justify-center rounded-pill border-none bg-accent text-accent-fg",
        "transition-[transform,background-color] duration-fast",
        "hover:scale-[1.06] hover:bg-accent-hover",
        "active:scale-100",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: size,
        height: size,
        boxShadow: glow ? "0 6px 22px -6px var(--accent-glow)" : undefined,
      }}
    >
      <Icon
        name={playing ? "pause" : "play"}
        size={Math.round(size * 0.44)}
        // Nudge play icon for optical centering (triangle is asymmetric)
        style={playing ? undefined : { marginLeft: size * 0.04 }}
      />
    </button>
  );
}
