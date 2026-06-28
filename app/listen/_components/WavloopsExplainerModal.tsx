/**
 * WavloopsExplainerModal — 3-step "how it works" pop-up.
 *
 * Triggered by the "See it in 3 steps" CTA on the
 * ProducerExplainerBar. Three numbered cards walk through the
 * producer flow end-to-end:
 *
 *   01  Upload your beats  — drag/drop, auto BPM/key/loudness
 *   02  Create your server — bundle into one living link
 *   03  See who's vibing   — per-artist tracking + likes
 *
 * Each card now carries an optional inline preview video (small
 * 16:9 thumbnail that autoplays muted on loop). The video paths
 * are the same MP4s that live on the landing's HowItWorks
 * section, so the modal mirrors the marketing visuals end-to-end
 * — the producer sees the same screen-recording vocabulary
 * whether they entered through the landing or this modal.
 *
 * Single primary CTA: "Start free" wired to /auth?intent=signup
 * with utm_source=explainer_modal so we can attribute new
 * producer signups straight back to this surface.
 *
 * Modal a11y:
 *   - role="dialog" + aria-modal
 *   - Escape closes
 *   - Click on backdrop closes
 *   - Body scroll locked while open
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

interface Props {
  onClose: () => void;
}

interface Step {
  number: string;
  icon: IconName;
  title: string;
  body: string;
  /** Optional /public path to a short MP4 that previews the step.
   *  When absent, the card falls back to just the icon badge. */
  video?: string;
  /** Optional short feature tags rendered as chips below the body.
   *  Keeps the body sentence short while still letting a step
   *  showcase several sub-features. */
  chips?: string[];
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: "upload",
    title: "Upload your beats",
    body: "Drag & drop. Wavloops auto-detects BPM, key and loudness so you never tag manually again.",
    // Video to come — leave the icon badge as the visual until a
    // matching screen-recording is added.
  },
  {
    number: "02",
    icon: "library",
    title: "Create your server",
    body: "Bundle your beats into one living link, add manual contacts, choose between a Private server or a Public server, then share the link to grow your audience.",
    video: "/Videos/Wavloops_1.mp4",
  },
  {
    number: "03",
    icon: "heart",
    title: "See who's vibing",
    body: "Per-artist play tracking + likes. Know exactly who's into what, when, and how many times.",
    video: "/Videos/Wavloops_3.mp4",
  },
];

export function WavloopsExplainerModal({ onClose }: Props) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How Wavloops works"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 760,
          maxHeight: "90dvh",
          overflowY: "auto",
          background: "var(--bg-1)",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border-1)",
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.5), 0 0 60px -20px var(--accent-glow)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Soft accent halo behind the header — same vocab as the
                hero, ties the modal to the brand surface. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, var(--accent-glow) 0%, transparent 60%)",
            opacity: 0.45,
            pointerEvents: "none",
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            color: "var(--fg-2)",
            borderRadius: "var(--r-pill)",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <Icon name="close" size={14} />
        </button>

        <div
          style={{
            position: "relative",
            padding: "clamp(28px, 4vw, 40px) clamp(24px, 4vw, 40px) 32px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <span
              className="t-mono"
              style={{
                color: "var(--accent-text)",
                letterSpacing: "0.12em",
              }}
            >
              WAVLOOPS · IN 3 STEPS
            </span>
            <h2
              className="t-display"
              style={{
                fontSize: "clamp(24px, 3.6vw, 32px)",
                lineHeight: 1.15,
                letterSpacing: "-0.018em",
                color: "var(--fg-1)",
              }}
            >
              Here&apos;s how Wavloops works.
            </h2>
          </div>

          {/* Steps stack — each is a self-contained card so the
                  three blocks read as a numbered checklist, not a
                  paragraph of text. Cards with a `video` prop render
                  a small autoplay preview on the left; the others
                  fall back to the icon-only badge. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {STEPS.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>

          {/* CTA stack — primary Start-free + the reassurance line. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 4,
            }}
          >
            <Link
              href="/auth?intent=signup&utm_source=explainer_modal"
              onClick={onClose}
              className="inline-flex items-center"
              style={{
                gap: 8,
                padding: "12px 22px",
                borderRadius: "var(--r-pill)",
                background: "var(--accent)",
                color: "white",
                textDecoration: "none",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 14,
                boxShadow:
                  "0 0 24px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              Start free →
            </Link>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12.5,
                color: "var(--fg-3)",
              }}
            >
              $0 forever · no card needed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Numbered step card. Renders a small 16:9 video preview on the
 *  left when the step carries one, otherwise an icon-only badge. */
function StepCard({ step }: { step: Step }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: 14,
        borderRadius: "var(--r-lg)",
        background:
          "color-mix(in oklch, var(--bg-inset) 70%, transparent)",
        border: "1px solid var(--border-1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        alignItems: "flex-start",
      }}
    >
      {step.video ? (
        <StepVideoThumb src={step.video} />
      ) : (
        <StepIconBadge icon={step.icon} />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 0,
          paddingTop: step.video ? 2 : 0,
          flex: 1,
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            className="t-mono"
            style={{
              color: "var(--accent-text)",
              fontSize: 11,
              letterSpacing: "0.12em",
            }}
          >
            {step.number}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--fg-1)",
              letterSpacing: "-0.01em",
            }}
          >
            {step.title}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-body)",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "var(--fg-2)",
          }}
        >
          {step.body}
        </p>
        {step.chips && step.chips.length > 0 && (
          <div
            className="flex items-center flex-wrap"
            style={{ gap: 6, marginTop: 8 }}
          >
            {step.chips.map((chip) => (
              <span
                key={chip}
                className="t-mono"
                style={{
                  padding: "3px 8px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--accent-surface)",
                  border:
                    "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)",
                  color: "var(--accent-text)",
                  fontSize: 10.5,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Small 16:9 autoplay preview. Muted + playsInline + loop so it
 *  loops silently regardless of browser autoplay policy. preload
 *  is "metadata" so the modal doesn't drag the full MP4 down at
 *  page load — only when the user actually opens it. */
function StepVideoThumb({ src }: { src: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 180,
        aspectRatio: "16 / 9",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        border: "1px solid var(--border-2)",
        background: "var(--bg-inset)",
        boxShadow:
          "0 12px 30px -16px rgba(0,0,0,0.6), 0 0 0 1px color-mix(in oklch, var(--accent-text) 18%, transparent)",
      }}
    >
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}

function StepIconBadge({ icon }: { icon: IconName }) {
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: 180,
        aspectRatio: "16 / 9",
        borderRadius: "var(--r-md)",
        background: "var(--accent-surface)",
        border:
          "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)",
        color: "var(--accent-text)",
      }}
    >
      <Icon name={icon} size={32} />
    </div>
  );
}
