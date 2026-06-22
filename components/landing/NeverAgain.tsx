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
        {/* Text column ~40 %, visual column ~60 % so the video
                gets meaningful screen real estate. Gap tightened so
                the visual breathes harder still. */}
        <div
          className="grid grid-cols-1 md:grid-cols-[40fr_60fr] items-center"
          style={{ gap: "clamp(32px, 4vw, 56px)" }}
        >
          {/* ─── LEFT — Text ─── */}
          <div className="flex flex-col">
            <h2
              className="t-display"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                lineHeight: 1.04,
                marginBottom: 20,
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
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                maxWidth: 440,
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
        // Reserve space bottom + right where the overlay now
        // bleeds outside the video frame. Top stays flush so the
        // video aligns with the title baseline.
        paddingBottom: "clamp(20px, 4vw, 56px)",
        paddingRight: "clamp(0px, 4vw, 40px)",
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
          // Below-the-fold — defer the fetch entirely. autoPlay
          // still works: the browser starts the request when the
          // <video> becomes visible. Saves megabytes from the
          // initial page load budget.
          preload="none"
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {/* Floating email notif — anchored to the bottom-right edge
              of the video frame and bleeding slightly outside.
              Sized down (42 % vs 62 %) so the video stays the
              primary surface; the notif reads as a 'side artefact'
              on top, not the dominant element. Bottom-right anchor
              keeps the upper-left of the video (where the producer
              action lives in the screen recording) fully visible. */}
      <div
        className="hidden md:block absolute"
        style={{
          right: "-4%",
          bottom: "-6%",
          width: "42%",
          filter:
            "drop-shadow(0 24px 48px oklch(0 0 0 / 0.55)) drop-shadow(0 0 32px var(--accent-glow))",
          pointerEvents: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Photos/Notif_artist.png"
          alt="Wavloops email digest sent to an artist: 4 new beats in Dish."
          loading="lazy"
          decoding="async"
          width={1200}
          height={1280}
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
          loading="lazy"
          decoding="async"
          width={1200}
          height={1280}
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
