/**
 * ProducerExplainerBar — thin top banner shown on every producer
 * (app) page.
 *
 * Counterpart to the artist-side WavloopsExplainerBar. The artist
 * panel pushes producers to "switch to producer view"; this bar
 * picks them up on the producer side and walks them through how
 * Wavloops works via the 20-second video modal.
 *
 *     ℹ  New to Wavloops? Here's how it works. [▶ Watch 20 sec]
 *
 * Same modal as the artist side (WavloopsExplainerModal) — there's
 * no value in duplicating the explainer copy and the producer flow
 * benefits from the same TL;DR + Create-my-server CTA inside the
 * modal.
 *
 * NOT DISMISSIBLE BY DESIGN — same logic as the artist bar: the
 * Phase-1 distribution funnel needs the educational hook surfaced
 * at every page-view, especially for producers who just flipped
 * from the listen panel and haven't created their first server.
 */

"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { WavloopsExplainerModal } from "@/app/listen/_components/WavloopsExplainerModal";

export function ProducerExplainerBar() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <div
        role="region"
        aria-label="What is Wavloops?"
        className="wl-explainer-bar"
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
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 28px -10px var(--accent-glow)",
          position: "relative",
          zIndex: 26,
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
          New to Wavloops? Here&apos;s how it works.
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
