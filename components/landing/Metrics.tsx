/**
 * Landing — Section 06. Metrics.
 *
 * Theo's brief:
 *   - Title centered, subtitle centered below.
 *   - The /Photos/metrics.png screenshot underneath.
 *   - No glow on the image — clean display, no accent halo.
 *
 * The section breaks the alternating left/right rhythm of
 * Section 04 (NeverAgain) + Section 05 (GrowAudience) by going
 * fully centered + stacked. Image stands alone with just a
 * hairline border + a neutral drop shadow — no accent glow,
 * no scan lines, no top-centre halo.
 */

import * as React from "react";

export function LandingMetrics() {
  return (
    <section
      id="metrics"
      aria-label="Metrics"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        {/* Header — title + subtitle, both centered */}
        <div
          className="mx-auto text-center"
          style={{
            maxWidth: 820,
            marginBottom: "clamp(40px, 5vw, 64px)",
          }}
        >
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(40px, 5.4vw, 68px)",
              lineHeight: 1.04,
              marginBottom: 22,
              letterSpacing: "-0.018em",
            }}
          >
            Know{" "}
            <span
              style={{
                color: "var(--accent-text)",
                textShadow: "0 0 32px var(--accent-glow)",
              }}
            >
              exactly who
            </span>
            &apos;s into your beats.
          </h2>
          <p
            className="t-body-l"
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              maxWidth: 680,
              margin: "0 auto",
            }}
          >
            Every play, every like, every artist — in real time. See who&apos;s
            hooked, who&apos;s coming back, and who&apos;s ready to lock in.
          </p>
        </div>

        {/* Metrics screenshot — no glow per Theo. Hairline border
                + a flat dark drop shadow keep the image grounded
                without the accent halo treatment the other sections
                use.
                A <picture> swap delivers Metrics_mobile.png on
                viewports < md (768px) and the wide metrics.png at
                md+ so the dashboard reads as intended at every
                breakpoint. The browser picks one source on first
                paint, no JS, no layout shift. */}
        <div
          className="mx-auto"
          style={{ maxWidth: 1120 }}
        >
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/Photos/Metrics_mobile.png"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Photos/metrics.png"
              alt="Wavloops analytics dashboard — total plays, total likes, top fan, audience activity."
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "var(--r-xl)",
                border: "1px solid var(--border-1)",
                boxShadow: "0 40px 80px -28px oklch(0 0 0 / 0.6)",
              }}
            />
          </picture>
        </div>
      </div>
    </section>
  );
}
