/**
 * Landing — Section 02. The problem (and its verbatim).
 *
 * The hero sells the promise. This section grounds it in the
 * felt pain — the bit that makes the visitor say "yeah that's
 * exactly me". Structure top → bottom:
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │   The beat-sending headache ends here.                 │
 *   │   ―――――――――――――――――――――――――――――――――――――――――――――――――   │
 *   │   "Organizing contacts and keeping track of who I      │
 *   │    already sent stuff to is a huge headache. It takes  │
 *   │    too much time away from actually producing."        │
 *   │                                  — a producer          │
 *   │                                                        │
 *   │   ┌─── ❌ WITHOUT WAVLOOPS ───┐  ┌─── ✅ WITH WAVLOOPS ─┐│
 *   │   │ × Re-send the pack ev…    │  │ ✓ One link that upd…││
 *   │   │ × WeTransfer expires …    │  │ ✓ Permanent server  ││
 *   │   │ × You guess who liked…    │  │ ✓ See who listens,  ││
 *   │   │ × Contacts scattered …    │  │ ✓ One address book  ││
 *   │   │ × "Did you get my pa…"    │  │ ✓ Artists check on  ││
 *   │   └───────────────────────────┘  └─────────────────────┘│
 *   └────────────────────────────────────────────────────────┘
 *
 * Design notes
 * ────────────
 * - Headline echoes the hero's typographic move: a span in
 *   --accent-text on the resolution word ("ends here") so the
 *   eye lands on the answer, not on the problem.
 * - The quote is editorial: italic body-l + a left-side accent
 *   bar instead of a giant quote glyph. Reads as testimony, not
 *   as a marketing pull-quote.
 * - The two cards are PARALLEL — same row count, mirrored copy
 *   length, so the scan reads as one-to-one substitution. The
 *   left card uses fg-3 + danger-tinted x; the right card uses
 *   fg-1 + accent-text check. Same surface tone, opposite tag.
 */

import * as React from "react";
import { Icon } from "@/components/ui/Icon";

const PAIRS: Array<{ before: string; after: string }> = [
  {
    before: "Re-send the full pack every time you upload one beat",
    after: "One link that updates itself the moment you drop a beat",
  },
  {
    before: "WeTransfer expires in 7 days — re-send, re-send, re-send",
    after: "Permanent server, no expiry, no re-uploads",
  },
  {
    before: "You guess who actually liked what (or just hope they did)",
    after: "See exactly who listened, who liked, and how many times",
  },
  {
    before: "Contacts scattered across DMs, email, Discord, IG",
    after: "One address book — every artist you've ever worked with",
  },
  {
    before: "“Hey did you get my new pack?” every other week",
    after: "Artists check on their own, on their own time",
  },
];

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
        style={{
          maxWidth: 1120,
          padding: "0 24px",
        }}
      >
        {/* ─── Headline + quote ─── */}
        <div
          className="mx-auto text-center"
          style={{ maxWidth: 780, marginBottom: 72 }}
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

          {/* Editorial quote — accent left-bar, italic body. Lets
                  the verbatim do the emotional work without
                  decorating it with a giant quote glyph. */}
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

        {/* ─── Before / After cards ─── */}
        <div
          className="grid"
          style={{
            // 1 col on mobile, 2 col from md+. CSS grid + minmax
            // handles the breakpoint without a JS branch.
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
            gap: 20,
          }}
        >
          <ContrastCard variant="before" />
          <ContrastCard variant="after" />
        </div>
      </div>
    </section>
  );
}

/* ───────── Contrast card ───────── */

function ContrastCard({ variant }: { variant: "before" | "after" }) {
  const isBefore = variant === "before";
  return (
    <div
      style={{
        background: isBefore
          ? "var(--bg-1)"
          : "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
        border: isBefore
          ? "1px solid var(--border-1)"
          : "1px solid color-mix(in oklch, var(--accent-text) 28%, transparent)",
        borderRadius: "var(--r-xl)",
        padding: 28,
        boxShadow: isBefore ? "none" : "var(--shadow-md)",
      }}
    >
      {/* Header — mono uppercase, color-coded so the contrast
              reads at-a-glance before the eye scans the bullets. */}
      <div
        className="t-mono inline-flex items-center"
        style={{
          gap: 8,
          padding: "5px 10px",
          borderRadius: "var(--r-pill)",
          background: isBefore
            ? "color-mix(in oklch, var(--danger) 14%, transparent)"
            : "var(--accent-surface)",
          color: isBefore ? "var(--danger)" : "var(--accent-text)",
          marginBottom: 22,
        }}
      >
        <Icon name={isBefore ? "x" : "check"} size={13} />
        {isBefore ? "Without Wavloops" : "With Wavloops"}
      </div>

      <ul
        className="flex flex-col"
        style={{ gap: 14, listStyle: "none", padding: 0, margin: 0 }}
      >
        {PAIRS.map((p, i) => (
          <li
            key={i}
            className="flex items-start"
            style={{ gap: 12 }}
          >
            <span
              aria-hidden="true"
              className="flex items-center justify-center shrink-0"
              style={{
                width: 22,
                height: 22,
                borderRadius: "var(--r-pill)",
                marginTop: 1,
                background: isBefore
                  ? "color-mix(in oklch, var(--danger) 16%, transparent)"
                  : "var(--accent-surface)",
                color: isBefore ? "var(--danger)" : "var(--accent-text)",
              }}
            >
              <Icon name={isBefore ? "x" : "check"} size={12} />
            </span>
            <span
              className={isBefore ? "t-body" : "t-body-l"}
              style={{
                color: isBefore ? "var(--fg-3)" : "var(--fg-1)",
                fontSize: 15,
                lineHeight: 1.55,
                textDecoration: isBefore ? "line-through" : "none",
                textDecorationColor: isBefore
                  ? "color-mix(in oklch, var(--danger) 40%, transparent)"
                  : undefined,
                textDecorationThickness: isBefore ? "1px" : undefined,
              }}
            >
              {isBefore ? p.before : p.after}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
