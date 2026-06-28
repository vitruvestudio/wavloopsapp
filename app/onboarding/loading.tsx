/**
 * /onboarding — switch-to-producer splash.
 *
 * Rendered by Next.js while the onboarding page's server fetch is
 * resolving. Replaces the artist panel's chrome with a calm
 * full-screen Wavloops splash so the producer-side hand-off feels
 * intentional, not blank.
 *
 * Surface is a single screen — no skeleton — because /onboarding
 * shows different things to different users (the 5-step wizard
 * for fresh producers, an immediate forward to /dashboard for
 * already-onboarded ones). A logo + a short status line is a
 * universal placeholder for both branches.
 *
 * The accent halo behind the logo + the soft pulse pick up the
 * same DS vocabulary used on the marketing surface, so the
 * transition reads as "you're entering the producer side of
 * Wavloops" rather than a generic spinner.
 */

import { Logo } from "@/components/ui/Logo";

export default function OnboardingLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "var(--bg-0)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Brand halo — same radial-gradient pattern as the hero */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />

      {/* Centre stack — logo + tagline + status line. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          padding: "0 24px",
        }}
      >
        {/* Logo wrapper carries the pulse animation. wl-pulse-dot
                already lives in globals.css; we re-use it on the logo
                container by setting --wl-pulse-color to accent. */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            borderRadius: "var(--r-pill)",
            background:
              "color-mix(in oklch, var(--bg-1) 70%, transparent)",
            border:
              "1px solid color-mix(in oklch, var(--accent-text) 25%, transparent)",
            boxShadow:
              "0 0 60px -10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)",
            ["--wl-pulse-color" as string]: "var(--accent)",
            animation: "wl-pulse-dot 1.8s ease-out infinite",
          }}
        >
          <Logo size={44} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            textAlign: "center",
          }}
        >
          <div
            className="t-display"
            style={{
              fontSize: 22,
              letterSpacing: "-0.018em",
              color: "var(--fg-1)",
            }}
          >
            Switching to producer panel…
          </div>
          <div
            className="t-mono"
            style={{
              color: "var(--fg-3)",
              letterSpacing: "0.12em",
            }}
          >
            ONE LINK · EVERY DROP · FOREVER
          </div>
        </div>

        {/* Soft progress shimmer below the copy — three dots that
                fade in sequence, picked up from the wl-typing-bounce
                keyframe so it stays on-brand. */}
        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            gap: 6,
            marginTop: 4,
          }}
        >
          {[0, 0.2, 0.4].map((delay) => (
            <span
              key={delay}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent-text)",
                animation: "wl-typing-bounce 1.2s ease-in-out infinite",
                animationDelay: `${delay}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
