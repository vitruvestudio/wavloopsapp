/**
 * Landing — Section 04. All in one.
 *
 * Theo: 'create a section 4 like section 3, but with 4 cards
 * in 2×2 instead of tabs. Three cards for the 3 step screens
 * (same videos as section 3), the fourth is a vector analytics
 * card built with the DS — total plays, total likes, top fan'.
 *
 * Anatomy
 * ───────
 *   ┌────────────┬────────────┐
 *   │  Build     │  Share     │   ← looping muted videos
 *   │  (video 1) │  (video 2) │
 *   ├────────────┼────────────┤
 *   │  Track     │ Analytics  │   ← analytics is composed in
 *   │  (video 3) │  (vector)  │     real DS tokens, not a video
 *   └────────────┴────────────┘
 *
 * No tabs, no active state — every card is on screen at once.
 * The visitor's eye reads the four moves in parallel, the
 * Analytics card grounds the value prop in concrete numbers.
 */

"use client";

import * as React from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

interface VideoEntry {
  number: string;
  label: string;
  icon: IconName;
  src: string;
}

const VIDEO_CARDS: VideoEntry[] = [
  { number: "01", label: "Catalog", icon: "library", src: "/Videos/Wavloops_1.mp4" },
  { number: "02", label: "One link", icon: "link", src: "/Videos/Wavloops_2.mp4" },
  { number: "03", label: "Audience", icon: "heart", src: "/Videos/Wavloops_3.mp4" },
];

export function LandingAllInOne() {
  return (
    <section
      id="all-in-one"
      aria-label="All in one"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Soft brand halo high-centre — continues the gradient
              the rest of the landing maintains. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 20%, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.22,
        }}
      />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        {/* Header */}
        <div className="mx-auto text-center" style={{ maxWidth: 820 }}>
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(40px, 5.4vw, 68px)",
              lineHeight: 1.04,
              marginBottom: 22,
            }}
          >
            All in{" "}
            <span
              style={{
                color: "var(--accent-text)",
                textShadow: "0 0 32px var(--accent-glow)",
              }}
            >
              one
            </span>{" "}
            server.
          </h2>
          <p
            className="t-body-l"
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Catalog, sharing, live tracking — and the numbers that prove
            what&apos;s working.
          </p>
        </div>

        {/* 2×2 card grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
            gap: "clamp(16px, 2vw, 24px)",
            marginTop: "clamp(48px, 6vw, 72px)",
          }}
        >
          {VIDEO_CARDS.map((v) => (
            <VideoCard key={v.src} entry={v} />
          ))}
          <AnalyticsCard />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Video card — looping muted clip with a small step badge in
   the top-left corner. Each card is rendered as a square so
   the four pile up cleanly in a 2×2 grid; the video fills the
   square via objectFit: cover (cropping is acceptable here —
   each clip's center holds the focal point).
   ============================================================ */

function VideoCard({ entry }: { entry: VideoEntry }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        aspectRatio: "1 / 1",
        borderRadius: 24,
        border: "1px solid var(--border-2)",
        background: "var(--bg-inset)",
        boxShadow:
          "0 40px 80px -28px oklch(0 0 0 / 0.7), 0 0 50px -16px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Top-center accent halo so the video frame matches the
              hero / step 03 cinematic frame look. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, var(--accent-glow) 0%, transparent 60%)",
          opacity: 0.35,
          zIndex: 2,
        }}
      />

      {/* Step badge — sits over the video top-left, glass-style
              so it reads on any frame. */}
      <div
        className="absolute inline-flex items-center"
        style={{
          top: 14,
          left: 14,
          gap: 8,
          padding: "6px 11px",
          borderRadius: "var(--r-pill)",
          background: "color-mix(in oklch, var(--bg-0) 55%, transparent)",
          border: "1px solid var(--border-2)",
          backdropFilter: "blur(8px)",
          color: "var(--fg-1)",
          zIndex: 3,
        }}
      >
        <Icon name={entry.icon} size={13} />
        <span
          className="t-mono"
          style={{ color: "var(--accent-text)", fontSize: 10 }}
        >
          {entry.number}
        </span>
        <span
          className="t-mono"
          style={{ color: "var(--fg-2)", fontSize: 10 }}
        >
          {entry.label}
        </span>
      </div>

      <video
        src={entry.src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", zIndex: 1 }}
      />
    </div>
  );
}

/* ============================================================
   AnalyticsCard — vector composition built from DS tokens.
   Same 1:1 aspect ratio as the video cards so the grid stays
   pristine. Three content blocks stacked: hero stat (plays),
   secondary stats row (likes + artists + sparkline), top fan
   callout. PLAYS counter ticks up every 3.5s + the LIVE dot
   pulses + sparkline last bar pulses — so the card breathes
   even though it's static vector.
   ============================================================ */

function AnalyticsCard() {
  const [plays, setPlays] = React.useState(3420);
  React.useEffect(() => {
    const id = setInterval(
      () => setPlays((p) => p + 1 + Math.floor(Math.random() * 4)),
      3500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden flex flex-col"
      style={{
        aspectRatio: "1 / 1",
        borderRadius: 24,
        border:
          "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
        background:
          "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        boxShadow:
          "0 40px 80px -28px oklch(0 0 0 / 0.7), 0 0 60px -10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.06)",
        padding: "clamp(20px, 2.5vw, 28px)",
      }}
    >
      {/* Background brand halo top-right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% -10%, var(--accent-glow) 0%, transparent 60%)",
          opacity: 0.5,
        }}
      />

      {/* Header row — matches the step badge on the video cards
              so all four corners read consistent. */}
      <div
        className="relative flex items-center"
        style={{ gap: 10, zIndex: 2 }}
      >
        <div
          className="inline-flex items-center"
          style={{
            gap: 8,
            padding: "6px 11px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent-surface)",
            border: "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
            color: "var(--accent-text)",
          }}
        >
          <Icon name="waves" size={13} />
          <span className="t-mono" style={{ fontSize: 10 }}>
            04
          </span>
          <span className="t-mono" style={{ fontSize: 10 }}>
            Analytics
          </span>
        </div>
        <div
          className="inline-flex items-center"
          style={{
            marginLeft: "auto",
            gap: 6,
            padding: "5px 9px",
            borderRadius: "var(--r-pill)",
            background: "var(--ok-surface)",
            color: "var(--ok)",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: "var(--r-pill)",
              background: "var(--ok)",
              ["--wl-pulse-color" as string]: "var(--ok)",
              animation: "wl-pulse-dot 1.6s ease-out infinite",
            }}
          />
          <span className="t-mono" style={{ fontSize: 10 }}>
            Live
          </span>
        </div>
      </div>

      {/* Hero stat — total plays, animated counter */}
      <div
        className="relative flex flex-col"
        style={{ marginTop: "clamp(18px, 2.5vw, 28px)", gap: 4, zIndex: 2 }}
      >
        <span
          className="t-mono"
          style={{ color: "var(--fg-4)", fontSize: 11 }}
        >
          Total plays
        </span>
        <div
          className="flex items-baseline"
          style={{ gap: 10 }}
        >
          <span
            className="t-display"
            style={{
              fontSize: "clamp(40px, 5.5vw, 64px)",
              lineHeight: 1,
              color: "var(--accent-text)",
              textShadow: "0 0 28px var(--accent-glow)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
              transition: "color 0.2s var(--ease-out)",
            }}
          >
            {plays.toLocaleString("en-US")}
          </span>
          <span
            className="t-mono inline-flex items-center"
            style={{
              gap: 4,
              padding: "3px 8px",
              borderRadius: "var(--r-pill)",
              background: "var(--ok-surface)",
              color: "var(--ok)",
              fontSize: 10,
            }}
          >
            <Icon name="chevron-right" size={10} style={{ transform: "rotate(-90deg)" }} />
            +12%
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div
        className="relative"
        style={{
          marginTop: "clamp(14px, 2vw, 20px)",
          height: "clamp(34px, 5vw, 50px)",
          zIndex: 2,
        }}
      >
        <Sparkline />
      </div>

      {/* Secondary stats — Likes + Artists */}
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: "clamp(14px, 2vw, 20px)",
          zIndex: 2,
        }}
      >
        <Stat label="Total likes" value="88" delta="+5%" icon="heart" />
        <Stat label="Artists" value="12" delta="+3" icon="users" />
      </div>

      {/* Top fan */}
      <div
        className="relative flex items-center"
        style={{
          marginTop: "auto",
          paddingTop: "clamp(16px, 2vw, 22px)",
          gap: 12,
          borderTop: "1px solid var(--border-1)",
          zIndex: 2,
        }}
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-pill)",
            background:
              "linear-gradient(135deg, oklch(0.62 0.18 35) 0%, oklch(0.58 0.18 22) 100%)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          KA
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center" style={{ gap: 6 }}>
            <span
              className="t-mono"
              style={{ color: "var(--accent-text)", fontSize: 9 }}
            >
              Top fan
            </span>
          </div>
          <div
            className="t-title"
            style={{
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            kayde.mgmt@gmail.com
          </div>
          <div
            className="t-mono"
            style={{ color: "var(--fg-4)", fontSize: 9, marginTop: 3 }}
          >
            154 PLAYS · 12 LIKES
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: IconName;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        gap: 4,
        padding: "12px 14px",
        background: "var(--bg-inset)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-md)",
      }}
    >
      <div className="flex items-center" style={{ gap: 6 }}>
        <Icon name={icon} size={12} style={{ color: "var(--fg-3)" }} />
        <span
          className="t-mono"
          style={{ color: "var(--fg-4)", fontSize: 9 }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline" style={{ gap: 6 }}>
        <span
          className="t-h2"
          style={{
            fontSize: "clamp(20px, 2.4vw, 28px)",
            color: "var(--fg-1)",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span
          className="t-mono"
          style={{ color: "var(--ok)", fontSize: 10 }}
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

/* Sparkline — climbing-bar mini chart, last 3 bars in accent.
   Pure vector, no JS state. Same idea as the one we shipped on
   the previous tracking mockup. */
function Sparkline() {
  const BARS = 22;
  return (
    <div
      className="flex items-end justify-end"
      style={{ width: "100%", height: "100%", gap: 3 }}
    >
      {Array.from({ length: BARS }).map((_, i) => {
        const t = i / (BARS - 1);
        const noise = Math.sin(i * 0.85) * 0.15;
        const h = Math.max(0.18, 0.3 + t * 0.65 + noise);
        const fill =
          i >= BARS - 3
            ? "var(--accent)"
            : i >= BARS - 8
              ? "var(--accent-text)"
              : "var(--fg-4)";
        return (
          <span
            key={i}
            style={{
              flex: 1,
              height: `${h * 100}%`,
              background: fill,
              borderRadius: 2,
              transformOrigin: "bottom",
              opacity: i >= BARS - 8 ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}
