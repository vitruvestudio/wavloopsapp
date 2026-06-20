/**
 * Landing — Section 02. Node network (v4).
 *
 * Theo's note that drove this rewrite: "I can't go to market
 * with what we had — the side-by-side scene was still SaaS-
 * template at the bottom. Let's tell the story with a node
 * graph: many chaotic tools on the left, all converging onto
 * the Wavloops hub, then a single wire going OUT to the one
 * useful server." That visual asymmetry IS the value prop —
 * many in, one out — and reading it requires no copy at all.
 *
 * Anatomy
 * ───────
 *   ┌─ Editorial header ─────────────────────────────────────┐
 *   │ 02 ─── OUR PROMISE                                    │
 *   │ The beat-sending headache ENDS HERE.                   │
 *   │ <producer verbatim — accent left-bar>                  │
 *   └────────────────────────────────────────────────────────┘
 *   ┌─ Glass container ──────────────────────────────────────┐
 *   │                                                        │
 *   │   ◯ Gmail                                              │
 *   │   ◯ Instagram                          ┌──────────┐    │
 *   │   ◯ WhatsApp ────►───►◐ Wavloops ─►─► │ your.    │    │
 *   │   ◯ Discord                            │ server   │    │
 *   │   ◯ WeTransfer                         └──────────┘    │
 *   │                                                        │
 *   └────────────────────────────────────────────────────────┘
 *
 * Implementation notes
 * ────────────────────
 * - 5 incoming SVG wires + 1 outgoing wire, all rendered TWICE:
 *   once as a faint static "wire" (background layer, gradient
 *   stops fade in/out toward the endpoints so they vanish into
 *   the canvas), and once as an "animated noodle" — same path,
 *   stroke-dasharray + wl-noodle-flow keyframe, per-path delays
 *   to desync the beams.
 * - Junction dots sit at the hub's in/out edges (where all the
 *   wires meet), wl-pulse-dot in accent-text.
 * - The hub is a circular glass disc with two counter-rotating
 *   conic-gradient masks creating a soft "search beam" sweep,
 *   plus a giant ambient radial-glow behind it.
 * - The right card uses the same DS tokens as the in-app
 *   server detail surface (cover with mini equalizer + LIVE
 *   pill) so the destination reads as a real product surface.
 */

"use client";

import * as React from "react";
import { Logomark } from "@/components/ui/Logo";

export function LandingProblem() {
  return (
    <section
      id="problem"
      aria-labelledby="problem-title"
      className="relative"
      style={{
        paddingTop: 120,
        paddingBottom: 120,
        backgroundColor: "var(--bg-0)",
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1200, padding: "0 24px" }}
      >
        {/* ─── Editorial header ─── */}
        <SectionHeader />

        {/* ─── Glass container with the node network ─── */}
        <div
          className="relative overflow-hidden"
          style={{
            marginTop: 56,
            padding: "40px 28px",
            borderRadius: 28,
            background:
              "linear-gradient(135deg, color-mix(in oklch, var(--bg-2) 80%, transparent) 0%, var(--bg-1) 100%)",
            border: "1px solid var(--border-1)",
            boxShadow:
              "0 40px 100px -40px oklch(0 0 0 / 0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Soft ambient brand glow behind the hub area —
                  paints the canvas with a warm accent halo
                  centered on where the hub will render. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 40% 50% at 50% 50%, var(--accent-glow) 0%, transparent 70%)",
              opacity: 0.35,
            }}
          />

          <NodeNetwork />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Editorial section header (02 ─ OUR PROMISE / title / quote)
   ============================================================ */

function SectionHeader() {
  return (
    <div className="flex flex-col" style={{ gap: 28 }}>
      {/* Number + label row with a hairline divider — gives the
              section the editorial feel the reference design has,
              without changing Theo's existing copy. */}
      <div className="flex items-center" style={{ gap: 18 }}>
        <span
          className="t-mono"
          style={{ color: "var(--accent-text)" }}
        >
          02
        </span>
        <span
          aria-hidden="true"
          style={{
            height: 1,
            flex: 1,
            background: "var(--border-1)",
          }}
        />
        <span
          className="t-mono"
          style={{ color: "var(--fg-3)" }}
        >
          Our promise
        </span>
      </div>

      <h2
        id="problem-title"
        className="t-display"
        style={{
          fontSize: "clamp(36px, 4.4vw, 56px)",
          lineHeight: 1.04,
          maxWidth: 880,
        }}
      >
        The beat-sending headache{" "}
        <span
          style={{
            color: "var(--accent-text)",
            textShadow: "0 0 32px var(--accent-glow)",
          }}
        >
          ends here
        </span>
        .
      </h2>

      <figure style={{ maxWidth: 720 }}>
        <blockquote
          className="t-body-l"
          style={{
            fontSize: 20,
            lineHeight: 1.55,
            fontStyle: "italic",
            color: "var(--fg-1)",
            paddingLeft: 22,
            borderLeft: "2px solid var(--accent-text)",
          }}
        >
          &ldquo;Organizing contacts and keeping track of who I already sent
          stuff to is a huge headache. It takes too much time away from
          actually producing.&rdquo;
        </blockquote>
        <figcaption
          className="t-mono"
          style={{
            marginTop: 14,
            color: "var(--fg-3)",
            paddingLeft: 22,
          }}
        >
          — a producer
        </figcaption>
      </figure>
    </div>
  );
}

/* ============================================================
   Node network — SVG wires + HTML node layer
   ============================================================ */

/**
 * SVG viewBox is 1000 × 600. HTML nodes get positioned in
 * absolute units that line up with the SVG coordinate system
 * by using percent translations on a relative container, so the
 * graph scales together at any container width.
 *
 * Coordinate map (viewBox-space):
 *   Hub centre     → (500, 300)
 *   Hub left edge  → (435, 300)
 *   Hub right edge → (565, 300)
 *   Left node X    → 140 (column centre)
 *   Right card X   → 820
 *   Left Y stops   → 90, 195, 300, 405, 510
 */

const LEFT_NODES = [
  { brand: "gmail", y: 90 },
  { brand: "instagram", y: 195 },
  { brand: "whatsapp", y: 300 },
  { brand: "discord", y: 405 },
  { brand: "wetransfer", y: 510 },
] as const;

function NodeNetwork() {
  return (
    <div
      className="relative"
      style={{
        width: "100%",
        aspectRatio: "1000 / 600",
        minHeight: 380,
      }}
    >
      {/* ───── SVG layer — wires + animated noodles ───── */}
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          {/* Faint wire gradient — fades in at the endpoints so
                  the wires don't bluntly hit the node edges. */}
          <linearGradient id="wl-wire" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.10" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Noodle gradient — bright at centre, transparent at
                  edges, so the lit segment fades smoothly. Uses the
                  Wavloops accent indigo. */}
          <linearGradient id="wl-noodle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c7aff" stopOpacity="0" />
            <stop offset="50%" stopColor="#a8a5ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c7aff" stopOpacity="0" />
          </linearGradient>

          <filter id="wl-wire-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="wl-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background static wires — 5 from left, 1 going right */}
        {WIRES.map((w, i) => (
          <path
            key={`wire-${i}`}
            d={w.d}
            stroke="url(#wl-wire)"
            strokeWidth={1.6}
            fill="none"
            filter="url(#wl-wire-glow)"
          />
        ))}

        {/* Animated noodles — same paths, dashed + flowing */}
        {WIRES.map((w, i) => (
          <path
            key={`noodle-${i}`}
            d={w.d}
            stroke="url(#wl-noodle)"
            strokeWidth={2.2}
            fill="none"
            filter="url(#wl-wire-glow)"
            style={{
              strokeDasharray: "60 940",
              animation: `wl-noodle-flow ${w.duration}s linear infinite`,
              animationDelay: `${w.delay}s`,
            }}
          />
        ))}

        {/* Junction dots — hub in/out points, breathe in accent */}
        <circle
          cx={435}
          cy={300}
          r={4}
          fill="var(--accent-text)"
          filter="url(#wl-dot-glow)"
        />
        <circle
          cx={565}
          cy={300}
          r={4}
          fill="var(--accent-text)"
          filter="url(#wl-dot-glow)"
        />
      </svg>

      {/* ───── HTML node layer — sits ABOVE the SVG ───── */}
      <div className="absolute inset-0">
        {/* Left brand nodes — absolute-positioned by viewBox y */}
        {LEFT_NODES.map((n) => (
          <BrandNode key={n.brand} brand={n.brand} y={n.y} />
        ))}

        {/* Centre hub */}
        <Hub />

        {/* Right card — single destination */}
        <RightCard />
      </div>
    </div>
  );
}

/**
 * Wire paths (viewBox-space). Each starts at a left node's
 * approximate right edge (~190, y) and curves toward the hub's
 * left edge (435, 300). Outgoing wire is a single straight
 * line from the hub's right edge to the right card.
 *
 * Path durations + delays are tuned by hand: incoming wires
 * stagger 0 → 1s so the eye reads "many flows" instead of "one
 * synchronised pulse". Outgoing wire uses the longest delay so
 * it fires last, giving the visual reading order in → hub →
 * out.
 */
const WIRES = [
  // Incoming — top to bottom
  { d: "M 190 90  C 280 90,  380 300, 435 300", duration: 3.2, delay: 0.0 },
  { d: "M 190 195 C 280 195, 380 300, 435 300", duration: 3.0, delay: 0.4 },
  { d: "M 190 300 L 435 300",                    duration: 2.6, delay: 0.8 },
  { d: "M 190 405 C 280 405, 380 300, 435 300", duration: 3.0, delay: 1.2 },
  { d: "M 190 510 C 280 510, 380 300, 435 300", duration: 3.2, delay: 1.6 },
  // Outgoing — single beam to right card
  { d: "M 565 300 L 760 300", duration: 2.4, delay: 2.0 },
] as const;

/* ============================================================
   Brand nodes (left column)
   ============================================================ */

const BRAND_META = {
  gmail: {
    label: "Gmail",
    color: "#EA4335",
    bg: "#FFFFFF",
    icon: GmailLogo,
  },
  instagram: {
    label: "Instagram",
    color: "#FFFFFF",
    bg: "linear-gradient(135deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)",
    icon: InstagramLogo,
  },
  whatsapp: {
    label: "WhatsApp",
    color: "#FFFFFF",
    bg: "#25D366",
    icon: WhatsappLogo,
  },
  discord: {
    label: "Discord",
    color: "#FFFFFF",
    bg: "#5865F2",
    icon: DiscordLogo,
  },
  wetransfer: {
    label: "WeTransfer",
    color: "#FFFFFF",
    bg: "#406AFF",
    icon: WetransferLogo,
  },
} as const;

function BrandNode({
  brand,
  y,
}: {
  brand: keyof typeof BRAND_META;
  y: number;
}) {
  const meta = BRAND_META[brand];
  const Icon = meta.icon;
  return (
    <div
      className="absolute"
      style={{
        // Position centre on the SVG node centre (140, y) in
        // viewBox 1000×600. As percentages of the container.
        left: `${(140 / 1000) * 100}%`,
        top: `${(y / 600) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="relative group"
        style={{
          width: 72,
          height: 72,
          borderRadius: "var(--r-pill)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            "0 20px 40px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner brand tile holding the real logo */}
        <span
          className="flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--r-md)",
            background: meta.bg,
            color: meta.color,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <Icon size={22} />
        </span>

        {/* Hover halo in the brand's color — picked up below as
                a colored radial behind the circle. */}
      </div>
    </div>
  );
}

/* ============================================================
   Centre hub — Wavloops mark with rotating beams + glow
   ============================================================ */

function Hub() {
  return (
    <div
      className="absolute"
      style={{
        left: `${(500 / 1000) * 100}%`,
        top: `${(300 / 600) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="relative" style={{ width: 132, height: 132 }}>
        {/* Ambient outer glow — large blurred halo */}
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            inset: -50,
            borderRadius: "var(--r-pill)",
            background:
              "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
            opacity: 0.55,
            filter: "blur(8px)",
          }}
        />

        {/* Rotating conic beam — 270° transparent + 90° accent,
                masked into a ring. Spins slowly. */}
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            inset: -20,
            borderRadius: "var(--r-pill)",
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 240deg, color-mix(in oklch, var(--accent-text) 65%, transparent) 360deg)",
            maskImage: "radial-gradient(transparent 56%, black 60%)",
            WebkitMaskImage: "radial-gradient(transparent 56%, black 60%)",
            animation: "wl-spin 8s linear infinite",
            opacity: 0.7,
          }}
        />
        {/* Counter-rotating beam — different color stop, slower */}
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            inset: -10,
            borderRadius: "var(--r-pill)",
            background:
              "conic-gradient(from 180deg, transparent 0deg, transparent 250deg, var(--accent) 360deg)",
            maskImage: "radial-gradient(transparent 56%, black 60%)",
            WebkitMaskImage: "radial-gradient(transparent 56%, black 60%)",
            animation: "wl-spin 14s linear infinite reverse",
            opacity: 0.45,
          }}
        />

        {/* Glass core — Wavloops Logomark in accent */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            borderRadius: "var(--r-pill)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 40px 100px -40px var(--accent-glow), inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Inner ring */}
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              inset: 10,
              borderRadius: "var(--r-pill)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          {/* Mark — bigger than usual, accent-tinted */}
          <span
            style={{
              color: "var(--accent-text)",
              filter:
                "drop-shadow(0 0 24px color-mix(in oklch, var(--accent-text) 80%, transparent))",
              display: "flex",
            }}
          >
            <Logomark size={56} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Right card — single destination ("your server")
   ============================================================ */

function RightCard() {
  return (
    <div
      className="absolute"
      style={{
        left: `${(820 / 1000) * 100}%`,
        top: `${(300 / 600) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="relative"
        style={{
          width: 280,
          background:
            "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
          border:
            "1px solid color-mix(in oklch, var(--accent-text) 28%, transparent)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          boxShadow:
            "0 30px 60px -20px oklch(0 0 0 / 0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        {/* Soft top brand halo — picks up where the wire enters */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 0% 50%, var(--accent-glow) 0%, transparent 65%)",
            opacity: 0.5,
          }}
        />

        {/* URL pill at top */}
        <div
          className="flex items-center"
          style={{
            padding: "10px 14px",
            gap: 8,
            borderBottom: "1px solid var(--border-1)",
            background: "var(--bg-1)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <span
            className="t-mono"
            style={{
              color: "var(--fg-3)",
              background: "var(--bg-0)",
              border: "1px solid var(--border-1)",
              padding: "3px 10px",
              borderRadius: "var(--r-pill)",
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            wavloops.co/s/your-server
          </span>
        </div>

        {/* Card body — cover + title + status */}
        <div
          className="relative"
          style={{
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            zIndex: 2,
          }}
        >
          <ServerCoverEq />
          <div className="min-w-0 flex-1">
            <div className="t-title" style={{ fontSize: 14 }}>
              Your beat server
            </div>
            <div
              className="flex items-center"
              style={{ gap: 6, marginTop: 6 }}
            >
              <span
                className="inline-flex items-center t-mono"
                style={{
                  gap: 5,
                  padding: "3px 8px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--ok-surface)",
                  color: "var(--ok)",
                  fontSize: 9,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "var(--r-pill)",
                    background: "var(--ok)",
                    ["--wl-pulse-color" as string]: "var(--ok)",
                    animation: "wl-pulse-dot 1.6s ease-out infinite",
                  }}
                />
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Footer caption */}
        <div
          className="t-mono"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "10px 18px 16px",
            color: "var(--fg-4)",
            fontSize: 10,
          }}
        >
          ONE LINK · UPDATES ITSELF
        </div>
      </div>
    </div>
  );
}

function ServerCoverEq() {
  const BARS = 5;
  return (
    <div
      className="relative flex items-end justify-center shrink-0"
      style={{
        width: 56,
        height: 56,
        borderRadius: "var(--r-md)",
        background:
          "linear-gradient(135deg, var(--accent) 0%, oklch(0.42 0.16 268) 100%)",
        boxShadow:
          "0 12px 32px -12px var(--accent-glow), inset 0 0 0 1px rgba(255,255,255,0.08)",
        padding: "12px 10px",
        gap: 3,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 3.5,
            height: "100%",
            background: "rgba(255,255,255,0.92)",
            borderRadius: 2,
            transformOrigin: "bottom",
            animation: "wl-eq-bar 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   Brand SVG icons (inline)
   ============================================================ */

function GmailLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}

function InstagramLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function WhatsappLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.885 3.488" />
    </svg>
  );
}

function DiscordLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function WetransferLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0 6.75A.74.74 0 0 1 .73 6h2.49a.73.73 0 0 1 .71.55l1.69 7.05L7.7 6.55a.74.74 0 0 1 .74-.55h2.42a.75.75 0 0 1 .74.55l2.08 7.05 1.71-7.05a.74.74 0 0 1 .73-.55h2.46a.74.74 0 0 1 .73.9l-3 11.81a.75.75 0 0 1-.73.55h-2.7a.74.74 0 0 1-.73-.54l-1.69-6.21-1.78 6.21a.74.74 0 0 1-.73.54h-2.7a.74.74 0 0 1-.73-.55L0 6.93a.75.75 0 0 1 0-.18zm23 6.41A1 1 0 1 0 24 14.16a1 1 0 0 0-1-1zm0 3.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1z" />
    </svg>
  );
}
