/**
 * Landing — Section 02. The problem (cinematic rewrite).
 *
 * Why this exists at all
 * ──────────────────────
 * v1 was a generic ❌/✅ bullet list. v2 swapped it for a "scene"
 * but the chaos collage used my own colored squares as fake
 * brand icons and the panels sat static — Theo's note was that it
 * still read AI-template. v3 (this file) is the answer:
 *
 *   - Real brand icons (Discord, WeTransfer, Gmail, Instagram)
 *     inline as proper SVG paths in their actual brand colors,
 *     not stand-in tiles.
 *   - Cards float on their own timing so the chaos panel feels
 *     like an unresolved desktop the producer just walked away
 *     from. Notification badges pulse, the IG bubble has a
 *     typing indicator under it.
 *   - The Wavloops panel runs LIVE: the play counter ticks up
 *     on a 4s interval, a new activity row slides in every ~6s
 *     and pushes the older one down, the LIVE dot breathes, a
 *     5-bar mini equalizer waves inside the cover.
 *
 * Header copy (title + producer verbatim) is unchanged — only
 * the visual half has been rebuilt.
 */

"use client";

import * as React from "react";

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
        {/* ─── Headline + quote ─── */}
        <div
          className="mx-auto text-center"
          style={{ maxWidth: 820, marginBottom: 80 }}
        >
          <h2
            id="problem-title"
            className="t-display"
            style={{
              fontSize: "clamp(36px, 4.4vw, 56px)",
              lineHeight: 1.04,
              marginBottom: 36,
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

          <figure className="mx-auto" style={{ maxWidth: 720 }}>
            <blockquote
              className="t-body-l"
              style={{
                fontSize: 20,
                lineHeight: 1.55,
                fontStyle: "italic",
                color: "var(--fg-1)",
                paddingLeft: 22,
                borderLeft: "2px solid var(--accent-text)",
                textAlign: "left",
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
                textAlign: "left",
                paddingLeft: 22,
              }}
            >
              — a producer
            </figcaption>
          </figure>
        </div>

        {/* ─── Scene: chaos vs Wavloops ─── */}
        <div
          className="grid items-stretch"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
            gap: 24,
          }}
        >
          <ChaosPanel />
          <WavloopsPanel />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Brand SVG icons (inline so we don't ship an icon package or
   chase 4 CDN URLs for a marketing surface). Paths sourced from
   each brand's official asset / simple-icons; viewBoxes left at
   24×24 to match our DS icon size convention.
   ============================================================ */

function WetransferLogo({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 6.75A.74.74 0 0 1 .73 6h2.49a.73.73 0 0 1 .71.55l1.69 7.05L7.7 6.55a.74.74 0 0 1 .74-.55h2.42a.75.75 0 0 1 .74.55l2.08 7.05 1.71-7.05a.74.74 0 0 1 .73-.55h2.46a.74.74 0 0 1 .73.9l-3 11.81a.75.75 0 0 1-.73.55h-2.7a.74.74 0 0 1-.73-.54l-1.69-6.21-1.78 6.21a.74.74 0 0 1-.73.54h-2.7a.74.74 0 0 1-.73-.55L0 6.93a.75.75 0 0 1 0-.18zm23 6.41A1 1 0 1 0 24 14.16a1 1 0 0 0-1-1zm0 3.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1z" />
    </svg>
  );
}

function InstagramLogo({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function GmailLogo({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}

function DiscordLogo({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

/* ============================================================
   LEFT — Chaos collage
   ============================================================ */

function ChaosPanel() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-inset) 0%, var(--bg-1) 100%)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-xl)",
        minHeight: 500,
        padding: 28,
      }}
    >
      {/* Header pill — danger tinted */}
      <PanelHeader tone="danger" label="The old way" />

      {/* Floating-cards stage. Each card has a parent wrapper
              that handles the wl-float animation (translateY only)
              and an inner div that handles the static rotation.
              Composing the two keeps the rotation stable while the
              float adds life. */}
      <div className="relative" style={{ marginTop: 28, height: 400 }}>
        <FloatingCard
          top={0}
          left="2%"
          width="64%"
          rotate={-3}
          floatDelay={0}
          floatDuration={5.2}
          z={3}
        >
          <WeTransferCard />
        </FloatingCard>

        <FloatingCard
          top={80}
          right="0%"
          width="60%"
          rotate={2.5}
          floatDelay={1.4}
          floatDuration={5.8}
          z={4}
        >
          <InstagramCard />
        </FloatingCard>

        <FloatingCard
          bottom={56}
          left={0}
          width="64%"
          rotate={-1.5}
          floatDelay={0.7}
          floatDuration={5.5}
          z={2}
        >
          <GmailCard />
        </FloatingCard>

        <FloatingCard
          bottom={4}
          right="6%"
          width="48%"
          rotate={3}
          floatDelay={2}
          floatDuration={6.1}
          z={5}
        >
          <DiscordCard />
        </FloatingCard>

        {/* Bottom soft fade so the collage bleeds off the panel,
                deepens the chaos without literal motion blur. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: 80,
            background:
              "linear-gradient(to bottom, transparent, var(--bg-inset))",
          }}
        />
      </div>
    </div>
  );
}

function FloatingCard({
  top,
  left,
  right,
  bottom,
  width,
  rotate,
  floatDelay,
  floatDuration,
  z,
  children,
}: {
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  width: string;
  rotate: number;
  floatDelay: number;
  floatDuration: number;
  z: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        top,
        left,
        right,
        bottom,
        width,
        zIndex: z,
        animation: `wl-float ${floatDuration}s ease-in-out infinite`,
        animationDelay: `${floatDelay}s`,
      }}
    >
      <div style={{ transform: `rotate(${rotate}deg)`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
}

/* ───────── Brand cards inside the chaos collage ───────── */

function ChaosCardShell({
  children,
  brandStripColor,
}: {
  children: React.ReactNode;
  brandStripColor?: string;
}) {
  return (
    <div
      className="relative"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-md)",
        padding: "14px 16px",
        boxShadow:
          "0 16px 38px -18px oklch(0 0 0 / 0.62), 0 2px 8px -4px oklch(0 0 0 / 0.4)",
        overflow: "hidden",
      }}
    >
      {/* Top brand strip — a 2px sliver that picks up the card's
              brand color. Makes each card feel like a real app
              notification, not a generic tile. */}
      {brandStripColor && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0"
          style={{ height: 2, background: brandStripColor }}
        />
      )}
      {children}
    </div>
  );
}

function BrandTile({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: 26,
        height: 26,
        borderRadius: "var(--r-sm)",
        background: bg,
        color,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </span>
  );
}

function CardHeader({
  brand,
  name,
  right,
}: {
  brand: React.ReactNode;
  name: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center"
      style={{ gap: 10, marginBottom: 10 }}
    >
      {brand}
      <span className="t-mono" style={{ color: "var(--fg-3)" }}>
        {name}
      </span>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}

function WeTransferCard() {
  const BRAND = "#406AFF";
  return (
    <ChaosCardShell brandStripColor={BRAND}>
      <CardHeader
        brand={
          <BrandTile bg={BRAND} color="#FFFFFF">
            <WetransferLogo size={13} />
          </BrandTile>
        }
        name="WeTransfer"
        right={
          <span
            className="t-mono"
            style={{
              color: "var(--danger)",
              background:
                "color-mix(in oklch, var(--danger) 18%, transparent)",
              padding: "3px 8px",
              borderRadius: "var(--r-pill)",
            }}
          >
            Expired
          </span>
        }
      />
      <div className="t-title" style={{ color: "var(--fg-1)", fontSize: 14 }}>
        beats-v3-final-FINAL.zip
      </div>
      <div className="t-mono-s" style={{ color: "var(--fg-4)", marginTop: 6 }}>
        312 MB · sent 9 days ago
      </div>
    </ChaosCardShell>
  );
}

function InstagramCard() {
  // Authentic IG gradient (yellow → orange → pink → purple → blue)
  // on the brand tile. Same gradient stripe at the top of the
  // card. Reads instantly as Instagram without saying it.
  const IG_GRADIENT =
    "linear-gradient(135deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)";
  return (
    <ChaosCardShell brandStripColor={"#D62976"}>
      <CardHeader
        brand={
          <BrandTile bg={IG_GRADIENT} color="#FFFFFF">
            <InstagramLogo size={13} />
          </BrandTile>
        }
        name="@prodbyleo"
        right={
          <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
            2d
          </span>
        }
      />
      <div
        className="t-body"
        style={{
          color: "var(--fg-1)",
          fontSize: 13.5,
          background: "var(--bg-3)",
          padding: "10px 12px",
          borderRadius: "var(--r-md)",
          display: "inline-block",
          maxWidth: "100%",
        }}
      >
        yo did u send the pack?? can&apos;t find anything
      </div>
      {/* Typing indicator below the bubble — three dots
              bouncing left-to-right, sells "they're waiting for
              you to reply right now". */}
      <div
        className="flex items-center"
        style={{ gap: 4, marginTop: 8, paddingLeft: 8 }}
        aria-hidden="true"
      >
        <TypingDot delay={0} />
        <TypingDot delay={0.2} />
        <TypingDot delay={0.4} />
      </div>
    </ChaosCardShell>
  );
}

function TypingDot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 5,
        height: 5,
        borderRadius: "var(--r-pill)",
        background: "var(--fg-3)",
        display: "inline-block",
        animation: "wl-typing-bounce 1.2s ease-in-out infinite",
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function GmailCard() {
  const BRAND = "#EA4335";
  return (
    <ChaosCardShell brandStripColor={BRAND}>
      <CardHeader
        brand={
          <BrandTile bg="#FFFFFF" color={BRAND}>
            <GmailLogo size={13} />
          </BrandTile>
        }
        name="Gmail"
        right={
          <span
            className="t-mono"
            style={{
              color: BRAND,
              background:
                "color-mix(in oklch, var(--danger) 14%, transparent)",
              padding: "3px 8px",
              borderRadius: "var(--r-pill)",
            }}
          >
            7 new
          </span>
        }
      />
      <div className="t-title" style={{ color: "var(--fg-1)", fontSize: 14 }}>
        Re: Re: Re: BEATS V2 (FINAL FINAL)
      </div>
      <div className="t-mono-s" style={{ color: "var(--fg-4)", marginTop: 6 }}>
        From: kai · 14 sep
      </div>
    </ChaosCardShell>
  );
}

function DiscordCard() {
  const BRAND = "#5865F2";
  return (
    <ChaosCardShell brandStripColor={BRAND}>
      <CardHeader
        brand={
          <BrandTile bg={BRAND} color="#FFFFFF">
            <DiscordLogo size={13} />
          </BrandTile>
        }
        name="Discord"
        right={
          <span
            aria-hidden="true"
            className="t-mono-s"
            style={{
              background: "var(--danger)",
              color: "#FFFFFF",
              padding: "1px 6px",
              borderRadius: "var(--r-pill)",
              fontSize: 9,
              ["--wl-pulse-color" as string]: "var(--danger)",
              animation: "wl-pulse-dot 1.6s ease-out infinite",
            }}
          >
            3
          </span>
        }
      />
      <div className="t-body" style={{ color: "var(--fg-1)", fontSize: 13 }}>
        drop ur pack again pls 🙏
      </div>
    </ChaosCardShell>
  );
}

/* ============================================================
   RIGHT — Wavloops live mini-mockup
   ============================================================ */

const ACTIVITY_POOL = [
  { handle: "@yuki",  verb: "liked",  target: "Midnight Drift", count: undefined, kind: "like" as const },
  { handle: "@kai",   verb: "played", target: "Velvet",         count: 3,         kind: "play" as const },
  { handle: "@elara", verb: "liked",  target: "Slow Ocean",     count: undefined, kind: "like" as const },
  { handle: "@mae",   verb: "played", target: "Honeybloom",     count: 7,         kind: "play" as const },
  { handle: "@jun",   verb: "joined", target: "the server",     count: undefined, kind: "join" as const },
  { handle: "@rin",   verb: "played", target: "Cobalt",         count: 2,         kind: "play" as const },
] as const;

function WavloopsPanel() {
  // Plays counter ticks up by 1–3 every ~4s. Initial value is the
  // mockup baseline (3,420) so the visitor sees a real-looking
  // analytics surface from the first paint, then watches it move.
  const [plays, setPlays] = React.useState(3420);
  React.useEffect(() => {
    const id = setInterval(
      () => setPlays((p) => p + 1 + Math.floor(Math.random() * 3)),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  // Activity feed — keep a rolling head index into ACTIVITY_POOL,
  // advance every 5.5s, render the two most-recent entries. Each
  // row carries its index in `key` so React reruns the row-in
  // keyframe (wl-row-in) when a new entry takes the top slot.
  const [head, setHead] = React.useState(1); // start showing pool[0]+[1]
  React.useEffect(() => {
    const id = setInterval(
      () => setHead((h) => (h + 1) % ACTIVITY_POOL.length),
      5500,
    );
    return () => clearInterval(id);
  }, []);
  const visible = [
    ACTIVITY_POOL[head],
    ACTIVITY_POOL[(head - 1 + ACTIVITY_POOL.length) % ACTIVITY_POOL.length],
  ];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        border:
          "1px solid color-mix(in oklch, var(--accent-text) 28%, transparent)",
        borderRadius: "var(--r-xl)",
        minHeight: 500,
        padding: 28,
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Top-right brand halo — same trick as the hero. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% -10%, var(--accent-glow) 0%, transparent 60%)",
          opacity: 0.55,
        }}
      />

      <PanelHeader tone="accent" label="Wavloops server" />

      {/* Mini-mockup — composed from real DS tokens so it stays
              visually 1:1 with the in-app aesthetic without a
              PNG to maintain. */}
      <div
        className="relative"
        style={{
          marginTop: 24,
          background: "var(--bg-0)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          boxShadow:
            "0 18px 48px -20px oklch(0 0 0 / 0.7), inset 0 0 0 1px oklch(1 0 0 / 0.02)",
        }}
      >
        {/* App-window chrome — three traffic-light dots + faux
                URL pill. Grounds the mockup as a real browser
                shot. */}
        <div
          className="flex items-center"
          style={{
            padding: "10px 14px",
            gap: 8,
            borderBottom: "1px solid var(--border-1)",
            background: "var(--bg-1)",
          }}
        >
          <span style={trafficDot("#FF5F57")} />
          <span style={trafficDot("#FEBC2E")} />
          <span style={trafficDot("#28C840")} />
          <span
            className="t-mono"
            style={{
              marginLeft: 12,
              color: "var(--fg-3)",
              background: "var(--bg-0)",
              border: "1px solid var(--border-1)",
              padding: "3px 10px",
              borderRadius: "var(--r-pill)",
              flex: 1,
              textAlign: "center",
              maxWidth: 320,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            wavloops.co/s/underground-trap
          </span>
        </div>

        {/* Server hero — animated EQ-bars cover + title + status */}
        <div
          className="flex items-center"
          style={{
            padding: 16,
            gap: 14,
            borderBottom: "1px solid var(--border-1)",
          }}
        >
          <ServerCoverWithEq />
          <div className="min-w-0 flex-1">
            <div className="t-title" style={{ fontSize: 15 }}>
              Underground Trap V3
            </div>
            <div
              className="flex items-center"
              style={{ gap: 8, marginTop: 6 }}
            >
              <PrivatePill />
              <LivePill />
            </div>
          </div>
        </div>

        {/* Stats — 3 columns, plays animates */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-1)",
            background: "var(--bg-inset)",
          }}
        >
          <Stat label="Beats" value="47" />
          <Divider />
          <Stat label="Artists" value="12" />
          <Divider />
          <Stat
            label="Plays"
            value={plays.toLocaleString("en-US")}
            highlight
          />
        </div>

        {/* Live activity feed */}
        <div style={{ padding: 14 }}>
          <div
            className="flex items-center"
            style={{ gap: 8, marginBottom: 10 }}
          >
            <span className="t-mono" style={{ color: "var(--fg-4)" }}>
              Live activity
            </span>
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "var(--r-pill)",
                background: "var(--ok)",
                ["--wl-pulse-color" as string]: "var(--ok)",
                animation: "wl-pulse-dot 1.6s ease-out infinite",
              }}
            />
          </div>
          {visible.map((row, i) => (
            <ActivityRow
              // Tie key to the rolling head so the topmost row
              // re-mounts on each rotation and replays the
              // wl-row-in keyframe → a fresh slide-in.
              key={`${head}-${i}`}
              row={row}
              animateIn={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ServerCoverWithEq() {
  // 5-bar mini equalizer over a gradient cover. Bars scaleY()
  // between 0.35 and 1.0 on a staggered 1.4s loop so they wave.
  const BARS = 5;
  return (
    <div
      className="relative flex items-end justify-center shrink-0"
      style={{
        width: 64,
        height: 64,
        borderRadius: "var(--r-md)",
        background:
          "linear-gradient(135deg, var(--accent) 0%, oklch(0.42 0.16 268) 100%)",
        boxShadow:
          "0 12px 32px -12px var(--accent-glow), inset 0 0 0 1px rgba(255,255,255,0.08)",
        padding: "14px 12px",
        gap: 4,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: "100%",
            background: "rgba(255,255,255,0.92)",
            borderRadius: 2,
            transformOrigin: "bottom",
            animation: "wl-eq-bar 1.4s ease-in-out infinite",
            // Stagger so the bars wave instead of bouncing in unison
            animationDelay: `${i * 0.12}s`,
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}

function PrivatePill() {
  return (
    <span
      className="inline-flex items-center t-mono"
      style={{
        gap: 6,
        padding: "3px 8px",
        borderRadius: "var(--r-pill)",
        background: "var(--bg-2)",
        color: "var(--fg-2)",
      }}
    >
      <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM10 6a2 2 0 0 1 4 0v2h-4V6z" />
      </svg>
      Private
    </span>
  );
}

function LivePill() {
  return (
    <span
      className="inline-flex items-center t-mono"
      style={{
        gap: 6,
        padding: "3px 8px",
        borderRadius: "var(--r-pill)",
        background: "var(--ok-surface)",
        color: "var(--ok)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--r-pill)",
          background: "var(--ok)",
          ["--wl-pulse-color" as string]: "var(--ok)",
          animation: "wl-pulse-dot 1.6s ease-out infinite",
        }}
      />
      Live
    </span>
  );
}

function trafficDot(color: string): React.CSSProperties {
  return {
    width: 9,
    height: 9,
    borderRadius: "var(--r-pill)",
    background: color,
    display: "inline-block",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
  };
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 2 }}>
      <span
        className="t-h3"
        style={{
          fontSize: 16,
          color: highlight ? "var(--accent-text)" : "var(--fg-1)",
          textShadow: highlight ? "0 0 18px var(--accent-glow)" : "none",
          // Tabular-nums keeps the counter from jiggling as the
          // digits change width.
          fontVariantNumeric: "tabular-nums",
          transition: "color 0.2s var(--ease-out)",
        }}
      >
        {value}
      </span>
      <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      style={{ width: 1, height: 22, background: "var(--border-1)" }}
    />
  );
}

function ActivityRow({
  row,
  animateIn,
}: {
  row: (typeof ACTIVITY_POOL)[number];
  animateIn: boolean;
}) {
  const tone = (() => {
    if (row.kind === "like")
      return { bg: "var(--ok-surface)", fg: "var(--ok)", icon: <HeartGlyph /> };
    if (row.kind === "play")
      return {
        bg: "var(--accent-surface)",
        fg: "var(--accent-text)",
        icon: <PlayGlyph />,
      };
    return {
      bg: "color-mix(in oklch, var(--accent-text) 14%, transparent)",
      fg: "var(--fg-1)",
      icon: <UsersGlyph />,
    };
  })();
  return (
    <div
      className="flex items-center"
      style={{
        gap: 10,
        padding: "8px 4px",
        animation: animateIn
          ? "wl-row-in 0.5s var(--ease-out) both"
          : undefined,
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 26,
          height: 26,
          borderRadius: "var(--r-pill)",
          background: tone.bg,
          color: tone.fg,
        }}
      >
        {tone.icon}
      </span>
      <span
        className="t-body"
        style={{ fontSize: 13, color: "var(--fg-2)", flex: 1, minWidth: 0 }}
      >
        <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>
          {row.handle}
        </span>{" "}
        {row.verb}{" "}
        <span style={{ color: "var(--fg-1)" }}>
          {row.kind === "join" ? row.target : `“${row.target}”`}
        </span>
        {row.count !== undefined && (
          <span style={{ color: "var(--fg-3)" }}> · {row.count}×</span>
        )}
      </span>
      <span
        className="t-mono-s"
        style={{ color: "var(--fg-4)", flexShrink: 0 }}
      >
        now
      </span>
    </div>
  );
}

// Tiny inline glyphs for the activity icons so we don't pull
// from the full Icon registry for sizes that don't matter
// outside this surface.
function HeartGlyph() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7-4.35-9.5-9.27C.97 8.71 2.42 5 6 5c2 0 3.5 1.16 4 2.5C10.5 6.16 12 5 14 5c3.58 0 5.03 3.71 3.5 6.73C19 16.65 12 21 12 21z" />
    </svg>
  );
}
function PlayGlyph() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function UsersGlyph() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

/* ============================================================
   Shared — panel header pill (Old way / Wavloops server)
   ============================================================ */

function PanelHeader({
  tone,
  label,
}: {
  tone: "danger" | "accent";
  label: string;
}) {
  const bg =
    tone === "danger"
      ? "color-mix(in oklch, var(--danger) 14%, transparent)"
      : "var(--accent-surface)";
  const fg = tone === "danger" ? "var(--danger)" : "var(--accent-text)";
  return (
    <div
      className="t-mono inline-flex items-center"
      style={{
        gap: 8,
        padding: "5px 10px",
        borderRadius: "var(--r-pill)",
        background: bg,
        color: fg,
        position: "relative",
        zIndex: 2,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--r-pill)",
          background: fg,
        }}
      />
      {label}
    </div>
  );
}
