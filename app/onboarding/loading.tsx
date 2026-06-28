/**
 * /onboarding — switch-to-producer splash.
 *
 * Mirrors the ModeSwitchForm overlay (components/app/ModeSwitchForm.tsx)
 * so the producer-panel hand-off looks identical whether the
 * visitor came in via:
 *   - the account-menu "Switch to producer view" form action
 *     (which renders that overlay inline), OR
 *   - the artist-panel ExplainerBar "Switch to producer panel"
 *     link (which lands on /onboarding and triggers this file).
 *
 * Visual contract with ModeSwitchForm:
 *   - 96x96 glyph area with a spinning accent ring + soft pulse
 *     + the Logomark at 42px
 *   - "Loading your producer studio…" headline (font-display, 22px)
 *   - "Tuning up your library and dashboard" subline
 *   - Same wlpModeSwitchSpin / wlpModeSwitchPulse keyframes
 *
 * The only difference is the backdrop: ModeSwitchForm sits over a
 * live page so it uses a translucent scrim + backdrop-blur; this
 * splash IS the page, so we render the same surface on a solid
 * var(--bg-0) instead. Keeps the visual identical otherwise.
 */

import { Logomark } from "@/components/ui/Logo";

export default function OnboardingLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9999,
        background: "var(--bg-0)",
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: 22, padding: "0 24px", textAlign: "center" }}
      >
        {/* Animated glyph: the Wavloops logomark with a slow
                scale-pulse + a thin accent ring orbiting behind it.
                Pure CSS so it costs nothing and stays sharp. */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 96, height: 96 }}
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              borderTopColor: "transparent",
              animation: "wlpModeSwitchSpin 1.1s linear infinite",
            }}
          />
          <span
            aria-hidden
            className="absolute inset-2"
            style={{
              borderRadius: "50%",
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--accent) 22%, transparent) 0%, transparent 70%)",
              animation: "wlpModeSwitchPulse 1.6s var(--ease) infinite",
            }}
          />
          <Logomark size={42} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--fg-1)",
              letterSpacing: "-0.01em",
            }}
          >
            Loading your producer studio…
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--fg-3)",
            }}
          >
            Tuning up your library and dashboard
          </div>
        </div>
      </div>

      {/* Inline keyframes mirrored from ModeSwitchForm so the two
              surfaces stay in lockstep visually. */}
      <style>{`
        @keyframes wlpModeSwitchSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes wlpModeSwitchPulse {
          0%, 100% { transform: scale(0.9); opacity: 0.6; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
