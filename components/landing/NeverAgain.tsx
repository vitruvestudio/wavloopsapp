/**
 * Landing — Section 04. Never send a pack again.
 *
 * Right column composites two artifacts to make the section's
 * promise concrete:
 *   1. /Videos/Never send a beat pack.mp4 fills the 16:9 frame
 *      autoplaying muted in a loop — shows the producer dropping
 *      a beat into a server inside the app.
 *   2. /Photos/Notif_artist.png overlays the frame, floating
 *      partly over the right edge — the email digest the artist
 *      receives the moment the producer's upload lands.
 * Together they tell the cause / effect in one glance: producer
 * drops beat → artist gets a designed email instantly.
 */

import * as React from "react";

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

          {/* ─── RIGHT — Demo video + floating notif overlay ─── */}
          <VideoWithNotifOverlay />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Right column composition:
     - 16:9 video looping the producer's upload flow
     - PNG overlay floating off the top-right edge — the artist
       email digest, hanging slightly outside the video frame so
       the eye reads it as a separate, real-world artifact
   ============================================================ */

function VideoWithNotifOverlay() {
  return (
    <div
      className="relative w-full"
      style={{
        // Reserve extra space above + right so the overlay can
        // hang outside the video without overflowing the section.
        // Without this padding the floating notif would be clipped
        // by an ancestor `overflow:hidden` (the section's brand
        // halo wrapper).
        paddingTop: "clamp(20px, 4vw, 56px)",
        paddingRight: "clamp(0px, 4vw, 56px)",
      }}
    >
      {/* Video frame */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "16 / 9",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border-2)",
          backgroundColor: "var(--bg-1)",
          boxShadow:
            "0 50px 100px -32px oklch(0 0 0 / 0.7), 0 0 60px -16px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src="/Videos/Never send a beat pack.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {/* Floating email notif — anchored to the top-right edge of
              the video frame and bleeding slightly outside. Slight
              drop shadow + hairline border so it reads as a card
              landing on top of the screen recording, not part of
              the video. Hidden on small viewports — at < md the
              video already takes the full width and overlapping
              the notif would crush the readability of both. */}
      <div
        className="hidden md:block absolute"
        style={{
          // Position: hangs off the right edge, biased slightly
          // upward (mirrors the source mock).
          right: "-2%",
          top: "-2%",
          width: "62%",
          filter:
            "drop-shadow(0 24px 48px oklch(0 0 0 / 0.55)) drop-shadow(0 0 32px var(--accent-glow))",
          pointerEvents: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Photos/Notif_artist.png"
          alt="Wavloops email digest sent to an artist: 4 new beats in Dish."
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: 16,
          }}
        />
      </div>

      {/* Mobile fallback — show the notif full-width UNDER the
              video so the visitor still sees both artifacts on a
              small screen. */}
      <div className="md:hidden" style={{ marginTop: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Photos/Notif_artist.png"
          alt="Wavloops email digest sent to an artist: 4 new beats in Dish."
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: 14,
            filter:
              "drop-shadow(0 18px 36px oklch(0 0 0 / 0.5)) drop-shadow(0 0 24px var(--accent-glow))",
          }}
        />
      </div>
    </div>
  );
}
