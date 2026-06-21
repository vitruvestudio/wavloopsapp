/**
 * Hero eyebrow — interactive announcement banner.
 *
 * Vercel-style 'Upgrade to Pro' pattern, ported to our DS:
 *   - Pill body in --accent-surface with a tinted --accent-text
 *     border, sized to a fixed 35-px height so it sits cleanly
 *     above the H1.
 *   - Underlined clickable copy on the left (the CTA) + a short
 *     description on the right (the why). Two halves of one
 *     sentence, split by visual treatment.
 *   - On hover, two Sparkles icons fly diagonally out of the
 *     pill (top-left and bottom-right) while spinning 360°.
 *     CSS transitions handle the choreography — no extra
 *     framer-motion dep.
 *   - Optional X dismiss button on the right that hides the
 *     banner for the rest of the session (component state, no
 *     localStorage).
 *
 * Defaults frame Wavloops' strongest current angle (the
 * Lifetime plan), but every text/href is overridable so the
 * eyebrow can be repurposed for launches, betas, or
 * sale windows later.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";

interface HeroEyebrowProps {
  buttonText?: string;
  description?: string;
  href?: string;
  /** Show an X dismiss button. Off by default. */
  dismissible?: boolean;
}

export function HeroEyebrow({
  buttonText = "Lifetime deal",
  description = "one payment, every feature, forever",
  href = "/#pricing",
  dismissible = false,
}: HeroEyebrowProps) {
  const [hovered, setHovered] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  // The two sparkle icons that fly out on hover. Same animation
  // shape, mirrored coordinates so one goes up-left and one
  // goes down-right.
  const sparkleStyle = (
    direction: "topLeft" | "bottomRight",
  ): React.CSSProperties => {
    const offset = 12;
    const tx = hovered ? (direction === "topLeft" ? -offset : offset) : 0;
    const ty = hovered ? (direction === "topLeft" ? -offset : offset) : 0;
    return {
      position: "absolute",
      pointerEvents: "none",
      color: "var(--accent-text)",
      filter: "drop-shadow(0 0 8px var(--accent-glow))",
      opacity: hovered ? 1 : 0,
      transform: `translate(${tx}px, ${ty}px) rotate(${hovered ? 360 : 0}deg)`,
      transition:
        "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out",
    };
  };

  return (
    <div
      className="relative inline-flex items-center"
      style={{ marginBottom: 28 }}
    >
      {/* Top-left sparkle */}
      <span aria-hidden="true" style={{ ...sparkleStyle("topLeft"), left: 4, top: 2 }}>
        <Sparkles size={14} />
      </span>
      {/* Bottom-right sparkle */}
      <span
        aria-hidden="true"
        style={{ ...sparkleStyle("bottomRight"), right: 4, bottom: 2 }}
      >
        <Sparkles size={14} />
      </span>

      {/* Pill body — fixed 35-px height on desktop, but on
              mobile the description hides via .hidden + sm:inline
              so the pill stays a single-line CTA chip. */}
      <div
        className="inline-flex items-center flex-nowrap"
        style={{
          height: 35,
          gap: 8,
          padding: dismissible ? "0 4px 0 14px" : "0 14px",
          borderRadius: "var(--r-pill)",
          background: "var(--accent-surface)",
          border:
            "1px solid color-mix(in oklch, var(--accent-text) 22%, transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
        }}
      >
        <Link
          href={href}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            color: hovered ? "var(--accent-text)" : "var(--fg-1)",
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            textDecoration: "underline",
            textDecorationColor: hovered
              ? "var(--accent-text)"
              : "color-mix(in oklch, var(--accent-text) 35%, transparent)",
            textUnderlineOffset: 5,
            transition:
              "color 0.15s var(--ease), text-decoration-color 0.15s var(--ease)",
            whiteSpace: "nowrap",
          }}
        >
          {buttonText}
        </Link>

        {/* Description hidden on phones — pill stays compact.
                Visible from sm (≥ 640 px) on. */}
        <span
          className="hidden sm:inline"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            letterSpacing: "0.04em",
            color: "var(--accent-text)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {description}
        </span>

        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss announcement"
            className="flex items-center justify-center shrink-0"
            style={{
              width: 24,
              height: 24,
              borderRadius: "var(--r-sm)",
              background: "transparent",
              border: "none",
              color: "var(--accent-text)",
              cursor: "pointer",
              transition: "background 0.15s var(--ease)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "color-mix(in oklch, var(--accent-text) 18%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
