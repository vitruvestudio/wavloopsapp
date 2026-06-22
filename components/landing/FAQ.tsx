/**
 * Landing — Section 10. FAQ.
 *
 * Standard accordion pattern: each question is a button row;
 * clicking expands its answer with a smooth height transition.
 * Multiple questions can be open at once (the visitor often
 * wants to compare answers).
 *
 * Questions cover the highest-friction concerns the producer
 * audience surfaces before paying: what is Wavloops, how
 * artists access servers, which audio formats work, what the
 * tracking actually shows, plan differences, and the can-I-
 * cancel-please reassurance. All answers stay TIGHTLY in sync
 * with the product as built:
 *   - Plan quotas mirror lib/billing/plans.ts.
 *   - Audio format whitelist matches PLAN_QUOTAS audio_exts.
 *   - Tracking copy matches what BeatDetailPage actually shows.
 *   - 'Private' vs 'Public' matches the create-server flow.
 *
 * The section sits late on the page (after Pricing) so the
 * visitor's pricing question is fresh and the FAQ closes the
 * remaining objections before the final CTA.
 */

"use client";

import * as React from "react";

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "What is Wavloops, exactly?",
    a: (
      <>
        Wavloops is a beat-sharing platform built for producers. Instead of
        re-sending packs through WeTransfer or DMs every time you cook a new
        beat, you create a <strong>server</strong> — a single link your
        artists keep coming back to. Drop a beat in, it&apos;s there for
        every artist with access. Live tracking shows who listened, who
        liked, and who&apos;s ready to lock in.
      </>
    ),
  },
  {
    q: "How do artists get access to my server?",
    a: (
      <>
        You pick the visibility when you create a server.{" "}
        <strong>Public</strong> servers let anyone with the link join after a
        one-tap email confirmation. <strong>Private</strong> servers require
        the artist to submit their email + a social profile, then you approve
        each one manually from your dashboard. No app to download either way
        — everything happens in the browser.
      </>
    ),
  },
  {
    q: "Which audio formats can I upload?",
    a: (
      <>
        <strong>Free and Lifetime</strong> plans accept MP3 uploads.{" "}
        <strong>Pro</strong> opens up WAV, FLAC, AIFF, M4A, AAC, OGG and OPUS
        so you can share stems and lossless masters at full quality. Max file
        size is 100 MB per beat, max cover image is 5 MB.
      </>
    ),
  },
  {
    q: "What can I actually track?",
    a: (
      <>
        On <strong>Lifetime</strong> and <strong>Pro</strong>: every play,
        every like, every artist — tracked live, per beat AND per server. You
        see your <em>top fan</em>, the listening history of each artist, and
        the audience overlap between your beats. On <strong>Free</strong>,
        you see aggregated counts only (total plays / total likes) without
        per-artist resolution — enough to feel the pulse, not enough to know
        who&apos;s ready to lock in.
      </>
    ),
  },
  {
    q: "What's the difference between Free, Lifetime, and Pro?",
    a: (
      <>
        <strong>Free</strong> is for trying it out — 1 server, 15 beats, 25
        artists, MP3 uploads, aggregated analytics. <strong>Lifetime</strong>{" "}
        is a single 129 € payment that gives you 3 servers, 150 beats, 500
        artists, full per-artist tracking and top-fan analytics — no recurring
        bill ever. <strong>Pro</strong> removes the caps entirely (unlimited
        servers and beats, 1,000 artists, all audio formats) for 12 €/month
        or 99 €/year.
      </>
    ),
  },
  {
    q: "Do I need a credit card to start?",
    a: (
      <>
        No. The Free plan is free forever and requires no payment details.
        Sign up, create your first server, share the link — start tracking
        right away. You only enter card details when you choose to upgrade.
      </>
    ),
  },
  {
    q: "Can I cancel anytime?",
    a: (
      <>
        Yes. <strong>Pro</strong> subscriptions cancel from your Settings →
        Billing portal (powered by Stripe), with one click — no email
        support loop. <strong>Lifetime</strong> is a one-time payment so
        there&apos;s nothing to cancel; the access stays forever. Refunds on
        digital purchases follow the standard policy: we don&apos;t refund
        once the plan is activated, but you can downgrade or stop paying at
        any moment.
      </>
    ),
  },
  {
    q: "Where are my beats stored? Is it secure?",
    a: (
      <>
        Beats live on Supabase&apos;s encrypted storage and are only served
        through signed URLs scoped to your producer account or to artists you
        explicitly granted access to. Private servers add a per-artist
        approval gate on top — nobody sees a single beat before you click
        approve.
      </>
    ),
  },
];

export function LandingFAQ() {
  // Multiple questions can be open at once — visitors often
  // want to compare answers (e.g. plan tiers and cancel policy
  // side-by-side).
  const [open, setOpen] = React.useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 880, padding: "0 24px" }}
      >
        {/* Header */}
        <div
          className="text-center"
          style={{ marginBottom: "clamp(32px, 4vw, 56px)" }}
        >
          <span
            className="t-mono"
            style={{
              color: "var(--accent-text)",
              display: "block",
              marginBottom: 14,
            }}
          >
            FAQ
          </span>
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              marginBottom: 18,
            }}
          >
            Everything you wanted to{" "}
            <span
              style={{
                color: "var(--accent-text)",
                textShadow: "0 0 32px var(--accent-glow)",
              }}
            >
              ask
            </span>
            .
          </h2>
          <p
            className="t-body-l"
            style={{
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Real answers about the product, the plans, and how artists access
            your servers.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          {FAQ_ITEMS.map((item, i) => (
            <FAQRow
              key={i}
              item={item}
              isOpen={open.has(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {/* Foot — gentle nudge to the auth flow for the visitor
                whose question isn't covered. */}
        <p
          className="text-center t-body"
          style={{
            marginTop: "clamp(28px, 3vw, 40px)",
            color: "var(--fg-3)",
            fontSize: 14,
          }}
        >
          Still curious? Just sign up — the Free plan needs no card.
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ row — button + collapsible answer
   ============================================================ */

function FAQRow({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  // Measure the inner content height so the maxHeight transition
  // works smoothly (auto-height isn't animatable directly).
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState(0);

  React.useEffect(() => {
    if (!contentRef.current) return;
    setContentHeight(contentRef.current.scrollHeight);
    // Re-measure on viewport resize so wrapping changes don't
    // leave the panel with the wrong cached height.
    const ro = new ResizeObserver(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{
        background: isOpen
          ? "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)"
          : "var(--bg-1)",
        border: isOpen
          ? "1px solid color-mix(in oklch, var(--accent-text) 28%, transparent)"
          : "1px solid var(--border-1)",
        borderRadius: 16,
        overflow: "hidden",
        transition:
          "border-color 0.2s var(--ease-out), background 0.2s var(--ease-out)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center text-left transition-colors"
        style={{
          padding: "20px 22px",
          gap: 16,
          background: "transparent",
          color: "var(--fg-1)",
          cursor: "pointer",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 16.5,
          letterSpacing: "-0.008em",
          lineHeight: 1.35,
        }}
      >
        <span className="flex-1">{item.q}</span>
        <span
          aria-hidden="true"
          className="flex items-center justify-center shrink-0"
          style={{
            width: 30,
            height: 30,
            borderRadius: "var(--r-pill)",
            background: isOpen
              ? "var(--accent-surface)"
              : "var(--bg-2)",
            color: isOpen ? "var(--accent-text)" : "var(--fg-3)",
            transition:
              "transform 0.25s var(--ease-out), background 0.2s var(--ease-out), color 0.2s var(--ease-out)",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <PlusGlyph />
        </span>
      </button>

      <div
        style={{
          maxHeight: isOpen ? contentHeight : 0,
          opacity: isOpen ? 1 : 0,
          transition:
            "max-height 0.35s var(--ease-out), opacity 0.25s var(--ease-out)",
          overflow: "hidden",
        }}
      >
        <div
          ref={contentRef}
          className="t-body-l"
          style={{
            padding: "0 22px 22px",
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--fg-2)",
          }}
        >
          {item.a}
        </div>
      </div>
    </div>
  );
}

function PlusGlyph() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
