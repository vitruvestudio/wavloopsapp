/**
 * WavloopsExplainerBar — thin top banner shown on every artist-
 * panel page (/listen and children).
 *
 * Strategy: ~95% of visitors here came via a producer's shared
 * server link (the Hyppedit blast for Holy Spirit, producer-to-
 * producer DMs, etc.) and ARE producers themselves. They came to
 * listen, but they're the conversion target.
 *
 * The bar nudges them to flip to the producer surface — where a
 * sibling explainer bar walks them through how Wavloops works. We
 * keep this side dead simple: one line, one CTA, direct link, no
 * modal. The educational content lives on the producer side so
 * the user has a clear forward motion ("listen → curious → switch
 * to producer view → understand → create my server") instead of a
 * dead-end pop-up that closes back onto the listen page.
 *
 * NOT DISMISSIBLE BY DESIGN — every visit re-surfaces the hook.
 * The bar is light enough that staying put doesn't break the
 * listen UX.
 *
 * Link target: /onboarding is the canonical entry to become a
 * producer. The wizard checks for an existing producer profile;
 * if the visitor is already onboarded, the route then forwards
 * to /dashboard. So we don't need to branch on profile state
 * from here — server-side routing does the right thing.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function WavloopsExplainerBar() {
  return (
    <div
      role="region"
      aria-label="Want to create your own server?"
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
        <Icon name="library" size={14} />
      </span>
      <span
        style={{
          color: "var(--fg-1)",
          fontWeight: 500,
          letterSpacing: "-0.005em",
        }}
      >
        Want to create your own server?{" "}
        <span style={{ color: "var(--accent-text)", fontWeight: 600 }}>
          Start for free.
        </span>
      </span>
      <Link
        href="/onboarding?utm_source=listen_to_producer"
        className="inline-flex items-center"
        style={{
          gap: 6,
          padding: "6px 14px",
          borderRadius: "var(--r-pill)",
          background: "var(--accent)",
          color: "white",
          textDecoration: "none",
          fontFamily: "var(--font-body)",
          fontSize: 12.5,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        Switch to producer panel
        <Icon name="arrow-right" size={12} />
      </Link>
    </div>
  );
}
