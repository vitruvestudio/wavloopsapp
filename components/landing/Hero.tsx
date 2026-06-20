/**
 * Landing — Hero.
 *
 * The opening surface for /. Premium feel comes from:
 *
 *   1. Full-bleed dark canvas with a subtle radial glow biased
 *      toward the brand accent — the eye lands on the title, not
 *      on chrome.
 *   2. Display-XL title that breaks across two lines, with the
 *      promise ("one link") in accent so the value prop reads
 *      even at a quarter-second skim.
 *   3. Mono kicker line above the title, lowercase-uppercase
 *      contrast against the giant display type → "editorial"
 *      premium register, not "marketing-page CTA stack" register.
 *   4. Hairline grid background that fades into the dark — gives
 *      the canvas a measurable feel without being noisy.
 *
 * Structure (top → bottom):
 *
 *   [ KICKER · MONO ]
 *   Stop sending beats.
 *   Start sharing one link.
 *   [ Subline — 2 short sentences ]
 *   [ Get started — Pricing ]
 *   [ Trust signals · MP3+WAV · Stripe · No CC required ]
 *
 * The whole thing sits inside one section so the page can stack
 * follow-on sections (How it works, Pricing, etc.) without
 * fighting the hero's z-index.
 */

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
      style={{
        // Pad-top accounts for the fixed header (72px) + breathing
        // room. Pad-bottom is deliberately generous to land the eye
        // on the next section without crowding the CTAs.
        paddingTop: 168,
        paddingBottom: 120,
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* ─── Background — radial glow biased top-right ─── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            // Top-right brand glow (the warm indigo halo).
            "radial-gradient(ellipse 60% 50% at 75% -10%, var(--accent-glow) 0%, transparent 55%)",
            // Bottom-left cool counterweight so the canvas doesn't
            // feel one-sided.
            "radial-gradient(ellipse 50% 50% at 10% 100%, oklch(0.42 0.16 268 / 0.35) 0%, transparent 60%)",
          ].join(", "),
        }}
      />

      {/* ─── Background — hairline grid that fades to dark ─── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(to right, var(--border-1) 1px, transparent 1px)",
            "linear-gradient(to bottom, var(--border-1) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)",
          opacity: 0.55,
        }}
      />

      {/* ─── Content — clamped + centred ─── */}
      <div
        className="relative mx-auto flex flex-col items-center text-center"
        style={{
          maxWidth: 1080,
          padding: "0 24px",
        }}
      >
        {/* Kicker — mono uppercase pill, sits above the title.
                Catches the eye before they read, anchors the
                product category. */}
        <div
          className="t-mono inline-flex items-center"
          style={{
            gap: 8,
            padding: "6px 12px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent-surface)",
            color: "var(--accent-text)",
            border: "1px solid color-mix(in oklch, var(--accent-text) 22%, transparent)",
            marginBottom: 28,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: "var(--r-pill)",
              background: "var(--accent-text)",
              boxShadow: "0 0 12px var(--accent-glow)",
            }}
          />
          Beat sharing for serious producers
        </div>

        {/* Title — display-xl, two lines. The accent span on
                "one link" carries the promise. */}
        <h1
          id="hero-title"
          className="t-display-xl"
          style={{
            // The clamp() inside .t-display-xl handles fluid sizing;
            // we just need to widen the maximum so the headline can
            // breathe on big screens.
            fontSize: "clamp(48px, 7vw, 96px)",
            maxWidth: 900,
            marginBottom: 22,
          }}
        >
          Stop sending beats.
          <br />
          Start sharing{" "}
          <span
            style={{
              color: "var(--accent-text)",
              // Inline glow on the accent span — quick eye-pull
              // without making the whole headline screamy.
              textShadow: "0 0 32px var(--accent-glow)",
            }}
          >
            one link
          </span>
          .
        </h1>

        {/* Subline — kept tight. Two sentences max so the eye
                lands on the CTA in <3 seconds. */}
        <p
          className="t-body-l"
          style={{
            fontSize: 19,
            lineHeight: 1.55,
            maxWidth: 680,
            marginBottom: 40,
            color: "var(--fg-2)",
          }}
        >
          Create a living beat server, share one link with your artists, and it
          updates itself — no more resending packs. See who listens, who likes,
          and who&apos;s ready to lock in.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: 12 }}
        >
          <Link href="/auth?intent=signup">
            <Button size="lg" iconRight="arrow-right">
              Get started — free
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="secondary">
              See how it works
            </Button>
          </Link>
        </div>

        {/* Hero video — placeholder until the demo cut lands. 16:9
                frame, rounded, hairline border, soft pop shadow.
                Reads as the immediate visual reward right under the
                CTA pair, so the visitor's eye is rewarded for
                staying past the headline.
                Swap to a <video poster=... autoplay muted loop> tag
                once the file is ready; the surrounding aspect-ratio
                frame stays identical so layout doesn't shift. */}
        <div
          className="relative w-full"
          style={{
            maxWidth: 960,
            marginTop: 56,
            // Reserve the 16:9 box up-front so the layout doesn't
            // jump when the eventual <video> hydrates.
            aspectRatio: "16 / 9",
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--border-2)",
            background:
              "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
            boxShadow: "var(--shadow-pop)",
            overflow: "hidden",
          }}
        >
          {/* Inner soft accent halo top-center — feels like the
                  frame is lit by the wave that lives inside. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 35% at 50% 0%, var(--accent-glow) 0%, transparent 65%)",
              opacity: 0.55,
            }}
          />
          {/* Faint vertical scan lines — adds a "screen" texture
                  without going noisy. Mask fades them under the
                  play button so the focal point stays clean. */}
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
              opacity: 0.7,
            }}
          />
          {/* Centered play disc + caption */}
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
                border: "1px solid color-mix(in oklch, var(--accent-fg) 18%, transparent)",
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
              Watch the 60-second demo
            </span>
          </div>
        </div>

        {/* Trust signals — mono row, caps the hero block. */}
        <div
          className="flex flex-wrap items-center justify-center t-mono"
          style={{
            gap: 18,
            marginTop: 36,
            color: "var(--fg-3)",
          }}
        >
          <TrustItem icon="waves" label="MP3 & WAV ready" />
          <Dot />
          <TrustItem icon="lock" label="Private servers" />
          <Dot />
          <TrustItem icon="check" label="No card required" />
        </div>
      </div>
    </section>
  );
}

/* ───────── Helpers ───────── */

function TrustItem({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
}) {
  return (
    <span className="inline-flex items-center" style={{ gap: 6 }}>
      <Icon name={icon} size={13} />
      {label}
    </span>
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 3,
        height: 3,
        borderRadius: "var(--r-pill)",
        background: "var(--border-strong)",
      }}
    />
  );
}
