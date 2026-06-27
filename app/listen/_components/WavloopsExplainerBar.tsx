/**
 * WavloopsExplainerBar — thin top banner shown to artist-panel
 * visitors who landed via a producer's shared server link.
 *
 * Purpose: ~95% of /listen visitors are producers themselves (the
 * Hyppedit list, the producer-to-producer DM thread, etc.). They
 * came to listen but they ARE the conversion target. The banner
 * teases the platform without breaking the listen experience:
 *
 *     ℹ  New here? Discover what Wavloops is. [▶ Watch 20 sec]
 *
 * Click "Watch" → opens the WavloopsExplainerModal with the 20s
 * Loom/YouTube embed.
 *
 * NOT DISMISSIBLE BY DESIGN — we want every artist-panel visit to
 * surface the educational hook, especially during the Phase-1
 * Holy Spirit blast. The bar is light enough that staying put
 * doesn't break the listen UX, and it removes the "I closed it
 * once and now I can't find out what Wavloops is" friction.
 */

"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { WavloopsExplainerModal } from "./WavloopsExplainerModal";

export function WavloopsExplainerBar() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <div
        role="region"
        aria-label="What is Wavloops?"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "10px 18px",
          background:
            "linear-gradient(90deg, var(--accent-surface) 0%, color-mix(in oklch, var(--bg-1) 80%, var(--accent-text)) 100%)",
          borderBottom:
            "1px solid color-mix(in oklch, var(--accent-text) 25%, transparent)",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--fg-1)",
          flexWrap: "wrap",
          // Subtle inner glow so the bar feels like part of the
          // accent surface, not a plain coloured strip.
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 28px -10px var(--accent-glow)",
          // Don't compete with the topbar's backdrop blur; let the
          // bar's solid gradient win.
          position: "relative",
          zIndex: 21,
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "var(--r-sm)",
            background: "var(--accent)",
            color: "white",
            flexShrink: 0,
          }}
        >
          <Icon name="info" size={14} />
        </span>
        <span
          style={{
            color: "var(--fg-1)",
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          New here? Discover what Wavloops is.
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center"
          style={{
            gap: 6,
            padding: "6px 14px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent)",
            color: "white",
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: 12.5,
            fontWeight: 500,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Icon name="play" size={12} />
          Watch in 20 sec
        </button>
      </div>
      {modalOpen && (
        <WavloopsExplainerModal onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
