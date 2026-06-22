/**
 * Landing — Section 09. Pricing.
 *
 * Three plan cards side-by-side on desktop, stacked on mobile.
 * Lifetime is the highlighted 'best value' card (accent border +
 * outer glow + filled CTA) since it's both Theo's preferred
 * positioning AND the offer that converts best for solo
 * producers (single payment vs subscription anxiety).
 *
 * Pro carries a Monthly / Yearly toggle that flips its price +
 * 'SAVE ~30%' badge. Yearly is the default to nudge toward the
 * stickier billing cycle.
 *
 * Quotas + prices kept in sync with lib/billing/plans.ts:
 *   Free       — 1 server   · 15 beats  · 25 artists
 *   Lifetime   — 3 servers  · 150 beats · 500 artists      129 € once
 *   Pro M      — unlimited servers + beats · 1000 artists  12 € / mo
 *   Pro Y      — same as Pro M                             99 € / yr (saves ~30%)
 *
 * CTAs route anon visitors through /auth?intent=signup with a
 * plan hint preserved as a query param — the auth callback can
 * route them to the matching checkout post-signup. Already-
 * signed-in visitors (the Header tracks isAuthed) just see
 * 'Open app' in the chrome anyway; this section's CTAs always
 * go through auth first so the flow stays simple.
 */

"use client";

import * as React from "react";
import Link from "next/link";

type Billing = "monthly" | "yearly";

export function LandingPricing() {
  const [billing, setBilling] = React.useState<Billing>("yearly");

  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* Soft brand halo high-centre */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 35% at 50% 20%, var(--accent-glow) 0%, transparent 70%)",
          opacity: 0.25,
        }}
      />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        {/* Header — title + subtitle centred */}
        <div
          className="mx-auto text-center"
          style={{ maxWidth: 760, marginBottom: "clamp(32px, 4vw, 48px)" }}
        >
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              marginBottom: 18,
            }}
          >
            One link.{" "}
            <span
              style={{
                color: "var(--accent-text)",
                textShadow: "0 0 32px var(--accent-glow)",
              }}
            >
              Three
            </span>{" "}
            ways to ship it.
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
            Start free, pay once for Lifetime, or scale up with Pro. No card
            needed to start, cancel anytime.
          </p>
        </div>

        {/* Billing toggle (controls Pro card only) */}
        <BillingToggle billing={billing} onChange={setBilling} />

        {/* 3 plan cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 items-start"
          style={{
            gap: "clamp(16px, 2vw, 24px)",
            marginTop: "clamp(28px, 3vw, 40px)",
          }}
        >
          <PlanCard
            plan="free"
            badge="FREE FOREVER"
            price="0 €"
            period="forever"
            features={FREE_FEATURES}
            ctaLabel="Start free"
            ctaHref="/auth?intent=signup"
          />
          <PlanCard
            plan="lifetime"
            highlighted
            badge="BEST VALUE"
            price="129 €"
            period="once"
            features={LIFETIME_FEATURES}
            ctaLabel="Get Lifetime"
            ctaHref="/auth?intent=signup&plan=lifetime"
          />
          <PlanCard
            plan="pro"
            badge="MOST FLEXIBLE"
            price={billing === "monthly" ? "12 €" : "99 €"}
            period={billing === "monthly" ? "month" : "year"}
            features={PRO_FEATURES}
            ctaLabel={billing === "monthly" ? "Subscribe — 12 €/mo" : "Subscribe — 99 €/yr"}
            ctaHref={`/auth?intent=signup&plan=${billing === "monthly" ? "pro_monthly" : "pro_yearly"}`}
            footnote={
              billing === "yearly"
                ? "≈ 8.25 €/mo · billed yearly · saves ~30%"
                : "billed monthly · cancel anytime"
            }
          />
        </div>

        {/* Trust footer */}
        <p
          className="t-mono text-center"
          style={{
            marginTop: "clamp(28px, 3vw, 40px)",
            color: "var(--fg-4)",
          }}
        >
          Cancel anytime · Instant provisioning · Powered by Stripe
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   Plan cards
   ============================================================ */

interface PlanCardProps {
  plan: "free" | "lifetime" | "pro";
  highlighted?: boolean;
  badge: string;
  price: string;
  period: string;
  features: ReadonlyArray<string>;
  ctaLabel: string;
  ctaHref: string;
  footnote?: string;
}

function PlanCard({
  plan,
  highlighted,
  badge,
  price,
  period,
  features,
  ctaLabel,
  ctaHref,
  footnote,
}: PlanCardProps) {
  const name =
    plan === "free" ? "Free" : plan === "lifetime" ? "Lifetime" : "Pro";

  return (
    <div
      className="relative flex flex-col"
      style={{
        background: highlighted
          ? "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)"
          : "var(--bg-1)",
        border: highlighted
          ? "1px solid color-mix(in oklch, var(--accent-text) 45%, transparent)"
          : "1px solid var(--border-1)",
        borderRadius: 24,
        padding: "clamp(24px, 2.6vw, 32px)",
        boxShadow: highlighted
          ? "0 40px 80px -32px var(--accent-glow), 0 0 60px -10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 24px 48px -28px oklch(0 0 0 / 0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Badge */}
      <div
        className="t-mono inline-flex items-center"
        style={{
          alignSelf: "flex-start",
          gap: 6,
          padding: "5px 10px",
          borderRadius: "var(--r-pill)",
          background: highlighted ? "var(--accent-surface)" : "var(--bg-2)",
          color: highlighted ? "var(--accent-text)" : "var(--fg-3)",
          border: highlighted
            ? "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)"
            : "1px solid var(--border-1)",
          fontSize: 10,
        }}
      >
        {badge}
      </div>

      {/* Plan name */}
      <div
        className="t-h2"
        style={{
          marginTop: 16,
          fontSize: 22,
          letterSpacing: "-0.012em",
        }}
      >
        {name}
      </div>

      {/* Price + period */}
      <div
        className="flex items-baseline"
        style={{ marginTop: 14, gap: 8 }}
      >
        <span
          className="t-display"
          style={{
            fontSize: "clamp(36px, 4vw, 48px)",
            lineHeight: 1,
            color: highlighted ? "var(--accent-text)" : "var(--fg-1)",
            textShadow: highlighted
              ? "0 0 22px var(--accent-glow)"
              : "none",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {price}
        </span>
        <span className="t-mono" style={{ color: "var(--fg-3)" }}>
          / {period}
        </span>
      </div>

      {/* Features list */}
      <ul
        className="flex flex-col"
        style={{
          gap: 10,
          marginTop: 22,
          listStyle: "none",
          padding: 0,
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start"
            style={{ gap: 10 }}
          >
            <CheckGlyph highlighted={highlighted} />
            <span
              className="t-body"
              style={{
                fontSize: 14,
                color: "var(--fg-2)",
                lineHeight: 1.5,
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA + footnote */}
      <div style={{ marginTop: "auto", paddingTop: 24 }}>
        <Link
          href={ctaHref}
          className="block text-center transition-all"
          style={{
            padding: "12px 18px",
            borderRadius: "var(--r-md)",
            background: highlighted ? "var(--accent)" : "var(--bg-2)",
            color: highlighted ? "var(--accent-fg)" : "var(--fg-1)",
            border: highlighted
              ? "1px solid var(--accent)"
              : "1px solid var(--border-2)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "-0.005em",
            boxShadow: highlighted
              ? "0 12px 28px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.18)"
              : "inset 0 1px 0 rgba(255,255,255,0.04)",
            transitionDuration: "var(--dur)",
            transitionTimingFunction: "var(--ease)",
          }}
        >
          {ctaLabel}
        </Link>
        {footnote && (
          <p
            className="t-mono text-center"
            style={{
              marginTop: 10,
              color: "var(--fg-4)",
            }}
          >
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Billing toggle (Monthly / Yearly)
   ============================================================ */

function BillingToggle({
  billing,
  onChange,
}: {
  billing: Billing;
  onChange: (b: Billing) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Billing period"
      className="mx-auto inline-flex items-center"
      style={{
        display: "flex",
        width: "fit-content",
        marginLeft: "auto",
        marginRight: "auto",
        padding: 5,
        gap: 4,
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-pill)",
      }}
    >
      <ToggleButton
        active={billing === "monthly"}
        onClick={() => onChange("monthly")}
        label="Monthly"
      />
      <ToggleButton
        active={billing === "yearly"}
        onClick={() => onChange("yearly")}
        label="Yearly"
        badge="−30%"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="inline-flex items-center transition-all"
      style={{
        gap: 8,
        padding: "8px 16px",
        borderRadius: "var(--r-pill)",
        background: active ? "var(--accent-surface)" : "transparent",
        border: active
          ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
          : "1px solid transparent",
        color: active ? "var(--accent-text)" : "var(--fg-2)",
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: 13,
        letterSpacing: "-0.005em",
        cursor: "pointer",
        transitionDuration: "var(--dur)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {label}
      {badge && (
        <span
          className="t-mono"
          style={{
            padding: "2px 7px",
            borderRadius: "var(--r-pill)",
            background: active
              ? "var(--accent)"
              : "var(--ok-surface)",
            color: active ? "var(--accent-fg)" : "var(--ok)",
            fontSize: 9,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/* ============================================================
   Plan features (mirrors lib/billing/plans.ts quotas)
   ============================================================ */

const FREE_FEATURES = [
  "1 server",
  "15 beats",
  "25 artists",
  "MP3 upload",
  "Aggregated stats only",
] as const;

const LIFETIME_FEATURES = [
  "3 servers",
  "150 beats",
  "500 artists",
  "MP3 upload",
  "Per-artist tracking",
  "Top fan analytics",
  "One payment, no renewal",
] as const;

const PRO_FEATURES = [
  "Unlimited servers, beats",
  "1,000 artists",
  "MP3, WAV, FLAC, AIFF, M4A & more",
  "Per-artist tracking",
  "Top fan + audience analytics",
  "Cancel anytime",
] as const;

/* ============================================================
   Glyphs
   ============================================================ */

function CheckGlyph({ highlighted }: { highlighted?: boolean }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: 18,
        height: 18,
        borderRadius: "var(--r-pill)",
        background: highlighted ? "var(--accent-surface)" : "var(--bg-2)",
        color: highlighted ? "var(--accent-text)" : "var(--ok)",
        marginTop: 2,
      }}
    >
      <svg
        width={11}
        height={11}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}
