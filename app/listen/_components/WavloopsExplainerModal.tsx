/**
 * WavloopsExplainerModal — 3-step "how it works" pop-up for
 * first-time producer-panel visitors.
 *
 * Triggered by the "Watch in 20 sec" button on the
 * ProducerExplainerBar (the producer-side counterpart of the
 * artist gate's nudge). The previous version embedded a 20-second
 * Loom; Theo's call is that scannable text + a clear CTA outperforms
 * a video for this specific moment — the visitor came to listen,
 * just flipped to producer view, and wants a "what's next", not
 * a "what is this".
 *
 * Three cards walk through the producer flow end-to-end:
 *   1. Create your server     — name + vibe
 *   2. Drop your beats        — drag/drop, auto-detect BPM/key/loudness
 *   3. Share one link         — invite artists, every future drop forever
 *
 * Single primary CTA: "Start free" wired to /auth?intent=signup
 * with utm_source=explainer_modal so we can attribute new producer
 * signups straight back to this surface.
 *
 * Modal a11y:
 *   - role="dialog" + aria-modal
 *   - Escape closes
 *   - Click on backdrop closes
 *   - Body scroll locked while open (consistent with the rest of
 *     the app's modal pattern)
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
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: "upload",
    title: "Upload your beats",
    body: "Drag & drop. Wavloops auto-detects BPM, key and loudness so you never tag manually again.",
  },
  {
    number: "02",
    icon: "library",
    title: "Create your server",
    body: "Bundle your beats into one living link. Name it, set the vibe — 30 seconds, no card needed.",
  },
  {
    number: "03",
    icon: "heart",
    title: "See who's vibing",
    body: "Per-artist play tracking + likes. Know exactly who's into what, when, and how many times.",
  },
];

export function WavloopsExplainerModal({ onClose }: Props) {
  // Esc closes.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open.
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
          maxWidth: 580,
          background: "var(--bg-1)",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border-1)",
          overflow: "hidden",
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
            padding: "clamp(26px, 4vw, 36px) clamp(24px, 4vw, 36px) 28px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
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
                fontSize: "clamp(22px, 3.4vw, 28px)",
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
                  paragraph of text. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {STEPS.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>

          {/* CTA stack — primary Start-free + a softer "skip" so the
                  modal doesn't feel like a dead end if the visitor
                  isn't ready. */}
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

/** Numbered step card. Keeps the markup local to this file because
 *  it's only used here and is small enough not to warrant its own
 *  module. */
function StepCard({ step }: { step: Step }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "14px 16px",
        borderRadius: "var(--r-lg)",
        background:
          "color-mix(in oklch, var(--bg-inset) 70%, transparent)",
        border: "1px solid var(--border-1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <div
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: "var(--r-md)",
          background: "var(--accent-surface)",
          border:
            "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)",
          color: "var(--accent-text)",
        }}
      >
        <Icon name={step.icon} size={18} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
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
      </div>
    </div>
  );
}
