/**
 * WavloopsExplainerBar — thin top banner shown to artist-panel
 * visitors who landed via a producer's shared server link.
 *
 * Purpose: ~95% of /listen visitors are producers themselves (the
 * Hyppedit list, the producer-to-producer DM thread, etc.). They
 * came to listen but they ARE the conversion target. The banner
 * teases the platform without breaking the listen experience:
 *
 *     ℹ️  New here? Discover what Wavloops is. [▶ Watch 20 sec] [×]
 *
 * Click "Watch" → opens the WavloopsExplainerModal with the 20s
 * Loom/YouTube embed. Click × → bar disappears + a dismiss cookie
 * keeps it gone for 7 days (per-browser, so the visitor isn't
 * pinged every page-view on this device).
 *
 * The bar mounts ABOVE the ArtistTopbar so it's the first visual
 * cue on the page without intruding on the player/listen UI. On
 * the second visit (cookie present), the bar renders nothing and
 * the layout collapses back to its baseline height.
 *
 * Cookie note: we deliberately read on mount with a state lift
 * AFTER the first paint to avoid hydration mismatch — the server
 * renders the bar visible, the client decides whether to hide it
 * once it's read the cookie. The flash is minimal (<50ms) and
 * cheaper than the alternative of skipping SSR entirely.
 */

"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { WavloopsExplainerModal } from "./WavloopsExplainerModal";

const DISMISS_COOKIE = "wlp_explainer_dismissed";
const DISMISS_TTL_DAYS = 7;

function readDismissCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${DISMISS_COOKIE}=`));
}

function writeDismissCookie(): void {
  if (typeof document === "undefined") return;
  const maxAge = DISMISS_TTL_DAYS * 24 * 60 * 60;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${DISMISS_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function WavloopsExplainerBar() {
  // `hidden` starts false so the SSR render shows the bar. The
  // useEffect below reads the cookie on the client and may flip it
  // to true — the flash is minimal and avoids hydration mismatch.
  const [hidden, setHidden] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (readDismissCookie()) setHidden(true);
  }, []);

  if (hidden) return null;

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
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            writeDismissCookie();
            setHidden(true);
          }}
          style={{
            marginLeft: 4,
            width: 26,
            height: 26,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: "var(--fg-3)",
            cursor: "pointer",
            borderRadius: "var(--r-sm)",
            flexShrink: 0,
          }}
        >
          <Icon name="close" size={14} />
        </button>
      </div>
      {modalOpen && (
        <WavloopsExplainerModal onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
