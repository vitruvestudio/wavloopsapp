/**
 * Landing — Section 05. Grow your audience.
 *
 * Mirror of Section 04 (NeverAgain) — same 2-column shape,
 * but the placeholder sits on the LEFT and the text on the
 * RIGHT. Alternating the side keeps the rhythm of the page
 * visually interesting; sections 04 and 05 read like a pair
 * (the promise + the upside).
 *
 * On mobile the text still comes first in the DOM so the
 * visitor reads the promise before the visual — the desktop
 * left/right is restored via Tailwind responsive `order-*`
 * utilities.
 */

import * as React from "react";

export function LandingGrowAudience() {
  return (
    <section
      id="grow-audience"
      aria-label="Grow your audience"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Brand halo behind the LEFT column this time — picks up
              the empty placeholder frame so the canvas still feels
              lit by the brand on first load. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 50% at 25% 50%, var(--accent-glow) 0%, transparent 65%)",
          opacity: 0.3,
        }}
      />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 items-center"
          style={{ gap: "clamp(40px, 5vw, 72px)" }}
        >
          {/* Text — DOM-first so mobile shows it on top; CSS
                  order flips it to the right column on md+. */}
          <div className="flex flex-col order-1 md:order-2">
            <h2
              className="t-display"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                lineHeight: 1.04,
                marginBottom: 24,
                letterSpacing: "-0.018em",
              }}
            >
              Grow your{" "}
              <span
                style={{
                  color: "var(--accent-text)",
                  textShadow: "0 0 32px var(--accent-glow)",
                }}
              >
                audience
              </span>
              .
            </h2>
            <p
              className="t-body-l"
              style={{
                fontSize: 19,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                maxWidth: 500,
              }}
            >
              Every play, every like, every artist — tracked live. You see
              exactly who&apos;s listening, who&apos;s coming back, and
              who&apos;s ready to lock in. Spend your time on the artists
              that move, not the ones that ghost.
            </p>
          </div>

          {/* Video placeholder — DOM-second, ordered to the LEFT
                  on md+. */}
          <div className="order-2 md:order-1">
            <GrowVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Visual — Gorwaudience.png with accent halo.
   Replaces the idle video placeholder. Raw <img> so the file's
   own bezel renders without a wrapper card around it.
   ============================================================ */

function GrowVisual() {
  return (
    <div
      className="relative w-full"
      style={{
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        boxShadow:
          "0 50px 100px -32px oklch(0 0 0 / 0.7), 0 0 60px -16px var(--accent-glow)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Photos/Gorwaudience.png"
        alt="Wavloops — artist insight card showing plays, likes, beats heard, servers and top fans."
        loading="lazy"
        decoding="async"
        width={1920}
        height={1280}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </div>
  );
}
