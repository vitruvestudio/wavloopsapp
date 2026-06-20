/**
 * Landing — Section 02. The problem (narrative reframe).
 *
 * First draft of this section was a generic ❌/✅ bullet list —
 * AI-template feel that didn't deserve to ship next to a real
 * product. This rewrite swaps the bullets for a SCENE:
 *
 *   LEFT — a chaos collage. Four mini-cards stand in for the
 *           tools the producer is currently glueing together:
 *           an expired WeTransfer, an IG DM ("did u send the
 *           pack??"), a Gmail thread with seven Re:Re:Re: in
 *           the subject line, a Discord ping. They sit on a
 *           desaturated canvas, slightly tilted, edges crossing
 *           each other — visually unresolved.
 *   RIGHT — a single mini-mockup of a Wavloops server, in the
 *           full brand palette: cover-art square, PRIVATE +
 *           LIVE pills, "47 BEATS · 12 ARTISTS · 3,420 PLAYS"
 *           mono strip, two live activity rows underneath
 *           ("@yuki liked Midnight Drift", "@kai played
 *           Velvet 3×"). One frame, one source of truth.
 *
 * The contrast is read in under a second: messy collage vs. a
 * single calm panel. No bullets needed — the eye does the
 * before/after work itself.
 *
 * Header copy unchanged from the previous draft:
 *   Title:   "The beat-sending headache ends here."
 *   Quote:   producer verbatim, italic, accent left-bar.
 */

import * as React from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

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

        {/* ─── Scene: chaos (left) vs Wavloops (right) ─── */}
        <div
          className="grid items-stretch"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
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
        minHeight: 460,
        padding: 28,
      }}
    >
      {/* Header pill — danger tinted */}
      <div
        className="t-mono inline-flex items-center"
        style={{
          gap: 8,
          padding: "5px 10px",
          borderRadius: "var(--r-pill)",
          background: "color-mix(in oklch, var(--danger) 14%, transparent)",
          color: "var(--danger)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Icon name="x" size={13} />
        The old way
      </div>

      {/* Collage area — relative positioned mini-cards, each one
              a stand-in for a real tool the producer is bouncing
              between today. Sized & tilted so they overlap a bit,
              which sells the "scattered" feel without literal
              chaos. */}
      <div
        className="relative"
        style={{
          marginTop: 28,
          height: 360,
        }}
      >
        {/* WeTransfer — top-left, expired */}
        <ChaosCard
          style={{
            top: 0,
            left: "2%",
            width: "62%",
            transform: "rotate(-3deg)",
          }}
        >
          <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
            <SquareIcon tone="cyan">
              <Icon name="link" size={14} />
            </SquareIcon>
            <span className="t-mono" style={{ color: "var(--fg-3)" }}>
              wetransfer
            </span>
            <span
              className="t-mono"
              style={{
                marginLeft: "auto",
                color: "var(--danger)",
                background:
                  "color-mix(in oklch, var(--danger) 18%, transparent)",
                padding: "3px 8px",
                borderRadius: "var(--r-pill)",
              }}
            >
              Expired
            </span>
          </div>
          <div
            className="t-title"
            style={{ color: "var(--fg-2)", fontSize: 14 }}
          >
            beats-v3-final-FINAL.zip
          </div>
          <div className="t-mono-s" style={{ color: "var(--fg-4)", marginTop: 6 }}>
            312 MB · sent 9 days ago
          </div>
        </ChaosCard>

        {/* Instagram DM — middle-right */}
        <ChaosCard
          style={{
            top: 70,
            right: "2%",
            width: "58%",
            transform: "rotate(2.5deg)",
          }}
        >
          <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
            <SquareIcon tone="pink">
              <Icon name="instagram" size={14} />
            </SquareIcon>
            <span className="t-mono" style={{ color: "var(--fg-3)" }}>
              @prodbyleo
            </span>
            <span
              className="t-mono-s"
              style={{ marginLeft: "auto", color: "var(--fg-4)" }}
            >
              2d
            </span>
          </div>
          <div
            className="t-body"
            style={{
              color: "var(--fg-2)",
              fontSize: 13.5,
              background: "var(--bg-2)",
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              display: "inline-block",
            }}
          >
            yo did u send the pack?? can&apos;t find anything
          </div>
        </ChaosCard>

        {/* Gmail thread — bottom-left */}
        <ChaosCard
          style={{
            bottom: 4,
            left: 0,
            width: "66%",
            transform: "rotate(-1.5deg)",
          }}
        >
          <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
            <SquareIcon tone="red">
              <Icon name="mail" size={14} />
            </SquareIcon>
            <span className="t-mono" style={{ color: "var(--fg-3)" }}>
              gmail
            </span>
            <span
              className="t-mono-s"
              style={{ marginLeft: "auto", color: "var(--fg-4)" }}
            >
              7 new
            </span>
          </div>
          <div
            className="t-title"
            style={{ color: "var(--fg-2)", fontSize: 14 }}
          >
            Re: Re: Re: BEATS V2 (FINAL FINAL)
          </div>
          <div className="t-mono-s" style={{ color: "var(--fg-4)", marginTop: 6 }}>
            From: kai · 14 sep
          </div>
        </ChaosCard>

        {/* Discord ping — bottom-right */}
        <ChaosCard
          style={{
            bottom: 36,
            right: "6%",
            width: "44%",
            transform: "rotate(3deg)",
          }}
        >
          <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
            <SquareIcon tone="violet">
              <Icon name="users" size={14} />
            </SquareIcon>
            <span className="t-mono" style={{ color: "var(--fg-3)" }}>
              discord
            </span>
            <span
              aria-hidden="true"
              className="t-mono-s"
              style={{
                marginLeft: "auto",
                background: "var(--danger)",
                color: "var(--accent-fg)",
                padding: "1px 6px",
                borderRadius: "var(--r-pill)",
                fontSize: 9,
              }}
            >
              3
            </span>
          </div>
          <div
            className="t-body"
            style={{ color: "var(--fg-2)", fontSize: 13 }}
          >
            drop ur pack again pls 🙏
          </div>
        </ChaosCard>

        {/* Bottom dim gradient — soft fade so the collage feels
                like it bleeds off the panel, deepens the chaos
                without literal motion blur. */}
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

function ChaosCard({
  style,
  children,
}: {
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-md)",
        padding: 14,
        boxShadow: "0 12px 32px -16px rgba(0,0,0,0.6)",
        // Slightly desaturated feel — chaos panel reads cooler
        // than the Wavloops panel.
        filter: "saturate(0.7)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SquareIcon({
  tone,
  children,
}: {
  tone: "cyan" | "pink" | "red" | "violet";
  children: React.ReactNode;
}) {
  const TONE_BG: Record<string, string> = {
    cyan: "oklch(0.55 0.13 220 / 0.22)",
    pink: "oklch(0.6 0.2 4 / 0.22)",
    red: "oklch(0.7 0.2 22 / 0.22)",
    violet: "oklch(0.55 0.22 290 / 0.24)",
  };
  const TONE_FG: Record<string, string> = {
    cyan: "oklch(0.78 0.13 220)",
    pink: "oklch(0.78 0.18 4)",
    red: "oklch(0.78 0.18 22)",
    violet: "oklch(0.78 0.18 290)",
  };
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: 26,
        height: 26,
        borderRadius: "var(--r-sm)",
        background: TONE_BG[tone],
        color: TONE_FG[tone],
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================
   RIGHT — Wavloops mini-mockup
   ============================================================ */

function WavloopsPanel() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        border:
          "1px solid color-mix(in oklch, var(--accent-text) 28%, transparent)",
        borderRadius: "var(--r-xl)",
        minHeight: 460,
        padding: 28,
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Soft top-right brand halo — same trick as the hero, makes
              the right side feel "lit" by the brand instead of
              just colored. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% -10%, var(--accent-glow) 0%, transparent 60%)",
          opacity: 0.5,
        }}
      />

      {/* Header pill — accent */}
      <div
        className="t-mono inline-flex items-center"
        style={{
          gap: 8,
          padding: "5px 10px",
          borderRadius: "var(--r-pill)",
          background: "var(--accent-surface)",
          color: "var(--accent-text)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Icon name="check" size={13} />
        Wavloops server
      </div>

      {/* Mini-mockup of a server detail surface. NOT a screenshot
              — a from-scratch composition using the real DS tokens
              so it matches the in-app aesthetic 1:1 without the
              maintenance cost of a literal PNG. */}
      <div
        className="relative"
        style={{
          marginTop: 24,
          background: "var(--bg-0)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
        }}
      >
        {/* Top app-window strip — three dots + faux URL pill,
                grounds the mockup as a real app shot. */}
        <div
          className="flex items-center"
          style={{
            padding: "10px 14px",
            gap: 8,
            borderBottom: "1px solid var(--border-1)",
            background: "var(--bg-1)",
          }}
        >
          <span style={dotStyle("oklch(0.7 0.2 22)")} />
          <span style={dotStyle("oklch(0.8 0.15 78)")} />
          <span style={dotStyle("oklch(0.78 0.16 152)")} />
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
            }}
          >
            wavloops.co/s/underground-trap
          </span>
        </div>

        {/* Server hero strip — cover + title + status pills */}
        <div
          className="flex items-center"
          style={{
            padding: 16,
            gap: 14,
            borderBottom: "1px solid var(--border-1)",
          }}
        >
          {/* Cover — gradient + waveform glyph as the visual hook */}
          <div
            className="relative flex items-center justify-center shrink-0"
            style={{
              width: 64,
              height: 64,
              borderRadius: "var(--r-md)",
              background:
                "linear-gradient(135deg, var(--accent) 0%, oklch(0.42 0.16 268) 100%)",
              boxShadow: "0 12px 32px -12px var(--accent-glow)",
            }}
          >
            <Icon name="waves" size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="t-title" style={{ fontSize: 15 }}>
              Underground Trap V3
            </div>
            <div
              className="flex items-center"
              style={{ gap: 8, marginTop: 6 }}
            >
              <Pill icon="lock" color="fg-2" bg="var(--bg-2)">
                Private
              </Pill>
              <Pill color="ok" bg="var(--ok-surface)" dot>
                Live
              </Pill>
            </div>
          </div>
        </div>

        {/* Stats strip — mono uppercase row */}
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
          <Stat label="Plays" value="3,420" />
        </div>

        {/* Live activity feed — 2 rows */}
        <div style={{ padding: 14 }}>
          <div
            className="t-mono"
            style={{ color: "var(--fg-4)", marginBottom: 10 }}
          >
            Live activity
          </div>
          <ActivityRow
            avatarTone="ok"
            handle="@yuki"
            verb="liked"
            target="Midnight Drift"
            ago="2m"
            icon="heart"
          />
          <ActivityRow
            avatarTone="accent"
            handle="@kai"
            verb="played"
            target="Velvet"
            count={3}
            ago="5m"
            icon="play"
          />
        </div>
      </div>
    </div>
  );
}

function dotStyle(color: string): React.CSSProperties {
  return {
    width: 9,
    height: 9,
    borderRadius: "var(--r-pill)",
    background: color,
    display: "inline-block",
  };
}

function Pill({
  icon,
  color,
  bg,
  children,
  dot = false,
}: {
  icon?: IconName;
  color: "ok" | "fg-2";
  bg: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  const fg = color === "ok" ? "var(--ok)" : "var(--fg-2)";
  return (
    <span
      className="inline-flex items-center t-mono"
      style={{
        gap: 6,
        padding: "3px 8px",
        borderRadius: "var(--r-pill)",
        background: bg,
        color: fg,
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "var(--r-pill)",
            background: fg,
            boxShadow: `0 0 8px ${fg}`,
          }}
        />
      )}
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 2 }}>
      <span className="t-h3" style={{ fontSize: 16 }}>
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
      style={{
        width: 1,
        height: 22,
        background: "var(--border-1)",
      }}
    />
  );
}

function ActivityRow({
  avatarTone,
  handle,
  verb,
  target,
  count,
  ago,
  icon,
}: {
  avatarTone: "ok" | "accent";
  handle: string;
  verb: string;
  target: string;
  count?: number;
  ago: string;
  icon: IconName;
}) {
  const tone =
    avatarTone === "ok"
      ? { bg: "var(--ok-surface)", fg: "var(--ok)" }
      : { bg: "var(--accent-surface)", fg: "var(--accent-text)" };
  return (
    <div
      className="flex items-center"
      style={{
        gap: 10,
        padding: "8px 4px",
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
        <Icon name={icon} size={13} />
      </span>
      <span className="t-body" style={{ fontSize: 13, color: "var(--fg-2)" }}>
        <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>{handle}</span>{" "}
        {verb}{" "}
        <span style={{ color: "var(--fg-1)" }}>&ldquo;{target}&rdquo;</span>
        {count !== undefined && (
          <span style={{ color: "var(--fg-3)" }}>
            {" "}
            · {count}×
          </span>
        )}
      </span>
      <span
        className="t-mono-s"
        style={{ marginLeft: "auto", color: "var(--fg-4)" }}
      >
        {ago}
      </span>
    </div>
  );
}
