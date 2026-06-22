/**
 * Open Graph image — exposed at /opengraph-image at build time.
 * Next.js serves the rendered output to crawlers when they hit
 * <meta property="og:image"> for the root.
 *
 * Programmatic 1200 × 630 PNG composed via next/og's ImageResponse:
 *   - Dark canvas with the same brand accent halo as the live hero.
 *   - Big 'Stop sending beats. Start sharing one link.' headline,
 *     with 'one link' in --accent.
 *   - Small mono kicker 'WAVLOOPS · BEAT SHARING FOR SERIOUS PRODUCERS'.
 *   - Bottom right: wavloops.co domain tag.
 *
 * Same shape ships at /twitter-image (re-exported below if we ever
 * want a square variant; Twitter's summary_large_image is happy
 * with 1200×630 too).
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wavloops — Your beats, a living link.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  // System sans-serif stack — the Edge runtime can't load Unbounded
  // without bundling the font file. The fallback stack still reads
  // as a modern display sans on every OS.
  const sansStack =
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  const monoStack =
    "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          // Dark canvas with a top-right brand halo + a bottom-left
          // cool counterweight — same lighting as the live hero.
          backgroundColor: "#0b0b0e",
          backgroundImage:
            "radial-gradient(ellipse 720px 480px at 80% 0%, rgba(43,37,255,0.42) 0%, transparent 70%), radial-gradient(ellipse 600px 480px at 0% 110%, rgba(86,73,255,0.28) 0%, transparent 70%)",
          fontFamily: sansStack,
          color: "#ffffff",
        }}
      >
        {/* Mono kicker */}
        <div
          style={{
            fontFamily: monoStack,
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8e8eb0",
          }}
        >
          WAVLOOPS · BEAT SHARING FOR SERIOUS PRODUCERS
        </div>

        {/* Headline — big display text. flex grow eats the middle space. */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div
            style={{
              fontSize: 108,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div>Stop sending beats.</div>
            <div>
              Start sharing{" "}
              <span
                style={{
                  color: "#7a72ff",
                }}
              >
                one link
              </span>
              .
            </div>
          </div>
        </div>

        {/* Bottom row — domain tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: monoStack,
            fontSize: 22,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9a9ac0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: "#7a72ff",
                boxShadow: "0 0 24px rgba(122,114,255,0.8)",
              }}
            />
            wavloops.co
          </div>
          <div>One link · Every beat · Every artist</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
