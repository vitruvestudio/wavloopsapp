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
import { HeroEyebrow } from "@/components/landing/HeroEyebrow";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
      style={{
        // Pad-top clamps to (header height 60px + breathing) on
        // mobile and grows to the cinematic 168px on desktop.
        // Pad-bottom follows the same scaling so the next section
        // doesn't crowd the CTA stack at any viewport.
        paddingTop: "clamp(112px, 16vw, 168px)",
        paddingBottom: "clamp(72px, 12vw, 120px)",
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
        {/* Eyebrow — interactive Vercel-style announcement
                banner. Underlined CTA + description, with two
                sparkle icons flying out on hover. Routes to
                /#pricing. */}
        <HeroEyebrow />

        {/* Title — display-xl, two lines. The accent span on
                "one link" carries the promise. */}
        <h1
          id="hero-title"
          className="t-display-xl"
          style={{
            // Smaller minimum + steeper vw rate so the headline
            // stops breaking into a 6-line column on phones.
            // Was clamp(48, 7vw, 96) → 380-px viewport gave 48 px
            // and the title piled up word-per-line. Now starts
            // at 34 px on phones (≈ 2-3 lines max) and still hits
            // 96 px on desktop. Negative letter-spacing tightens
            // the line breaks too.
            fontSize: "clamp(34px, 8.5vw, 96px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.04,
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

        {/* CTA — single primary. Theo: 'UN SEUL BUTTON'. The
                'See how it works' secondary was removed: the
                anchor still exists in the Topbar nav and the
                next section IS How it works, so the visitor
                lands on it by scrolling. */}
        <div className="flex items-center justify-center">
          <Link href="/auth?intent=signup">
            <Button size="lg" iconRight="arrow-right">
              Create your first server
            </Button>
          </Link>
        </div>

        {/* Hero demo video — autoplay muted loop of
                /Videos/LandinPage.mp4. 16:9 frame, rounded, hairline
                border, soft pop shadow + accent-glow halo to keep the
                same lighting language as the rest of the landing.
                The video starts the moment the page hydrates so the
                visitor lands on motion, not a still play disc. */}
        <div
          className="relative w-full"
          style={{
            maxWidth: 960,
            marginTop: 56,
            aspectRatio: "16 / 9",
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--border-2)",
            backgroundColor: "var(--bg-1)",
            boxShadow:
              "var(--shadow-pop), 0 0 60px -16px var(--accent-glow)",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src="/Videos/LandinPage.mp4"
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
