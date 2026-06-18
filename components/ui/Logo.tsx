/**
 * Logo + Logomark — Wavloops V3 brand.
 *
 * Inline SVG so:
 *   - Theme switching is instant via CSS custom properties — the
 *     wave bars + wordmark both read `var(--fg-1)`, which flips
 *     when `data-theme` toggles.
 *   - No hydration flash, no useTheme hook, works in server
 *     components too.
 *   - Sharp at any size, no asset bytes on the wire.
 *
 * Source: Wavloops brand icon, vector-traced in Illustrator and
 * pasted here as-is. The viewBox is the native artboard
 * (250.752 × 324.054, portrait) — left intact so the geometry
 * matches Theo's source 1:1; the `size` prop drives height and
 * width auto-scales via the aspect ratio.
 */

interface LogomarkProps {
  size?: number;
  className?: string;
}

/** Native source aspect ratio (width / height) from the
 *  Illustrator artboard. Drives the auto-width when consumers
 *  pass a height-based `size`. */
const LOGO_ASPECT = 250.752 / 324.054;

/** Brand glyph only — the 4 italic-slanted bars from Theo's
 *  source artwork. Fills with `var(--fg-1)` so the same SVG
 *  renders black on light surfaces and white on dark. */
export function Logomark({ size = 30, className }: LogomarkProps) {
  return (
    <svg
      width={size * LOGO_ASPECT}
      height={size}
      viewBox="0 0 250.752 324.054"
      className={className}
      style={{ display: "block", flexShrink: 0 }}
      fill="var(--fg-1)"
      aria-hidden="true"
    >
      {/* Bar 3 (centre-right) — the dominant tall bar, traced
              from the source Calque_1. Drawn first so the smaller
              bars layer over the gap edges cleanly. */}
      <path d="M134.605,20.885l.135,296.721c.002,4.505,4.507,7.617,8.721,6.026l33.845-12.781c2.508-.947,4.168-3.348,4.168-6.029V6.451c0-4.617-4.713-7.736-8.963-5.932l-33.98,14.431c-2.381,1.011-3.926,3.348-3.925,5.934Z" />
      {/* Bar 1 (leftmost) — short, lower band. */}
      <path d="M2.25,114.49L0,254.396c-.072,4.506,4.399,7.681,8.629,6.128l35.65-13.091c2.526-.928,4.206-3.333,4.206-6.025V102.404c0-4.457-4.431-7.557-8.618-6.029l-33.401,12.189c-2.497.911-4.174,3.268-4.217,5.926Z" />
      {/* Bar 2 — medium-tall, mid-left. */}
      <path d="M67.489,66.13l-.444,227.656c-.009,4.446,4.398,7.552,8.583,6.05l34.588-12.421c2.548-.915,4.247-3.33,4.247-6.037V53.279c0-4.483-4.481-7.583-8.676-6.003l-34.144,12.864c-2.495.94-4.148,3.325-4.153,5.99Z" />
      {/* Bar 4 (rightmost) — medium-short, trailing. */}
      <path d="M204.516,98.065l-2.249,139.906c-.072,4.506,4.399,7.681,8.629,6.128l35.65-13.091c2.526-.928,4.206-3.333,4.206-6.025V85.979c0-4.457-4.431-7.557-8.618-6.029l-33.401,12.189c-2.497.911-4.174,3.268-4.217,5.926Z" />
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
