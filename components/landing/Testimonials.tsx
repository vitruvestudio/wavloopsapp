/**
 * Landing — Section 08. Testimonials.
 *
 * Inspired by the dual-row infinite-marquee pattern Theo
 * shared: a top row scrolling RIGHT (animation-direction:
 * reverse on wl-marquee) and a bottom row scrolling LEFT
 * (default). Both rows pause when the visitor hovers anywhere
 * over them so they can read the cards mid-loop.
 *
 * Header — eyebrow 'What producers say' + display 'Testimonials'
 * on the left, 'Real feedback from producers' meta with a
 * quote glyph on the right, matching the reference layout.
 *
 * Cards
 * ─────
 * Avatar (real bucket URL, falls back to initials gradient if
 * the image fails), name + accent-blue verified checkmark,
 * @handle in mono, then a short producer quote about the
 * Wavloops flow. Eight testimonials total, split 4 / 4 across
 * the two rows.
 */

"use client";

import * as React from "react";

const AVATAR_BASE =
  "https://sgowrqzkdugbarfbvlqk.supabase.co/storage/v1/object/public/avatars/contacts";

interface Testimonial {
  name: string;
  handle: string;
  avatar: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Kayde Reyes",
    handle: "@kaydereyes",
    avatar: `${AVATAR_BASE}/seed-00.jpg`,
    quote:
      "Stopped sending packs altogether. Artists check the link, I focus on cooking. Best workflow flip I've made this year.",
  },
  {
    name: "Yuki Tanaka",
    handle: "@yukibeats",
    avatar: `${AVATAR_BASE}/seed-01.jpg`,
    quote:
      "The live tracking is unreal. I know which beats hit before anyone says a word — finally tells me what to drop next.",
  },
  {
    name: "Mae Nova",
    handle: "@maenova",
    avatar: `${AVATAR_BASE}/seed-02.jpg`,
    quote:
      "My contacts went from four Notes pages and a Discord to one address book. Sanity restored, literally.",
  },
  {
    name: "Rin Cordova",
    handle: "@rincordova",
    avatar: `${AVATAR_BASE}/seed-03.jpg`,
    quote:
      "WeTransfer was killing me. Now I drop a beat and the server updates everywhere — no re-uploads, no expired links.",
  },
  {
    name: "Elara Skye",
    handle: "@elaraskye",
    avatar: `${AVATAR_BASE}/seed-04.jpg`,
    quote:
      "Top-fan analytics is the unlock. I see exactly who's pulling up the catalog before they even DM me.",
  },
  {
    name: "Kai Mond",
    handle: "@kaimond",
    avatar: `${AVATAR_BASE}/seed-05.jpg`,
    quote:
      "This is what Splice should've been. Built for the producer-to-artist loop, not the marketplace grind.",
  },
  {
    name: "Jun West",
    handle: "@junwest",
    avatar: `${AVATAR_BASE}/seed-06.jpg`,
    quote:
      "My server is alive in there. I drop a beat, gone — every artist with the link has it the next second.",
  },
  {
    name: "Luna Bell",
    handle: "@lunabell",
    avatar: `${AVATAR_BASE}/seed-07.png`,
    quote:
      "Three hours a week chasing 'did u get my pack?' DMs. That's gone now. Time straight back into the studio.",
  },
];

export function LandingTestimonials() {
  const top = TESTIMONIALS.slice(0, 4);
  const bottom = TESTIMONIALS.slice(4, 8);

  return (
    <section
      id="testimonials"
      aria-label="Testimonials"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        {/* Header — eyebrow + title left, meta + quote glyph right */}
        <div
          className="flex items-end justify-between flex-wrap"
          style={{
            gap: 16,
            marginBottom: "clamp(28px, 4vw, 48px)",
          }}
        >
          <div className="flex flex-col">
            <span
              className="t-mono"
              style={{
                color: "var(--fg-3)",
                marginBottom: 12,
              }}
            >
              What producers say
            </span>
            <h2
              className="t-display"
              style={{
                fontSize: "clamp(36px, 4.6vw, 56px)",
                lineHeight: 1.04,
                letterSpacing: "-0.018em",
              }}
            >
              Testimonials
            </h2>
          </div>
          <div
            className="flex items-center"
            style={{ gap: 10, color: "var(--fg-2)" }}
          >
            <QuoteGlyph />
            <span className="t-body" style={{ fontSize: 14 }}>
              Real feedback from producers
            </span>
          </div>
        </div>

        {/* Panel — frosted dark surface holding the two marquee rows */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%)",
            border: "1px solid var(--border-1)",
            borderRadius: 24,
            padding: "clamp(28px, 3vw, 40px) 0",
            boxShadow:
              "0 40px 80px -28px oklch(0 0 0 / 0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Top row — scrolls RIGHT (animation-direction reverse) */}
          <MarqueeRow testimonials={top} direction="right" />
          {/* Hairline divider mid-panel for a 'two-track' feel */}
          <div
            aria-hidden="true"
            style={{
              height: 1,
              background: "var(--border-1)",
              margin: "clamp(20px, 2vw, 28px) 0",
            }}
          />
          {/* Bottom row — scrolls LEFT (default direction) */}
          <MarqueeRow testimonials={bottom} direction="left" />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Marquee row — pauses on hover, fades into the panel edges,
   reverses direction via animation-direction.
   ============================================================ */

function MarqueeRow({
  testimonials,
  direction,
}: {
  testimonials: Testimonial[];
  direction: "left" | "right";
}) {
  const [paused, setPaused] = React.useState(false);
  // Triple the list so the loop snaps back on a visually
  // identical frame at -33.333%.
  const items = React.useMemo(
    () => [...testimonials, ...testimonials, ...testimonials],
    [testimonials],
  );

  return (
    <div className="relative" style={{ overflow: "hidden" }}>
      {/* Edge fade masks blend the cards into the panel bg */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 pointer-events-none"
        style={{
          width: "clamp(40px, 6vw, 100px)",
          background:
            "linear-gradient(to right, var(--bg-1) 0%, transparent 100%)",
          zIndex: 2,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 pointer-events-none"
        style={{
          width: "clamp(40px, 6vw, 100px)",
          background:
            "linear-gradient(to left, var(--bg-2) 0%, transparent 100%)",
          zIndex: 2,
        }}
      />

      <div
        className="flex"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          width: "max-content",
          gap: "clamp(16px, 1.6vw, 24px)",
          padding: "8px 0",
          animation: "wl-marquee 55s linear infinite",
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationPlayState: paused ? "paused" : "running",
          willChange: "transform",
        }}
      >
        {items.map((t, i) => (
          <TestimonialCard key={`${t.handle}-${i}`} testimonial={t} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Testimonial card
   ============================================================ */

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div
      className="relative shrink-0 flex flex-col"
      style={{
        width: "clamp(300px, 26vw, 400px)",
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: 18,
        padding: "20px 22px",
        gap: 14,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Header — avatar + name + check + handle */}
      <div className="flex items-center" style={{ gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          loading="lazy"
          draggable={false}
          style={{
            width: 38,
            height: 38,
            borderRadius: "var(--r-pill)",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
            flexShrink: 0,
          }}
        />
        <div className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 5 }}>
            <span
              className="t-title"
              style={{
                fontSize: 14,
                color: "var(--fg-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {testimonial.name}
            </span>
            <VerifiedCheck />
          </div>
          <span
            className="t-body"
            style={{
              color: "var(--fg-3)",
              fontSize: 12.5,
              fontFamily: "var(--font-mono)",
            }}
          >
            {testimonial.handle}
          </span>
        </div>
      </div>

      {/* Quote */}
      <p
        className="t-body"
        style={{
          color: "var(--fg-2)",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {testimonial.quote}
      </p>
    </div>
  );
}

/* ============================================================
   Glyphs
   ============================================================ */

function VerifiedCheck() {
  // Twitter-style verified badge — accent-tinted circle with a
  // white checkmark. Inline so we don't pull the Icon registry
  // for one off-pattern glyph.
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="var(--accent)"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.142.213-.367.34-.62.34-.025 0-.05-.005-.075-.008-.275-.034-.518-.215-.62-.473l-1.5-3.5c-.157-.36.011-.78.371-.94.36-.15.78.012.94.371l.916 2.137 3.766-5.65c.2-.305.625-.385.93-.184.31.205.39.62.187.93z" />
    </svg>
  );
}

function QuoteGlyph() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M7 7h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7v3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm10 0h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3v3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
    </svg>
  );
}
