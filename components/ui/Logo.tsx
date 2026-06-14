/**
 * Logo — Wavloops logomark + wordmark.
 *
 * The logomark is a 5-bar waveform inside a square accent tile.
 * Default renders mark + wordmark side by side; pass `markOnly`
 * to drop the wordmark (sidebar collapsed state).
 *
 * Sizing controls the height of the tile; the wordmark scales
 * proportionally via the `display` font.
 */

import Image from "next/image";

interface LogoProps {
  size?: number;
  markOnly?: boolean;
  className?: string;
}

export function Logo({ size = 28, markOnly = false, className }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-sp-2 ${className ?? ""}`.trim()}
    >
      <Image
        src="/Photos/wavloops-icon.png"
        alt="Wavloops"
        width={size}
        height={size}
        priority
        className="block"
      />
      {!markOnly && (
        <span
          className="font-display font-bold text-fg-1"
          style={{
            fontSize: size * 0.62,
            letterSpacing: "-0.018em",
            lineHeight: 1,
          }}
        >
          WAVLOOPS
        </span>
      )}
    </span>
  );
}
