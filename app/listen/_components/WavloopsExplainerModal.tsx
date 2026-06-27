/**
 * WavloopsExplainerModal — 20-second video pop-up that explains
 * what Wavloops is to first-time listen-page visitors.
 *
 * Triggered by the "Watch in 20 sec" button on the
 * WavloopsExplainerBar.
 *
 * Video source: edit EXPLAINER_VIDEO_URL below to point at the
 * final Loom / YouTube embed once Theo records it. The current
 * value is a placeholder Loom-embed-shape URL that 404s
 * deliberately — the modal shows a nice "video coming soon"
 * fallback when the iframe fails to load, so we can ship the
 * surface before the video is final.
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
import { Icon } from "@/components/ui/Icon";

/** Final video embed URL.
 *  - YouTube: https://www.youtube.com/embed/<videoId>?rel=0
 *  - Loom:    https://www.loom.com/embed/<videoId>
 *  Leave as null until the recording is up; the modal renders the
 *  "video coming soon" fallback gracefully. */
const EXPLAINER_VIDEO_URL: string | null = null;

interface Props {
  onClose: () => void;
}

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
      aria-label="What is Wavloops?"
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
          maxWidth: 720,
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
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "white",
            borderRadius: "var(--r-pill)",
            cursor: "pointer",
            zIndex: 2,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <Icon name="close" size={16} />
        </button>

        {/* Video frame — 16:9 aspect-ratio so the iframe (or
                fallback) lands at the right size on every viewport. */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "var(--bg-inset)",
            position: "relative",
          }}
        >
          {EXPLAINER_VIDEO_URL ? (
            <iframe
              src={EXPLAINER_VIDEO_URL}
              title="Wavloops in 20 seconds"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          ) : (
            <ComingSoonFallback />
          )}
        </div>

        {/* Copy + CTA stack — same TL;DR producers will see in the
                marketing emails, so the message is consistent
                end-to-end. */}
        <div
          style={{
            padding: "22px 24px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h2
            className="t-display"
            style={{
              fontSize: 22,
              lineHeight: 1.2,
              letterSpacing: "-0.018em",
              color: "var(--fg-1)",
            }}
          >
            Wavloops in 20 seconds.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              margin: 0,
            }}
          >
            Tired of WeTransfer links dying in 7 days?{" "}
            <strong style={{ color: "var(--fg-1)" }}>
              One living server per project
            </strong>
            . Join once, get every future drop forever. Producers ship one link
            and never re-upload again.
          </p>
          <div
            className="flex items-center flex-wrap"
            style={{ gap: 10, marginTop: 4 }}
          >
            <Link
              href="/auth?intent=signup&utm_source=explainer_modal"
              onClick={onClose}
              className="inline-flex items-center"
              style={{
                gap: 8,
                padding: "10px 18px",
                borderRadius: "var(--r-pill)",
                background: "var(--accent)",
                color: "white",
                textDecoration: "none",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Create my server →
            </Link>
            <Link
              href="/"
              onClick={onClose}
              style={{
                padding: "10px 14px",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--fg-3)",
                textDecoration: "none",
              }}
            >
              See the landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Friendly placeholder shown while the explainer video URL is
 *  still null. Avoids breaking the surface before Theo records the
 *  Loom — the modal still feels intentional, not broken. */
function ComingSoonFallback() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        color: "var(--fg-3)",
        fontFamily: "var(--font-body)",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--r-pill)",
          background: "var(--accent-surface)",
          border:
            "1px solid color-mix(in oklch, var(--accent-text) 40%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-text)",
        }}
      >
        <Icon name="play" size={22} />
      </div>
      <div style={{ fontSize: 14, color: "var(--fg-2)" }}>
        Video dropping shortly — read on for the TL;DR.
      </div>
    </div>
  );
}
