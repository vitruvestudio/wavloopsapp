/**
 * Landing — Section 03. How it works.
 *
 * Theo's reset: drop the coded compositions (Library / phone /
 * tracking mockups + floating toasts) and replace with the
 * cleanest possible interactive pattern — three pill tabs at
 * the top, one large rounded video frame below. Tabs are
 * clickable; switching tabs swaps the video playing inside the
 * frame. Each video is a real screen-studio capture of the
 * actual app doing the corresponding move.
 *
 *   Build your server  ▸  Share one link  ▸  See who's vibing
 *   ┌──────────────────────────────────────────────────────┐
 *   │                                                      │
 *   │              [ video plays here, looping ]           │
 *   │                                                      │
 *   └──────────────────────────────────────────────────────┘
 *
 * Each tab gets its own video file in /public/Videos/:
 *   Build  → Wavloops_1.mp4
 *   Share  → Wavloops_2.mp4
 *   Track  → Wavloops_3.mp4
 *
 * The video element is keyed by tab id so React unmounts +
 * remounts on switch — guarantees the new clip starts from
 * frame 0 instead of resuming the previous timestamp.
 */

"use client";

import * as React from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

interface Step {
  id: "build" | "share" | "track";
  number: string;
  tabLabel: string;
  icon: IconName;
  title: string;
  hook: string;
  video: string;
}

const STEPS: Step[] = [
  {
    id: "build",
    number: "01",
    tabLabel: "Build your server",
    icon: "library",
    title: "Build your server.",
    hook: "Upload your beats, organize them your way. Your catalog lives in one place — always.",
    video: "/Videos/Wavloops_1.mp4",
  },
  {
    id: "share",
    number: "02",
    tabLabel: "Share one link",
    icon: "link",
    title: "Share one link.",
    hook: "One link. Send it once. Artists get in with their email — no app to download, no friction.",
    video: "/Videos/Wavloops_2.mp4",
  },
  {
    id: "track",
    number: "03",
    tabLabel: "See who's vibing",
    icon: "heart",
    title: "See who's vibing.",
    hook: "Every listen, every like, every artist — tracked live. You know exactly who's ready to lock in.",
    video: "/Videos/Wavloops_3.mp4",
  },
];

export function LandingHowItWorks() {
  const [activeId, setActiveId] = React.useState<Step["id"]>("build");
  const active = STEPS.find((s) => s.id === activeId) ?? STEPS[0];

  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Soft accent halo low-centre — picks up the bottom of
              the Problem section's central glow so the page reads
              continuous as the visitor scrolls past. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.25,
        }}
      />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        {/* ─── Intro title + caption tied to the active tab ─── */}
        <div className="mx-auto text-center" style={{ maxWidth: 820 }}>
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              marginBottom: 22,
            }}
          >
            {active.title.split(/(\.)/).map((piece, i) => {
              // Render the final period in --accent-text + glow so
              // it picks up the same typographic move as the hero
              // and section 02 headlines.
              if (piece === ".") {
                return (
                  <span
                    key={i}
                    style={{
                      color: "var(--accent-text)",
                      textShadow: "0 0 32px var(--accent-glow)",
                    }}
                  >
                    {piece}
                  </span>
                );
              }
              return <React.Fragment key={i}>{piece}</React.Fragment>;
            })}
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
            {active.hook}
          </p>
        </div>

        {/* ─── Tabs row ─── */}
        <div
          role="tablist"
          aria-label="How it works steps"
          className="flex items-center justify-center flex-wrap"
          style={{
            gap: 12,
            marginTop: "clamp(40px, 5vw, 56px)",
            marginBottom: "clamp(32px, 4vw, 44px)",
          }}
        >
          {STEPS.map((s) => {
            const selected = s.id === activeId;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={selected}
                aria-controls={`step-panel-${s.id}`}
                onClick={() => setActiveId(s.id)}
                className="inline-flex items-center transition-all"
                style={{
                  gap: 10,
                  padding: "12px 18px",
                  borderRadius: "var(--r-pill)",
                  background: selected
                    ? "var(--accent-surface)"
                    : "color-mix(in oklch, var(--bg-2) 80%, transparent)",
                  border: selected
                    ? "1px solid color-mix(in oklch, var(--accent-text) 45%, transparent)"
                    : "1px solid var(--border-2)",
                  color: selected ? "var(--accent-text)" : "var(--fg-2)",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  boxShadow: selected
                    ? "0 0 28px -6px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)"
                    : "inset 0 1px 0 rgba(255,255,255,0.02)",
                  backdropFilter: "blur(8px)",
                  transitionDuration: "var(--dur)",
                  transitionTimingFunction: "var(--ease)",
                }}
              >
                <Icon name={s.icon} size={16} />
                <span
                  className="t-mono"
                  style={{
                    color: selected ? "var(--accent-text)" : "var(--fg-3)",
                    fontSize: 11,
                  }}
                >
                  {s.number}
                </span>
                <span>{s.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Active video frame ─── */}
        <div
          id={`step-panel-${active.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${active.id}`}
          className="relative mx-auto overflow-hidden"
          style={{
            maxWidth: 1120,
            aspectRatio: "16 / 9",
            borderRadius: 24,
            border: "1px solid var(--border-2)",
            background: "var(--bg-inset)",
            boxShadow:
              "0 60px 120px -40px oklch(0 0 0 / 0.7), 0 0 60px -20px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Soft accent halo top-center to match the hero's
                  cinematic frame. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, var(--accent-glow) 0%, transparent 60%)",
              opacity: 0.4,
              zIndex: 2,
            }}
          />

          {/* video — keyed on active.id so React unmounts the
                  previous element and remounts a fresh one when the
                  tab changes. Without this, switching tabs would
                  swap the src on the same <video> node, which the
                  browser sometimes refuses to autoplay after the
                  source change (treats the new src as a 'user
                  navigation'). Re-mount sidesteps the issue. */}
          <video
            key={active.id}
            src={active.video}
            autoPlay
            muted
            loop
            playsInline
            // Below-the-fold tabbed player — never preload until
            // the user actually scrolls down + lands on this
            // section. Avoids paying for 3 video metadata fetches
            // (Wavloops_1/2/3) just to render the home.
            preload="none"
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", zIndex: 1 }}
          />
        </div>
      </div>
    </section>
  );
}
