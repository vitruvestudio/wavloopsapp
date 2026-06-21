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
import { Icon } from "@/components/ui/Icon";

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
                fontSize: "clamp(40px, 5.4vw, 68px)",
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
            <VideoPlaceholder />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Video placeholder — same shape as the hero / NeverAgain
   frame. Drop a <video> in by replacing the inner play disc.
   ============================================================ */

function VideoPlaceholder() {
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: "16 / 9",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--border-2)",
        background:
          "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        boxShadow:
          "0 50px 100px -32px oklch(0 0 0 / 0.7), 0 0 60px -16px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      {/* Top-centre accent halo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, var(--accent-glow) 0%, transparent 60%)",
          opacity: 0.5,
        }}
      />

      {/* Faint vertical scan lines fading under the centre. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border-1) 1px, transparent 1px)",
          backgroundSize: "48px 100%",
          maskImage:
            "radial-gradient(ellipse 40% 40% at 50% 50%, transparent 40%, #000 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 40% 40% at 50% 50%, transparent 40%, #000 80%)",
          opacity: 0.6,
        }}
      />

      {/* Centred play disc + caption */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <button
          type="button"
          aria-label="Play demo video"
          className="inline-flex items-center justify-center transition-transform hover:scale-105"
          style={{
            width: 84,
            height: 84,
            borderRadius: "var(--r-pill)",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            border:
              "1px solid color-mix(in oklch, var(--accent-fg) 18%, transparent)",
            boxShadow:
              "0 0 0 8px color-mix(in oklch, var(--accent) 18%, transparent), 0 24px 60px -12px var(--accent-glow)",
            cursor: "pointer",
          }}
        >
          <Icon name="play" size={28} />
        </button>
        <span
          className="t-mono"
          style={{
            marginTop: 18,
            color: "var(--fg-2)",
          }}
        >
          Watch the tracking demo
        </span>
      </div>
    </div>
  );
}
