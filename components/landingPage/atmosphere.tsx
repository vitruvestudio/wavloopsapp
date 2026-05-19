/**
 * Atmosphere = radial accent glow at top + fine grain overlay.
 *
 * Use in any section/page that needs the Wavloops "premium dark canvas" feel.
 * Parent must be `relative overflow-hidden` (the divs are absolutely positioned).
 *
 * Variants:
 * - `soft`   — default for the landing (Hero/Preview)
 * - `strong` — conversion sections (EarlyAccess/Claim)
 */

const VARIANTS = {
  soft: {
    opacity: 0.14,
    height: "820px",
    shape: "ellipse 70% 55% at 50% 0%",
  },
  strong: {
    opacity: 0.18,
    height: "900px",
    shape: "ellipse 60% 60% at 50% 0%",
  },
} as const;

const GRAIN_DATA_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

type AtmosphereProps = {
  intensity?: keyof typeof VARIANTS;
};

export function Atmosphere({ intensity = "soft" }: AtmosphereProps) {
  const { opacity, height, shape } = VARIANTS[intensity];

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height,
          background: `radial-gradient(${shape}, rgba(43,37,255,${opacity}), transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: GRAIN_DATA_URL,
          backgroundSize: "200px 200px",
        }}
      />
    </>
  );
}
