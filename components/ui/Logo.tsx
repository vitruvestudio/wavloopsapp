/**
 * Logo + Logomark — Wavloops V3 brand.
 *
 * The Logomark is the canonical brand glyph: a 64×64 accent tile
 * (rx 14, i.e. ~22% radius) holding five white waveform bars
 * centered around the middle, heights peaking at the centre bar.
 *
 * Rendered as inline SVG (per proto) — sharper than a raster, fills
 * `currentColor` for the bars when you need a single-tone variant
 * later. The full Logo composes the mark + Unbounded wordmark.
 *
 * Source of truth: `Wavloops Servers 2026/DS/app/components.jsx`
 * (`Logomark` + `Logo`).
 */

interface LogomarkProps {
  size?: number;
  className?: string;
}

export function Logomark({ size = 30, className }: LogomarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="var(--accent)" />
      <g fill="#fff">
        <rect x="14" y="27" width="4.5" height="10" rx="2.25" />
        <rect x="22" y="20" width="4.5" height="24" rx="2.25" />
        <rect x="30" y="13" width="4.5" height="38" rx="2.25" />
        <rect x="38" y="22" width="4.5" height="20" rx="2.25" />
        <rect x="46" y="28" width="4.5" height="8" rx="2.25" />
      </g>
    </svg>
  );
}

interface LogoProps {
  size?: number;
  /** Hide the wordmark — used when the sidebar is collapsed. */
  markOnly?: boolean;
  className?: string;
}

export function Logo({ size = 30, markOnly = false, className }: LogoProps) {
  return (
    <span
      className={["inline-flex items-center", className ?? ""].join(" ").trim()}
      style={{ gap: 10 }}
    >
      <Logomark size={size} />
      {!markOnly && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: size * 0.62,
            letterSpacing: "-0.01em",
            color: "var(--fg-1)",
            lineHeight: 1,
          }}
        >
          WAVLOOPS
        </span>
      )}
    </span>
  );
}
