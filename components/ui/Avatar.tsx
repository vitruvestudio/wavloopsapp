/**
 * Avatar — circular identity badge. Renders the producer/artist image
 * when `src` is provided, otherwise falls back to colored initials.
 *
 * Initials are deterministic from the name (first letter of first +
 * last word, capitalized). Background hue is keyed off the name so the
 * same person always lands on the same colour without a stored colour
 * field.
 */

import Image from "next/image";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  /** Adds an accent ring (e.g. the producer's avatar on artist gate). */
  ring?: boolean;
  className?: string;
}

/** Stable per-name hue (0..359). */
function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, src, size = 36, ring, className }: AvatarProps) {
  const hue = hueFor(name);
  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill",
        "font-display font-semibold uppercase",
        ring ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-0" : "",
        className ?? "",
      ].join(" ")}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        color: "#fff",
        background: src
          ? "transparent"
          : `linear-gradient(135deg, oklch(0.55 0.18 ${hue}), oklch(0.3 0.09 ${(hue + 40) % 360}))`,
      }}
    >
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="block h-full w-full object-cover" />
      ) : (
        initialsFor(name)
      )}
    </span>
  );
}
