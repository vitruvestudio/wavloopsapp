/**
 * Avatar — circular identity badge.
 *
 * Mirrors the prototype's Avatar (components.jsx):
 *   - Deterministic gradient from a stable seed (140° tilt)
 *     `linear-gradient(140deg, oklch(0.45 0.12 hue), oklch(0.28 0.07 hue+50))`
 *   - Initials in **JetBrains Mono**, weight 600, size = avatar * 0.34,
 *     letter-spacing 0.02em, white text
 *   - `label` (e.g. "TM") overrides the auto-computed initials; if no
 *     label and no name → falls back to "WL"
 *   - 1px border-2 hairline (so it sits cleanly on any surface)
 *   - Optional `src` swaps the gradient for an actual image
 *   - Optional `ring` adds an accent ring (artist gate use)
 */

import Image from "next/image";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  /** Override the auto-computed initials (e.g. "TM" for "Tyler Mills"). */
  label?: string;
  /** Adds an accent ring around the avatar (artist gate use). */
  ring?: boolean;
  className?: string;
}

/** Stable hash → uint, matches the proto's `hashSeed` */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "WL";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2);
}

export function Avatar({
  name,
  src,
  size = 34,
  label,
  ring,
  className,
}: AvatarProps) {
  const hue = hashSeed(name) % 360;
  const initials = (label ?? initialsFor(name)).slice(0, 2).toUpperCase();

  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill",
        ring ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-0" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: size,
        height: size,
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        fontSize: size * 0.34,
        letterSpacing: "0.02em",
        color: "#fff",
        background: src
          ? "transparent"
          : `linear-gradient(140deg, oklch(0.45 0.12 ${hue}), oklch(0.28 0.07 ${(hue + 50) % 360}))`,
        border: "1px solid var(--border-2)",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="block h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
