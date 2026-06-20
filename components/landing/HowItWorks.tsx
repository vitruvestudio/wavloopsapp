/**
 * Landing — Section 03. How it works.
 *
 * The producer just felt the pain (Section 2). Now we reassure
 * with the mechanism — three concrete steps, each one carrying
 * a real-looking app mockup so the visitor can SEE the product
 * before they sign up. Theo's brief:
 *
 *   Step 1 — Build your server         (catalog visual)
 *   Step 2 — Share one link            (artist-side phone view)
 *   Step 3 — See who's vibing          (tracking dashboard,
 *                                       this is the 'magic
 *                                       moment' — live counter,
 *                                       activity feed)
 *
 * The order narrates: I create → I share → I see results.
 *
 * Layout
 * ──────
 * Editorial section header + three StepBlocks in alternating
 * 2-column layout on desktop (visual left / text right /
 * visual right / text left / visual left / text right). Each
 * StepBlock stacks vertically on mobile (visual on top, text
 * below) so the visitor still gets a clean reading order.
 */

"use client";

import * as React from "react";

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Subtle accent halo low-centre — picks up the bottom of
              the Problem section's central glow so the page reads
              continuous as the visitor scrolls past. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 50% 0%, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.3,
        }}
      />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        <SectionHeader />

        {/* Steps — alternating visual side at desktop, stacked
                vertical on mobile. Big vertical gap between
                steps so each one feels like its own beat. */}
        <div
          className="flex flex-col"
          style={{ marginTop: "clamp(56px, 8vw, 96px)", gap: "clamp(80px, 10vw, 140px)" }}
        >
          <StepBlock
            n="01"
            title="Build your server"
            hook="Upload your beats, organize them your way."
            description="Drop your beats into a server. Tag them, name them, done. Your catalog lives in one place — always."
            visualSide="left"
          >
            <LibraryMockup />
          </StepBlock>

          <StepBlock
            n="02"
            title="Share one link"
            hook="One link. Send it once."
            description="Share your server link with your artists. They get in with their email — no app to download, no friction. Public or private, you choose who's in."
            visualSide="right"
          >
            <ArtistPhoneMockup />
          </StepBlock>

          <StepBlock
            n="03"
            title="See who's vibing"
            hook="Watch it happen in real time."
            description="Every listen, every like, every artist — tracked live. You know exactly who's into what, and who's ready to lock in."
            visualSide="left"
          >
            <TrackingMockup />
          </StepBlock>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Editorial section header — 03 / HOW IT WORKS
   ============================================================ */

function SectionHeader() {
  return (
    <div className="flex flex-col" style={{ gap: 28 }}>
      <div className="flex items-center" style={{ gap: 18 }}>
        <span className="t-mono" style={{ color: "var(--accent-text)" }}>
          03
        </span>
        <span
          aria-hidden="true"
          style={{ height: 1, flex: 1, background: "var(--border-1)" }}
        />
        <span className="t-mono" style={{ color: "var(--fg-3)" }}>
          How it works
        </span>
      </div>

      <h2
        id="how-title"
        className="t-display"
        style={{
          fontSize: "clamp(36px, 4.4vw, 56px)",
          lineHeight: 1.04,
          maxWidth: 880,
        }}
      >
        Up and running in{" "}
        <span
          style={{
            color: "var(--accent-text)",
            textShadow: "0 0 32px var(--accent-glow)",
          }}
        >
          minutes
        </span>
        .
      </h2>

      <p
        className="t-body-l"
        style={{
          fontSize: 19,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          maxWidth: 640,
        }}
      >
        Three steps. One link. Zero hassle.
      </p>
    </div>
  );
}

/* ============================================================
   StepBlock — alternating 2-column layout
   ============================================================ */

function StepBlock({
  n,
  title,
  hook,
  description,
  visualSide,
  children,
}: {
  n: string;
  title: string;
  hook: string;
  description: string;
  visualSide: "left" | "right";
  children: React.ReactNode;
}) {
  // Desktop alternates visual L/R via `md:order-last` on the
  // visual when it should sit on the right. Mobile keeps the
  // DOM order (visual first → text below) regardless of side
  // so the reading flow stays consistent and the visitor
  // always sees the screen before the copy.
  const visualOrderClass = visualSide === "right" ? "md:order-last" : "";
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 items-center"
      style={{ gap: "clamp(32px, 5vw, 64px)" }}
    >
      <div
        className={`relative flex items-center justify-center min-w-0 ${visualOrderClass}`}
      >
        {children}
      </div>
      <div className="flex flex-col">
        <span
          className="t-mono"
          style={{
            color: "var(--accent-text)",
            fontSize: 13,
            letterSpacing: "0.16em",
          }}
        >
          STEP {n}
        </span>
        <h3
          className="t-h1"
          style={{
            marginTop: 16,
            fontSize: "clamp(28px, 3.2vw, 40px)",
            lineHeight: 1.08,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h3>
        <p
          className="t-title"
          style={{
            marginTop: 14,
            color: "var(--accent-text)",
            fontSize: 17,
            lineHeight: 1.45,
          }}
        >
          {hook}
        </p>
        <p
          className="t-body-l"
          style={{
            marginTop: 14,
            color: "var(--fg-2)",
            fontSize: 16,
            lineHeight: 1.6,
            maxWidth: 460,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MOCKUP 1 — Beat library
   ============================================================ */

function LibraryMockup() {
  return (
    <MockupFrame caption="Library · 47 beats">
      {/* Header strip */}
      <div
        className="flex items-center"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-1)",
          background: "var(--bg-1)",
          gap: 10,
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 26,
            height: 26,
            borderRadius: "var(--r-sm)",
            background: "var(--accent-surface)",
            color: "var(--accent-text)",
          }}
        >
          <LibraryGlyph />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="t-title" style={{ fontSize: 13 }}>
            Beat library
          </span>
          <span className="t-mono" style={{ color: "var(--fg-4)", fontSize: 9, marginTop: 2 }}>
            47 BEATS · 3 SERVERS
          </span>
        </div>
        <span
          className="t-mono inline-flex items-center"
          style={{
            gap: 5,
            padding: "4px 10px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            fontSize: 9,
          }}
        >
          <PlusGlyph /> Upload
        </span>
      </div>

      {/* Filter chip row */}
      <div
        className="flex items-center"
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border-1)",
          gap: 6,
          overflow: "hidden",
        }}
      >
        {["All", "Trap", "RnB", "Lo-fi"].map((c, i) => (
          <span
            key={c}
            className="t-mono"
            style={{
              padding: "4px 10px",
              borderRadius: "var(--r-pill)",
              background: i === 0 ? "var(--accent-surface)" : "var(--bg-2)",
              color: i === 0 ? "var(--accent-text)" : "var(--fg-3)",
              fontSize: 9,
              border: "1px solid var(--border-1)",
            }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Beat rows */}
      <BeatLibraryRow
        cover="violet"
        title="Midnight Drift"
        meta="142 BPM · F MIN"
        tags={["TRAP", "DARK"]}
      />
      <BeatLibraryRow
        cover="pink"
        title="Velvet"
        meta="98 BPM · A MIN"
        tags={["RNB", "LUSH"]}
        playing
      />
      <BeatLibraryRow
        cover="ok"
        title="Honeybloom"
        meta="110 BPM · C MAJ"
        tags={["POP", "HAPPY"]}
      />

      {/* Add-more affordance */}
      <div
        className="flex items-center justify-center t-mono"
        style={{
          padding: 14,
          borderTop: "1px dashed var(--border-2)",
          color: "var(--fg-4)",
          gap: 6,
          fontSize: 10,
        }}
      >
        <PlusGlyph /> Drop more beats here
      </div>
    </MockupFrame>
  );
}

function BeatLibraryRow({
  cover,
  title,
  meta,
  tags,
  playing,
}: {
  cover: "violet" | "pink" | "ok";
  title: string;
  meta: string;
  tags: string[];
  playing?: boolean;
}) {
  const COVER_BG: Record<string, string> = {
    violet:
      "linear-gradient(135deg, oklch(0.55 0.22 290) 0%, oklch(0.4 0.18 280) 100%)",
    pink: "linear-gradient(135deg, oklch(0.65 0.22 350) 0%, oklch(0.5 0.18 340) 100%)",
    ok: "linear-gradient(135deg, oklch(0.65 0.18 160) 0%, oklch(0.5 0.14 155) 100%)",
  };
  return (
    <div
      className="flex items-center"
      style={{
        padding: "12px 16px",
        gap: 12,
        borderTop: "1px solid var(--border-1)",
        background: playing ? "var(--accent-surface)" : "transparent",
      }}
    >
      {/* Cover */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--r-md)",
          background: COVER_BG[cover],
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        {playing ? <ActiveEqMini /> : <PlayMini />}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="t-title"
          style={{
            fontSize: 13,
            color: playing ? "var(--accent-text)" : "var(--fg-1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
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
      <div className="flex items-center" style={{ gap: 4 }}>
        {tags.map((t) => (
          <span
            key={t}
            className="t-mono"
            style={{
              padding: "3px 6px",
              borderRadius: "var(--r-pill)",
              background: "var(--bg-2)",
              color: "var(--fg-3)",
              fontSize: 8.5,
              border: "1px solid var(--border-1)",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   MOCKUP 2 — Artist phone view
   ============================================================ */

function ArtistPhoneMockup() {
  return (
    <div
      className="relative"
      style={{
        width: "100%",
        maxWidth: 320,
        aspectRatio: "9 / 17.5",
        // Phone frame
        background: "linear-gradient(180deg, #0a0a0d 0%, #14141a 100%)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 38,
        padding: 12,
        boxShadow:
          "0 50px 100px -30px oklch(0 0 0 / 0.8), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px -20px var(--accent-glow)",
      }}
    >
      {/* Notch — faux camera island, sells the phone-ness */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          top: 22,
          left: "50%",
          transform: "translateX(-50%)",
          width: 92,
          height: 26,
          borderRadius: "var(--r-pill)",
          background: "#000",
          zIndex: 3,
        }}
      />

      {/* Inner screen */}
      <div
        className="relative h-full"
        style={{
          background: "var(--bg-0)",
          borderRadius: 26,
          overflow: "hidden",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "14px 22px 0",
            color: "var(--fg-1)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          }}
        >
          <span>9:41</span>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <SignalGlyph /> <BatteryGlyph />
          </span>
        </div>

        {/* URL pill — looks like Safari URL bar */}
        <div
          className="flex items-center"
          style={{
            margin: "36px 12px 12px",
            padding: "6px 10px",
            background: "var(--bg-1)",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--border-1)",
            gap: 6,
          }}
        >
          <LockGlyph />
          <span
            className="t-mono"
            style={{
              color: "var(--fg-2)",
              fontSize: 9,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            wavloops.co/s/atl-nights
          </span>
        </div>

        {/* Server hero */}
        <div style={{ padding: "8px 14px" }}>
          <div
            className="relative flex items-end justify-start"
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: "var(--r-lg)",
              background:
                "linear-gradient(135deg, var(--accent) 0%, oklch(0.42 0.16 268) 100%)",
              padding: 14,
              boxShadow:
                "0 12px 32px -12px var(--accent-glow), inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            {/* Mini eq pattern in background */}
            <div
              aria-hidden="true"
              className="absolute"
              style={{
                inset: 0,
                opacity: 0.25,
                background:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0 3px, transparent 3px 11px)",
                maskImage:
                  "linear-gradient(to top, black 30%, transparent 80%)",
                WebkitMaskImage:
                  "linear-gradient(to top, black 30%, transparent 80%)",
              }}
            />
            <div className="flex flex-col" style={{ gap: 4, zIndex: 1 }}>
              <span
                style={{
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: "-0.015em",
                }}
              >
                Atlanta Nights
              </span>
              <span
                className="t-mono"
                style={{ color: "rgba(255,255,255,0.85)", fontSize: 8.5 }}
              >
                12 ARTISTS · 4 BEATS
              </span>
            </div>
          </div>
        </div>

        {/* Beat list */}
        <div style={{ padding: "8px 14px" }}>
          <PhoneBeatRow title="Midnight Drift" bpm="142" liked />
          <PhoneBeatRow title="Velvet" bpm="98" playing />
          <PhoneBeatRow title="Honeybloom" bpm="110" />
        </div>

        {/* Sticky bottom CTA — emulates an in-app sticky button */}
        <div
          className="absolute"
          style={{
            left: 0,
            right: 0,
            bottom: 14,
            padding: "0 14px",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              padding: "12px 14px",
              background: "var(--accent)",
              color: "var(--accent-fg)",
              borderRadius: "var(--r-pill)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 13,
              gap: 8,
              boxShadow:
                "0 12px 28px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <SparkGlyph /> Join server
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneBeatRow({
  title,
  bpm,
  playing,
  liked,
}: {
  title: string;
  bpm: string;
  playing?: boolean;
  liked?: boolean;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: "10px 0",
        gap: 10,
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 28,
          height: 28,
          borderRadius: "var(--r-pill)",
          background: playing ? "var(--accent)" : "var(--bg-2)",
          color: playing ? "#fff" : "var(--fg-2)",
          boxShadow: playing ? "0 0 14px var(--accent-glow)" : "none",
        }}
      >
        {playing ? <PauseMini /> : <PlayMini />}
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
          style={{ color: "var(--fg-4)", fontSize: 8.5, marginTop: 2 }}
        >
          {bpm} BPM
        </div>
      </div>
      <span
        aria-hidden="true"
        className="flex items-center justify-center"
        style={{
          width: 22,
          height: 22,
          borderRadius: "var(--r-pill)",
          color: liked ? "oklch(0.7 0.2 22)" : "var(--fg-4)",
        }}
      >
        <HeartMini filled={liked} />
      </span>
    </div>
  );
}

/* ============================================================
   MOCKUP 3 — Tracking dashboard (the magic moment)
   ============================================================ */

const ACTIVITY_POOL = [
  { handle: "@yuki", verb: "liked", target: "Midnight Drift", kind: "like" as const },
  { handle: "@kai", verb: "played", target: "Velvet", count: 3, kind: "play" as const },
  { handle: "@elara", verb: "joined", target: "the server", kind: "join" as const },
  { handle: "@mae", verb: "played", target: "Honeybloom", count: 7, kind: "play" as const },
  { handle: "@rin", verb: "liked", target: "Cobalt", kind: "like" as const },
] as const;

function TrackingMockup() {
  const [plays, setPlays] = React.useState(3420);
  React.useEffect(() => {
    const id = setInterval(
      () => setPlays((p) => p + 1 + Math.floor(Math.random() * 4)),
      3500,
    );
    return () => clearInterval(id);
  }, []);

  const [head, setHead] = React.useState(2);
  React.useEffect(() => {
    const id = setInterval(
      () => setHead((h) => (h + 1) % ACTIVITY_POOL.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);
  const visibleActivity = [
    ACTIVITY_POOL[head],
    ACTIVITY_POOL[(head - 1 + ACTIVITY_POOL.length) % ACTIVITY_POOL.length],
    ACTIVITY_POOL[(head - 2 + ACTIVITY_POOL.length) % ACTIVITY_POOL.length],
  ];

  return (
    <MockupFrame caption="Tracking · Atlanta Nights" accent>
      {/* Window strip */}
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
            maxWidth: 280,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 10,
          }}
        >
          wavloops.co/dashboard
        </span>
      </div>

      {/* Stats strip with sparkline */}
      <div
        className="grid"
        style={{
          padding: "16px 18px",
          gap: 14,
          borderBottom: "1px solid var(--border-1)",
          gridTemplateColumns: "1fr 1fr 1.6fr",
          background: "var(--bg-inset)",
          alignItems: "center",
        }}
      >
        <StatBig
          label="Plays"
          value={plays.toLocaleString("en-US")}
          delta="+12%"
          highlight
        />
        <StatBig label="Likes" value="88" delta="+5%" />
        <Sparkline />
      </div>

      {/* Live activity feed */}
      <div style={{ padding: "12px 18px" }}>
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
        {visibleActivity.map((row, i) => (
          <DashboardActivityRow
            key={`${head}-${i}`}
            row={row}
            animateIn={i === 0}
            fadeOut={i === 2}
          />
        ))}
      </div>

      {/* Top fan callout */}
      <div
        className="flex items-center"
        style={{
          padding: "14px 18px",
          gap: 12,
          borderTop: "1px solid var(--border-1)",
          background: "var(--bg-1)",
        }}
      >
        <span
          aria-hidden="true"
          className="t-mono"
          style={{
            padding: "3px 8px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent-surface)",
            color: "var(--accent-text)",
            fontSize: 9,
          }}
        >
          Top fan
        </span>
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
              fontSize: 12.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            kayde.mgmt@gmail.com
          </div>
          <div
            className="t-mono"
            style={{ color: "var(--fg-4)", fontSize: 9, marginTop: 3 }}
          >
            154 PLAYS · 12 LIKES
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

function StatBig({
  label,
  value,
  delta,
  highlight,
}: {
  label: string;
  value: string;
  delta: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      <div className="flex items-baseline" style={{ gap: 6 }}>
        <span
          className="t-h2"
          style={{
            fontSize: 22,
            color: highlight ? "var(--accent-text)" : "var(--fg-1)",
            textShadow: highlight ? "0 0 18px var(--accent-glow)" : "none",
            fontVariantNumeric: "tabular-nums",
            transition: "color 0.2s var(--ease-out)",
          }}
        >
          {value}
        </span>
        <span
          className="t-mono"
          style={{ color: "var(--ok)", fontSize: 10 }}
        >
          {delta}
        </span>
      </div>
      <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
        {label}
      </span>
    </div>
  );
}

function Sparkline() {
  // Static SVG sparkline — 30 bars climbing left-to-right with
  // some wave to it. Reads as 'plays trending up'.
  const BARS = 24;
  return (
    <div
      className="flex items-end justify-end"
      style={{ height: 50, gap: 3 }}
    >
      {Array.from({ length: BARS }).map((_, i) => {
        const t = i / (BARS - 1);
        const noise = Math.sin(i * 0.85) * 0.15;
        const h = Math.max(0.18, 0.3 + t * 0.65 + noise);
        const fill = i >= BARS - 3 ? "var(--accent)" : i >= BARS - 8 ? "var(--accent-text)" : "var(--fg-4)";
        return (
          <span
            key={i}
            style={{
              width: 4,
              height: `${h * 100}%`,
              background: fill,
              borderRadius: 2,
              transformOrigin: "bottom",
              opacity: i >= BARS - 8 ? 1 : 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

function DashboardActivityRow({
  row,
  animateIn,
  fadeOut,
}: {
  row: (typeof ACTIVITY_POOL)[number];
  animateIn: boolean;
  fadeOut: boolean;
}) {
  const tone =
    row.kind === "like"
      ? { bg: "color-mix(in oklch, oklch(0.7 0.2 22) 18%, transparent)", fg: "oklch(0.78 0.18 22)" }
      : row.kind === "play"
        ? { bg: "var(--accent-surface)", fg: "var(--accent-text)" }
        : { bg: "var(--ok-surface)", fg: "var(--ok)" };
  const Icon =
    row.kind === "like" ? HeartMini : row.kind === "play" ? PlayMini : UsersMini;
  return (
    <div
      className="flex items-center"
      style={{
        gap: 10,
        padding: "8px 0",
        opacity: fadeOut ? 0.4 : 1,
        animation: animateIn
          ? "wl-row-in 0.5s var(--ease-out) both"
          : undefined,
        transition: "opacity 0.4s var(--ease-out)",
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 24,
          height: 24,
          borderRadius: "var(--r-pill)",
          background: tone.bg,
          color: tone.fg,
        }}
      >
        <Icon />
      </span>
      <span
        className="t-body"
        style={{ fontSize: 12.5, color: "var(--fg-2)", flex: 1, minWidth: 0 }}
      >
        <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>{row.handle}</span>{" "}
        {row.verb}{" "}
        <span style={{ color: "var(--fg-1)" }}>
          {row.kind === "join" ? row.target : `“${row.target}”`}
        </span>
        {"count" in row && row.count !== undefined && (
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

/* ============================================================
   Shared mockup frame
   ============================================================ */

function MockupFrame({
  children,
  caption,
  accent,
}: {
  children: React.ReactNode;
  caption?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="relative"
      style={{
        width: "100%",
        maxWidth: 520,
        background:
          "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        border: accent
          ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
          : "1px solid var(--border-1)",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        boxShadow: accent
          ? "0 40px 80px -22px oklch(0 0 0 / 0.7), 0 0 50px -10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 40px 80px -22px oklch(0 0 0 / 0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {children}
      {caption && (
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            bottom: -28,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "var(--fg-4)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Glyphs
   ============================================================ */

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

function LibraryGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 17V5l11-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="15" r="3" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PlayMini() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseMini() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}

function HeartMini({ filled }: { filled?: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M12 21s-7-4.35-9.5-9.27C.97 8.71 2.42 5 6 5c2 0 3.5 1.16 4 2.5C10.5 6.16 12 5 14 5c3.58 0 5.03 3.71 3.5 6.73C19 16.65 12 21 12 21z" />
    </svg>
  );
}

function UsersMini() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function ActiveEqMini() {
  return (
    <span
      className="flex items-end shrink-0"
      style={{ gap: 2, height: 14 }}
      aria-hidden="true"
    >
      {[0, 0.12, 0.24].map((d, i) => (
        <span
          key={i}
          style={{
            width: 2.5,
            height: "100%",
            background: "#fff",
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

function LockGlyph() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM10 6a2 2 0 0 1 4 0v2h-4V6z" />
    </svg>
  );
}

function SignalGlyph() {
  return (
    <svg width={14} height={10} viewBox="0 0 24 16" fill="currentColor" aria-hidden="true">
      <rect x="0" y="11" width="3" height="5" rx="0.5" />
      <rect x="5" y="8" width="3" height="8" rx="0.5" />
      <rect x="10" y="4" width="3" height="12" rx="0.5" />
      <rect x="15" y="0" width="3" height="16" rx="0.5" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <svg width={18} height={10} viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <rect x="1" y="1" width="20" height="12" rx="2" />
      <rect x="22.5" y="5" width="2" height="4" rx="0.5" fill="currentColor" />
      <rect x="3" y="3" width="16" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

function SparkGlyph() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
