/**
 * Landing — Section 04. Never send a pack again.
 *
 * The promise section. Title pulls the visitor's eye to the
 * resolution word ('again' → accent + glow, picking up the
 * same typographic move the rest of the landing maintains).
 * Two-column layout on desktop:
 *
 *   ┌──────────────┬────────────────────────────┐
 *   │              │                            │
 *   │  Title       │   ┌──── 16:9 video ────┐  │
 *   │  Subtitle    │   │                    │  │
 *   │              │   │   placeholder      │  │
 *   │              │   │   (drop in later)  │  │
 *   │              │   └────────────────────┘  │
 *   └──────────────┴────────────────────────────┘
 *
 * On mobile the two columns stack vertically; the text comes
 * first so the visitor reads the promise before the visual.
 *
 * The video placeholder mirrors the hero's pattern — same 16:9
 * frame, accent-glow halo, faint vertical scan lines, big
 * accent play disc + 'Watch the demo' mono caption. Theo can
 * drop a <video> in the same frame later by replacing the
 * inner play disc with a <video> tag.
 */

import * as React from "react";
import { Icon } from "@/components/ui/Icon";

export function LandingNeverAgain() {
  return (
    <section
      id="never-again"
      aria-label="Never send a pack again"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Brand halo behind the video so the right side glows
              into the canvas. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 50% at 75% 50%, var(--accent-glow) 0%, transparent 65%)",
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
          {/* ─── LEFT — Text ─── */}
          <div className="flex flex-col">
            <h2
              className="t-display"
              style={{
                fontSize: "clamp(40px, 5.4vw, 68px)",
                lineHeight: 1.04,
                marginBottom: 24,
                letterSpacing: "-0.018em",
              }}
            >
              Never send a pack{" "}
              <span
                style={{
                  color: "var(--accent-text)",
                  textShadow: "0 0 32px var(--accent-glow)",
                }}
              >
                again
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
              Drop a beat into your server and it&apos;s instantly there for
              every artist with the link. No re-uploads, no expired transfers,
              no &ldquo;did you get my pack?&rdquo; — just one living link
              that updates itself forever.
            </p>
          </div>

          {/* ─── RIGHT — Video placeholder ─── */}
          <VideoPlaceholder />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Video placeholder — 16:9 frame ready for a <video> drop-in.
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
      {/* Top-centre accent halo so the empty frame still feels
              'lit' by the brand. Same trick as the hero placeholder
              and the Section 03 video frame. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, var(--accent-glow) 0%, transparent 60%)",
          opacity: 0.5,
        }}
      />

      {/* Faint vertical scan lines fading under the centre of
              the frame — adds 'screen' texture without going noisy. */}
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
          Watch the 30-second demo
        </span>
      </div>
    </div>
  );
}
