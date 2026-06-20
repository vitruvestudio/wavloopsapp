/**
 * Landing — Section 02. Node network (v5).
 *
 * v4 read as 'apps plugged INTO Wavloops' because the brand
 * circles floated free on a neutral glass canvas — the eye saw
 * 'integrations' instead of 'pain'. Theo's fix: 'two distinct
 * cards. Left card = the old way (chaos rows). Right card =
 * the new way (your Wavloops server). The Wavloops mark sits in
 * the middle as the bridge between the two worlds'.
 *
 * Anatomy
 * ───────
 *   ┌─ 02 ─── OUR PROMISE ────────────────────────────────────┐
 *   │ The beat-sending headache ENDS HERE.                    │
 *   │ <producer verbatim — accent left-bar>                   │
 *   └─────────────────────────────────────────────────────────┘
 *
 *   ┌─ The old way ─────── CHAOS ┐         ┌─ Atlanta Nights ────────┐
 *   │ ✉  WeTransfer link    •    │  ╲      │ ▣ Atlanta Nights        │
 *   │    GMAIL · EXPIRED         │   ╲     │   4 BEATS · 12 ARTISTS  │
 *   │ ◯  "did u send it??"  •    │    ╲    │ wavloops.co/s/atl-nights│
 *   │    INSTAGRAM DM            │     →   │ ▸ Midnight Drift 142BPM │
 *   │ 💬  Manager           •    │  ┌──┐   │ ▸ Golden Hour    78BPM  │
 *   │    WHATSAPP · 5M           │ →│ W│→  │ KA kayde.mgmt@gmail.com │
 *   │ 🎮  ATL Producers     •    │  └──┘   │   JOINED · 14 · 5       │
 *   │    DISCORD · NOW           │  ╱      └─────────────────────────┘
 *   └────────────────────────────┘ ╱
 *                            ONE SERVER
 *
 *   "5 apps, expired links,                One link. Every beat,
 *    'who did I send it to?'"              every contact, every
 *                                          play — tracked.
 *
 * The flow reads left → right WITHOUT copy: a card full of
 * chaos collapses into a single Wavloops mark and re-emerges as
 * a clean server destination.
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
        // Tight on mobile, generous on desktop.
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Ambient brand glow centered behind the hub. Painted on
              the section itself now that the outer glass wrapper is
              gone — keeps the canvas warm without re-introducing a
              card. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 30% 35% at 50% 65%, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.45,
        }}
      />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        <SectionHeader />
        {/* Desktop ≥ md — the full node network with SVG wires.
                The aspect-ratio layout collapses too tightly for
                a phone, so it's hidden under md and replaced by a
                vertical stack. */}
        <div className="hidden md:block" style={{ marginTop: 64 }}>
          <NetworkScene />
        </div>
        {/* Mobile < md — vertical stack with a chevron between
                each block. Same inner content as the desktop scene,
                just composed in a flex column. */}
        <div className="md:hidden" style={{ marginTop: 48 }}>
          <MobileScene />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Editorial section header
   ============================================================ */

function SectionHeader() {
  return (
    <div className="flex flex-col" style={{ gap: 28 }}>
      <div className="flex items-center" style={{ gap: 18 }}>
        <span className="t-mono" style={{ color: "var(--accent-text)" }}>
          02
        </span>
        <span
          aria-hidden="true"
          style={{ height: 1, flex: 1, background: "var(--border-1)" }}
        />
        <span className="t-mono" style={{ color: "var(--fg-3)" }}>
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
          style={{ marginTop: 14, color: "var(--fg-3)", paddingLeft: 22 }}
        >
          — a producer
        </figcaption>
      </figure>
    </div>
  );
}

/* ============================================================
   Network scene — left card → hub → right card
   ============================================================
   ViewBox 1200 × 520. Coordinate map:
     LeftCard right edge   x = 320
     LeftCard row Y stops  y = 150, 220, 290, 360
     Hub left edge          x = 540
     Hub right edge         x = 660
     RightCard left edge   x = 760
   ============================================================ */

// Y stops align with the actual rendered row centers inside the
// enlarged left card. ViewBox is now 1200 × 560 (was 520) to
// give the bigger cards vertical breathing room.
const LEFT_ROW_YS = [180, 245, 310, 375];
const HUB_LEFT_X = 540;
const HUB_RIGHT_X = 660;
const HUB_Y = 280;
const VIEWBOX_W = 1200;
const VIEWBOX_H = 560;
const LEFT_CARD_RIGHT_X = 360;
// Right card left edge — wire endpoint slips ~10 viewBox units
// behind the card border so the noodle visually merges into the
// card instead of stopping in the void.
const RIGHT_CARD_LEFT_X = 860;

const WIRES = [
  { d: `M ${LEFT_CARD_RIGHT_X} ${LEFT_ROW_YS[0]} C 440 ${LEFT_ROW_YS[0]}, 480 ${HUB_Y}, ${HUB_LEFT_X} ${HUB_Y}`, delay: 0.0 },
  { d: `M ${LEFT_CARD_RIGHT_X} ${LEFT_ROW_YS[1]} C 440 ${LEFT_ROW_YS[1]}, 480 ${HUB_Y}, ${HUB_LEFT_X} ${HUB_Y}`, delay: 0.5 },
  { d: `M ${LEFT_CARD_RIGHT_X} ${LEFT_ROW_YS[2]} C 440 ${LEFT_ROW_YS[2]}, 480 ${HUB_Y}, ${HUB_LEFT_X} ${HUB_Y}`, delay: 1.0 },
  { d: `M ${LEFT_CARD_RIGHT_X} ${LEFT_ROW_YS[3]} C 440 ${LEFT_ROW_YS[3]}, 480 ${HUB_Y}, ${HUB_LEFT_X} ${HUB_Y}`, delay: 1.5 },
  // Outgoing — same 200-unit run but with a tiny upward arc in
  // the middle so the path's bounding box has non-zero height.
  // A perfectly horizontal `L` line was rendering INVISIBLE
  // because the linearGradient (gradientUnits=objectBoundingBox
  // default) can't paint across a zero-height bbox. Endpoints
  // stay at HUB_Y so the wire still enters the hub and the
  // right card on the same horizontal axis.
  {
    d: `M ${HUB_RIGHT_X} ${HUB_Y} C 720 ${HUB_Y - 6}, 800 ${HUB_Y - 6}, ${RIGHT_CARD_LEFT_X} ${HUB_Y}`,
    delay: 2.0,
  },
];

function NetworkScene() {
  return (
    <div
      className="relative"
      style={{
        width: "100%",
        aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}`,
        minHeight: 460,
      }}
    >
      {/* ───── SVG layer ───── */}
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          {/* Static wire — soft accent-tinted stops so the wires
                  read as 'energy flowing through the brand', not
                  generic white grid lines. Boosted opacity now that
                  the chaos panel canvas is dark. */}
          <linearGradient id="wl-wire" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a8a5ff" stopOpacity="0" />
            <stop offset="20%" stopColor="#a8a5ff" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#c9c7ff" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#a8a5ff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#a8a5ff" stopOpacity="0" />
          </linearGradient>
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
        {WIRES.map((w, i) => (
          <path
            key={`noodle-${i}`}
            d={w.d}
            stroke="url(#wl-noodle)"
            strokeWidth={2.6}
            fill="none"
            filter="url(#wl-wire-glow)"
            style={{
              // Shorter cycle than v5 (320 vs 1000) so the lit
              // segment passes through the visible wire more
              // often — the right-side beam in particular was
              // dark most of the time before.
              strokeDasharray: "80 240",
              animation: `wl-noodle-flow 2.4s linear infinite`,
              animationDelay: `${w.delay}s`,
            }}
          />
        ))}

        {/* Junction dots */}
        <circle
          cx={HUB_LEFT_X}
          cy={HUB_Y}
          r={4}
          fill="var(--accent-text)"
          filter="url(#wl-dot-glow)"
        />
        <circle
          cx={HUB_RIGHT_X}
          cy={HUB_Y}
          r={4}
          fill="var(--accent-text)"
          filter="url(#wl-dot-glow)"
        />
      </svg>

      {/* ───── HTML layer ───── */}
      <div className="absolute inset-0">
        <LeftCardWrap />
        <CenterHub />
        <RightCardWrap />
      </div>

      {/* ───── Below-cards captions ───── */}
      <BelowCaptions />
    </div>
  );
}

/* ============================================================
   LEFT — "The old way" card
   ============================================================ */

const CHAOS_ROWS = [
  {
    brand: "gmail",
    subject: "WeTransfer link",
    tag: "GMAIL · EXPIRED",
  },
  {
    brand: "instagram",
    subject: "“did u send it??”",
    tag: "INSTAGRAM DM",
  },
  {
    brand: "whatsapp",
    subject: "Manager",
    tag: "WHATSAPP · 5M",
  },
  {
    brand: "discord",
    subject: "ATL Producers",
    tag: "DISCORD · NOW",
  },
] as const;

/**
 * The actual chaos card markup (no positioning). Lives outside
 * its wrappers so the desktop network and the mobile stack can
 * both render the same content without duplicating it.
 */
function LeftCardInner() {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-lg)",
        padding: 14,
        boxShadow:
          "0 30px 60px -20px oklch(0 0 0 / 0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Card header */}
        <div
          className="flex items-center"
          style={{ gap: 10, padding: "4px 4px 12px" }}
        >
          <span
            aria-hidden="true"
            className="flex items-center justify-center"
            style={{
              width: 22,
              height: 22,
              borderRadius: "var(--r-pill)",
              background:
                "color-mix(in oklch, var(--danger) 18%, transparent)",
              color: "var(--danger)",
            }}
          >
            <XGlyph />
          </span>
          <span className="t-title" style={{ fontSize: 13.5 }}>
            The old way
          </span>
          <span
            className="t-mono"
            style={{
              marginLeft: "auto",
              color: "var(--danger)",
              background:
                "color-mix(in oklch, var(--danger) 14%, transparent)",
              padding: "3px 8px",
              borderRadius: "var(--r-pill)",
              fontSize: 9,
            }}
          >
            Chaos
          </span>
        </div>

      {/* Chaos rows */}
      <div className="flex flex-col" style={{ gap: 6 }}>
        {CHAOS_ROWS.map((r) => (
          <ChaosRow key={r.brand} {...r} />
        ))}
      </div>
    </div>
  );
}

/**
 * Desktop wrapper — anchors the card by its RIGHT edge so the
 * wire start points always align with the card boundary at any
 * container width. `left: 30%` puts the wrapper's right edge
 * at viewBox x = LEFT_CARD_RIGHT_X (360 of 1200 = 30%); the
 * translate(-100%) then anchors the card's right edge there.
 */
function LeftCardWrap() {
  return (
    <div
      className="absolute"
      style={{
        top: `${(HUB_Y / VIEWBOX_H) * 100}%`,
        left: `${(LEFT_CARD_RIGHT_X / VIEWBOX_W) * 100}%`,
        transform: "translate(-100%, -50%)",
        width: 360,
      }}
    >
      <LeftCardInner />
    </div>
  );
}

function ChaosRow({
  brand,
  subject,
  tag,
}: {
  brand: keyof typeof BRAND_META;
  subject: string;
  tag: string;
}) {
  const meta = BRAND_META[brand];
  const Icon = meta.icon;
  return (
    <div
      className="flex items-center"
      style={{
        gap: 10,
        padding: "10px 10px",
        background: "var(--bg-0)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-md)",
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 30,
          height: 30,
          borderRadius: "var(--r-sm)",
          background: meta.bg,
          color: meta.color,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="t-title"
          style={{
            fontSize: 12.5,
            color: "var(--fg-1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subject}
        </div>
        <div
          className="t-mono"
          style={{ color: "var(--fg-4)", fontSize: 9, marginTop: 3 }}
        >
          {tag}
        </div>
      </div>
      {/* Unread dot */}
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--r-pill)",
          background: "var(--fg-4)",
        }}
      />
    </div>
  );
}

/* ============================================================
   CENTER — Wavloops hub
   ============================================================ */

/**
 * Hub chip + "One server" caption. No positioning — shared
 * between the desktop network (absolutely positioned over the
 * SVG) and the mobile stack (placed between the two cards).
 */
function HubInner() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 104, height: 104 }}>
        {/* Soft ambient halo */}
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            inset: -28,
            borderRadius: "var(--r-pill)",
            background:
              "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
            opacity: 0.7,
            filter: "blur(8px)",
          }}
        />

        {/* Accent square — like the reference's blue 'W' chip,
                Wavloops-styled. Rounded square (not circle) so it
                reads as a product mark, not as another node. */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            borderRadius: 18,
            background:
              "linear-gradient(140deg, var(--accent) 0%, oklch(0.42 0.16 268) 100%)",
            border: "1px solid color-mix(in oklch, var(--accent-text) 50%, transparent)",
            boxShadow:
              "0 30px 60px -20px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          {/* Inner ring */}
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              inset: 6,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          />
          <span
            style={{
              color: "#ffffff",
              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.45))",
              display: "flex",
            }}
          >
            <Logomark size={42} />
          </span>
        </div>
      </div>

      {/* Caption under the hub */}
      <span
        className="t-mono"
        style={{
          marginTop: 16,
          color: "var(--accent-text)",
          textShadow: "0 0 14px var(--accent-glow)",
        }}
      >
        One server
      </span>
    </div>
  );
}

/** Desktop wrapper — absolute-positions HubInner over the SVG
 *  centre. */
function CenterHub() {
  return (
    <div
      className="absolute"
      style={{
        top: `${(HUB_Y / VIEWBOX_H) * 100}%`,
        left: `${(600 / VIEWBOX_W) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <HubInner />
    </div>
  );
}

/* ============================================================
   RIGHT — Wavloops server card (the destination)
   ============================================================ */

/**
 * The Atlanta Nights server card markup, no positioning. Shared
 * across the desktop network and the mobile stack.
 */
function RightCardInner() {
  return (
    <div
      className="relative"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        border:
          "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        boxShadow:
          "0 36px 70px -22px oklch(0 0 0 / 0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 40px -10px var(--accent-glow)",
      }}
    >
        {/* Soft accent halo from where the wire enters */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 0% 50%, var(--accent-glow) 0%, transparent 60%)",
            opacity: 0.45,
          }}
        />

        {/* Server hero */}
        <div
          className="relative flex items-center"
          style={{
            padding: 14,
            gap: 12,
            borderBottom: "1px solid var(--border-1)",
            zIndex: 2,
          }}
        >
          <ServerCoverEq size={44} />
          <div className="min-w-0 flex-1">
            <div className="t-title" style={{ fontSize: 13.5 }}>
              Atlanta Nights
            </div>
            <div
              className="t-mono"
              style={{ color: "var(--fg-3)", fontSize: 9, marginTop: 3 }}
            >
              4 BEATS · 12 ARTISTS
            </div>
          </div>
          <span
            className="t-mono"
            style={{
              padding: "3px 8px",
              borderRadius: "var(--r-pill)",
              background: "var(--bg-2)",
              color: "var(--fg-2)",
              fontSize: 9,
              border: "1px solid var(--border-1)",
            }}
          >
            Private
          </span>
        </div>

        {/* URL pill row */}
        <div
          className="relative flex items-center"
          style={{
            padding: "10px 14px",
            gap: 8,
            borderBottom: "1px solid var(--border-1)",
            background: "var(--bg-1)",
            zIndex: 2,
          }}
        >
          <span
            aria-hidden="true"
            style={{ color: "var(--fg-4)", fontSize: 11, display: "flex" }}
          >
            <LinkGlyph />
          </span>
          <span
            className="t-mono"
            style={{
              color: "var(--fg-2)",
              fontSize: 10,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            wavloops.co/s/atl-nights
          </span>
          <span
            className="t-mono"
            style={{
              padding: "2px 7px",
              borderRadius: "var(--r-pill)",
              background: "var(--ok-surface)",
              color: "var(--ok)",
              fontSize: 9,
            }}
          >
            Copied
          </span>
        </div>

        {/* Beat rows */}
        <div className="relative" style={{ zIndex: 2 }}>
          <BeatRow
            playing
            title="Midnight Drift"
            meta="142 BPM · F MIN"
          />
          <BeatRow title="Golden Hour" meta="78 BPM · C MIN" plays={540} likes={88} />
        </div>

        {/* Contact strip */}
        <div
          className="relative flex items-center"
          style={{
            padding: "12px 14px",
            gap: 10,
            borderTop: "1px solid var(--border-1)",
            background: "var(--bg-1)",
            zIndex: 2,
          }}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--r-pill)",
              background:
                "linear-gradient(135deg, oklch(0.62 0.18 35) 0%, oklch(0.58 0.18 22) 100%)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            KA
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="t-title"
              style={{
                fontSize: 12,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              kayde.mgmt@gmail.com
            </div>
            <div
              className="t-mono"
              style={{
                color: "var(--fg-4)",
                fontSize: 9,
                marginTop: 3,
                display: "flex",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--ok)" }}>● Joined</span>
              <span>14 plays</span>
              <span>5 likes</span>
            </div>
          </div>
        </div>
      </div>
  );
}

/**
 * Desktop wrapper — anchors the card by its LEFT edge so the
 * outgoing wire end visually slips under the card's left border
 * at every container width. The wire's RIGHT_CARD_LEFT_X = 860
 * (71.6% of viewBox) maps to the card's left edge. Last ~10
 * viewBox units of the wire tuck under the card border for a
 * seamless visual connection.
 */
function RightCardWrap() {
  return (
    <div
      className="absolute"
      style={{
        top: `${(HUB_Y / VIEWBOX_H) * 100}%`,
        left: `${(RIGHT_CARD_LEFT_X / VIEWBOX_W) * 100}%`,
        transform: "translate(0, -50%)",
        width: 400,
      }}
    >
      <RightCardInner />
    </div>
  );
}

function BeatRow({
  title,
  meta,
  playing,
  plays,
  likes,
}: {
  title: string;
  meta: string;
  playing?: boolean;
  plays?: number;
  likes?: number;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: "10px 14px",
        gap: 12,
        borderTop: "1px solid var(--border-1)",
        background: playing ? "var(--accent-surface)" : "transparent",
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 26,
          height: 26,
          borderRadius: "var(--r-pill)",
          background: playing ? "var(--accent)" : "var(--bg-2)",
          color: playing ? "#fff" : "var(--fg-2)",
          boxShadow: playing ? "0 0 16px var(--accent-glow)" : "none",
        }}
      >
        {playing ? <PauseGlyph /> : <PlayGlyph />}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="t-title"
          style={{
            fontSize: 12.5,
            color: playing ? "var(--accent-text)" : "var(--fg-1)",
          }}
        >
          {title}
        </div>
        <div
          className="t-mono"
          style={{ color: "var(--fg-4)", fontSize: 9, marginTop: 3 }}
        >
          {meta}
        </div>
      </div>
      {playing ? (
        <ActiveEqMini />
      ) : (
        <div
          className="t-mono"
          style={{ color: "var(--fg-4)", fontSize: 9, display: "flex", gap: 8 }}
        >
          {plays !== undefined && <span>● {plays}</span>}
          {likes !== undefined && <span>♥ {likes}</span>}
        </div>
      )}
    </div>
  );
}

function ActiveEqMini() {
  return (
    <span
      className="flex items-end shrink-0"
      style={{ gap: 2, height: 14 }}
      aria-hidden="true"
    >
      {[0, 0.12, 0.24, 0.36].map((d, i) => (
        <span
          key={i}
          style={{
            width: 2.5,
            height: "100%",
            background: "var(--accent-text)",
            borderRadius: 1,
            transformOrigin: "bottom",
            animation: "wl-eq-bar 1s ease-in-out infinite",
            animationDelay: `${d}s`,
            display: "inline-block",
          }}
        />
      ))}
    </span>
  );
}

function ServerCoverEq({ size = 44 }: { size?: number }) {
  const BARS = 4;
  return (
    <div
      className="relative flex items-end justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "var(--r-md)",
        background:
          "linear-gradient(135deg, var(--accent) 0%, oklch(0.42 0.16 268) 100%)",
        boxShadow:
          "0 12px 24px -12px var(--accent-glow), inset 0 0 0 1px rgba(255,255,255,0.08)",
        padding: `${size * 0.22}px ${size * 0.2}px`,
        gap: 3,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 3,
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
   Below-cards captions
   ============================================================ */

function BelowCaptions() {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "1fr 0.7fr 1.2fr",
        gap: 20,
        marginTop: 28,
        alignItems: "start",
      }}
    >
      <p
        className="t-body"
        style={{
          color: "var(--fg-3)",
          fontSize: 13,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: 260,
          margin: "0 auto",
        }}
      >
        5 apps, expired links,
        <br />
        &ldquo;who did I send it to?&rdquo;
      </p>
      <div />
      <p
        className="t-body"
        style={{
          color: "var(--fg-2)",
          fontSize: 13,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: 320,
          margin: "0 auto",
        }}
      >
        One link. Every beat, every contact, every play — tracked.
      </p>
    </div>
  );
}

/* ============================================================
   Mobile scene — vertical stack (< md)
   ────────────────────────────────────
   Same content as the desktop network (LeftCardInner +
   HubInner + RightCardInner) but stacked vertically with
   downward chevrons between blocks and the chaos / promise
   captions placed directly under their respective cards
   instead of in a 3-column grid. SVG wires are dropped on
   mobile — they assume a horizontal layout and would clip
   awkwardly in a narrow viewport.
   ============================================================ */

function MobileScene() {
  return (
    <div className="flex flex-col items-center" style={{ gap: 8 }}>
      {/* Left card — chaos */}
      <div style={{ width: "100%", maxWidth: 380 }}>
        <LeftCardInner />
      </div>
      <p
        className="t-body"
        style={{
          color: "var(--fg-3)",
          fontSize: 12.5,
          lineHeight: 1.5,
          marginTop: 14,
          textAlign: "center",
          maxWidth: 280,
        }}
      >
        5 apps, expired links,
        <br />
        &ldquo;who did I send it to?&rdquo;
      </p>

      {/* Chevron */}
      <div style={{ marginTop: 18 }}>
        <DownChevron />
      </div>

      {/* Hub */}
      <div style={{ marginTop: 18 }}>
        <HubInner />
      </div>

      {/* Chevron */}
      <div style={{ marginTop: 18 }}>
        <DownChevron />
      </div>

      {/* Right card — promise */}
      <div style={{ width: "100%", maxWidth: 380, marginTop: 18 }}>
        <RightCardInner />
      </div>
      <p
        className="t-body"
        style={{
          color: "var(--fg-2)",
          fontSize: 12.5,
          lineHeight: 1.5,
          marginTop: 14,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        One link. Every beat, every contact, every play — tracked.
      </p>
    </div>
  );
}

function DownChevron() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-text)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        filter: "drop-shadow(0 0 10px var(--accent-glow))",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ============================================================
   Brand metadata (left-card chaos rows)
   ============================================================ */

const BRAND_META = {
  gmail: { bg: "#FFFFFF", color: "#EA4335", icon: GmailLogo },
  instagram: {
    bg: "linear-gradient(135deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)",
    color: "#FFFFFF",
    icon: InstagramLogo,
  },
  whatsapp: { bg: "#25D366", color: "#FFFFFF", icon: WhatsappLogo },
  discord: { bg: "#5865F2", color: "#FFFFFF", icon: DiscordLogo },
} as const;

/* ============================================================
   Inline brand SVGs + small glyphs
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

function XGlyph() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
