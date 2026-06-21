/**
 * Landing — Section 02. Orbital diagram (v6).
 *
 * Theo's Figma sketch swap: drop the two-card composition and
 * draw a planetary orbit instead.
 *
 *   - W mark at the centre, in a solid accent disc.
 *   - Two concentric blue rings around it:
 *       * Inner ring (thicker stroke) — 'new way', containing
 *         only the W. Wavloops is the calm centre.
 *       * Outer ring (thin stroke) — 'Old way', where the five
 *         producer-burning apps sit as orbiting nodes:
 *         Gmail, Instagram, WhatsApp, Discord, WeTransfer.
 *   - Each pair of outer nodes is joined by a chaotic red wire
 *     with the same flowing-noodle animation we use on every
 *     other landing diagram — Theo: 'EN GARDANT L'IDÉE DE LIEN
 *     FLUIDE'. Hatred-of-the-old-tools made visible: the
 *     producer's life is a tangled web that doesn't even
 *     touch Wavloops.
 *
 * Header copy (title + producer verbatim) is unchanged from
 * v5 — Theo: 'le textuel est ok'.
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
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Ambient accent halo centred behind the orbit, picks up
              from the rest of the landing's lighting language. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 40% at 50% 70%, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.4,
        }}
      />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        <SectionHeader />
        <div
          style={{ marginTop: "clamp(40px, 6vw, 72px)" }}
          className="flex justify-center"
        >
          <OrbitGraphic />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Editorial header — 02 / OUR PROMISE / title / quote
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
   ORBIT GRAPHIC
   ────────────────────────────────────────────────────────────
   ViewBox 0 0 800 800. All positions derived from a single
   layout constant so the rings, nodes and wires move together.
   ============================================================ */

const VIEWBOX = 800;
const CENTER = VIEWBOX / 2; // 400, 400
const INNER_RADIUS = 130;   // new-way ring (Wavloops own orbit)
const OUTER_RADIUS = 290;   // old-way ring (where chaos apps sit)
const NODE_RADIUS = 280;    // brand-node centres (slightly inside outer ring)
const NODE_SIZE = 78;       // glass node diameter (px in viewBox space)

interface BrandNode {
  id: string;
  label: string;
  color: string;
  bg: string;
  fg: string;
  angle: number; // degrees, 0 = right, -90 = top
  Icon: React.ComponentType<{ size?: number }>;
}

const BRAND_NODES: BrandNode[] = [
  { id: "gmail",      label: "Gmail",      color: "#EA4335", bg: "#FFFFFF", fg: "#EA4335", angle: -90, Icon: GmailLogo },
  { id: "instagram",  label: "Instagram",  color: "#D62976", bg: "linear-gradient(135deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)", fg: "#FFFFFF", angle: -18, Icon: InstagramLogo },
  { id: "whatsapp",   label: "WhatsApp",   color: "#25D366", bg: "#25D366", fg: "#FFFFFF", angle: 54,  Icon: WhatsappLogo },
  { id: "discord",    label: "Discord",    color: "#5865F2", bg: "#5865F2", fg: "#FFFFFF", angle: 126, Icon: DiscordLogo },
  { id: "wetransfer", label: "WeTransfer", color: "#406AFF", bg: "#406AFF", fg: "#FFFFFF", angle: 198, Icon: WetransferLogo },
];

/** Polar → cartesian inside the viewBox. */
function polar(radius: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

/** Build a list of unique node pairs to draw chaos wires
 *  between. We skip adjacent pairs (cleaner read) and keep the
 *  long diagonals — that's where the eye reads 'tangled web'.  */
const CHAOS_PAIRS = (() => {
  const pairs: Array<[number, number]> = [];
  const n = BRAND_NODES.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Skip same-index pair and the two visually-adjacent
      // pairs (those would draw a short edge along the outer
      // ring instead of a crossing diagonal). Keep every other
      // pair.
      const dist = Math.min(j - i, n - (j - i));
      if (dist === 1) continue; // adjacent → skip
      pairs.push([i, j]);
    }
  }
  return pairs;
})();

function OrbitGraphic() {
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: "1 / 1",
        maxWidth: 720,
      }}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          {/* Chaos noodle — red gradient, fades in/out so the
                  lit segment looks like a moving pulse. */}
          <linearGradient id="wl-chaos-noodle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3b5c" stopOpacity="0" />
            <stop offset="50%" stopColor="#ff5b73" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff3b5c" stopOpacity="0" />
          </linearGradient>
          <filter id="wl-chaos-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wl-inner-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Outer ring — Old way */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          stroke="color-mix(in oklch, var(--accent-text) 50%, transparent)"
          strokeWidth={1.5}
          fill="none"
          opacity={0.8}
        />

        {/* Inner ring — new way (thicker + soft glow under it
                so it reads as 'the calm orbit, lit from within'). */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          stroke="var(--accent)"
          strokeWidth={5}
          fill="none"
          filter="url(#wl-inner-ring-glow)"
          opacity={0.35}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          stroke="var(--accent)"
          strokeWidth={3}
          fill="none"
        />

        {/* Chaos wires — static faint baseline + animated red
                noodle on top. */}
        {CHAOS_PAIRS.map(([i, j], idx) => {
          const a = polar(NODE_RADIUS, BRAND_NODES[i].angle);
          const b = polar(NODE_RADIUS, BRAND_NODES[j].angle);
          // Pull the line endpoints slightly toward the centre
          // so they enter UNDER the node (no visible stub past
          // the brand tile).
          const trim = NODE_SIZE / 2.1;
          const aDir = Math.atan2(b.y - a.y, b.x - a.x);
          const bDir = aDir + Math.PI;
          const aTrim = {
            x: a.x + Math.cos(aDir) * trim,
            y: a.y + Math.sin(aDir) * trim,
          };
          const bTrim = {
            x: b.x + Math.cos(bDir) * trim,
            y: b.y + Math.sin(bDir) * trim,
          };
          const d = `M ${aTrim.x} ${aTrim.y} L ${bTrim.x} ${bTrim.y}`;
          const delay = (idx * 0.35) % 3;
          const duration = 2.8 + (idx % 3) * 0.3;
          return (
            <g key={`${i}-${j}`}>
              {/* Faint baseline so the wire is readable even
                      when the noodle is in its dark phase. */}
              <path
                d={d}
                stroke="rgba(255,71,87,0.22)"
                strokeWidth={1.5}
                fill="none"
              />
              {/* Animated noodle */}
              <path
                d={d}
                stroke="url(#wl-chaos-noodle)"
                strokeWidth={2.4}
                fill="none"
                filter="url(#wl-chaos-glow)"
                style={{
                  strokeDasharray: "80 220",
                  animation: `wl-noodle-flow ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML overlay — W chip at centre, brand nodes around
              the outer ring, labels for the two zones. */}
      <div className="absolute inset-0 pointer-events-none">
        <CenterMark />
        {BRAND_NODES.map((node) => (
          <BrandOrbitNode key={node.id} node={node} />
        ))}
        <Label
          text="Old way"
          xPct={(polar(NODE_RADIUS, -135).x / VIEWBOX) * 100}
          yPct={(polar(NODE_RADIUS, -135).y / VIEWBOX) * 100 - 4}
          dim
        />
        <Label
          text="new way"
          // Place just above the W chip, inside the inner ring.
          xPct={50}
          yPct={((CENTER - 70) / VIEWBOX) * 100}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Centre W mark
   ============================================================ */

function CenterMark() {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        top: `${(CENTER / VIEWBOX) * 100}%`,
        left: `${(CENTER / VIEWBOX) * 100}%`,
        transform: "translate(-50%, -50%)",
        width: "11%",
        aspectRatio: "1 / 1",
        borderRadius: "var(--r-pill)",
        background: "var(--accent)",
        border: "1px solid color-mix(in oklch, var(--accent-text) 50%, transparent)",
        boxShadow:
          "0 24px 48px -12px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      <span
        style={{
          color: "#fff",
          filter: "drop-shadow(0 0 18px rgba(255,255,255,0.5))",
          display: "flex",
        }}
      >
        <Logomark size={36} />
      </span>
    </div>
  );
}

/* ============================================================
   Brand orbit node — placed at a polar position around the
   outer ring.
   ============================================================ */

function BrandOrbitNode({ node }: { node: BrandNode }) {
  const pos = polar(NODE_RADIUS, node.angle);
  const Icon = node.Icon;
  return (
    <div
      className="absolute"
      style={{
        top: `${(pos.y / VIEWBOX) * 100}%`,
        left: `${(pos.x / VIEWBOX) * 100}%`,
        transform: "translate(-50%, -50%)",
        width: "9.8%",
        aspectRatio: "1 / 1",
      }}
      aria-label={node.label}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          borderRadius: "var(--r-pill)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow:
            "0 18px 40px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Brand tile */}
        <span
          className="flex items-center justify-center"
          style={{
            width: "52%",
            aspectRatio: "1 / 1",
            borderRadius: "var(--r-md)",
            background: node.bg,
            color: node.fg,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Zone label
   ============================================================ */

function Label({
  text,
  xPct,
  yPct,
  dim,
}: {
  text: string;
  xPct: number;
  yPct: number;
  dim?: boolean;
}) {
  return (
    <div
      className="absolute"
      style={{
        top: `${yPct}%`,
        left: `${xPct}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(12px, 1.4vw, 16px)",
          letterSpacing: "-0.005em",
          color: dim ? "var(--fg-3)" : "var(--fg-1)",
          textShadow: dim ? "none" : "0 0 18px rgba(0,0,0,0.7)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ============================================================
   Brand SVG icons (inline, viewBox 0 0 24 24)
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
