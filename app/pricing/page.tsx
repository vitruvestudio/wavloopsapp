/**
 * /pricing — public pricing page with 3 cards (Free / Lifetime / Pro).
 *
 * Minimal V1 surface: data-driven from PLAN_QUOTAS so any tarif
 * tweak in plans.ts flows here automatically. Visual polish lands
 * in a follow-up — the landing page already has a marketing pricing
 * section; this one is the FUNCTIONAL surface (buttons that work).
 *
 * Plan-aware UI: the user's current plan is detected server-side
 * and the matching card shows "Current plan" instead of an upgrade
 * CTA. Anon visitors see all 3 CTAs (clicks redirect to /auth).
 */

import { Icon } from "@/components/ui/Icon";
import {
  PLAN_QUOTAS,
  STRIPE_LOOKUP_KEYS,
  type PlanKey,
} from "@/lib/billing/plans";
import { getCurrentUserPlan } from "@/lib/billing/server";
import { UpgradeButton } from "./_components/UpgradeButton";

interface PlanCardData {
  key: PlanKey;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  /** Bullet points to render in the card body. */
  bullets: string[];
  highlight?: boolean;
}

export const metadata = {
  title: "Pricing — Wavloops",
  description: "Plans for solo beatmakers and serious producers.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const [currentPlan, params] = await Promise.all([
    getCurrentUserPlan(),
    searchParams,
  ]);
  const cards = buildCards();

  return (
    <main
      className="flex flex-col items-center"
      style={{
        minHeight: "100vh",
        padding: "64px 22px",
        background: "var(--bg-0)",
        color: "var(--fg-1)",
      }}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ maxWidth: 720, marginBottom: 48, gap: 16 }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(34px, 6vw, 52px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Send beats like a pro.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--fg-3)",
            fontSize: 17,
            lineHeight: 1.55,
            maxWidth: 520,
          }}
        >
          Pick a plan that matches your output. Upgrade or cancel
          anytime — your beats are safe either way.
        </p>
        {params.canceled === "1" && (
          <div
            role="status"
            className="t-body-s"
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--bg-2)",
              color: "var(--fg-2)",
            }}
          >
            Checkout canceled — no worries, you can come back anytime.
          </div>
        )}
      </div>

      <div
        className="grid w-full"
        style={{
          maxWidth: 1080,
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {cards.map((card) => (
          <PricingCard
            key={card.key}
            card={card}
            isCurrent={card.key === currentPlan}
          />
        ))}
      </div>
    </main>
  );
}

function buildCards(): PlanCardData[] {
  const free = PLAN_QUOTAS.free;
  const lifetime = PLAN_QUOTAS.lifetime;
  return [
    {
      key: "free",
      name: "Free",
      price: "$0",
      cadence: "forever",
      tagline: "Try the workflow with one server.",
      bullets: [
        `${free.servers} server`,
        `${free.beats} beats`,
        `${free.artists} artists`,
        "MP3 uploads",
        "Aggregated listen counts",
      ],
    },
    {
      key: "lifetime",
      name: "Lifetime",
      price: "$129",
      cadence: "one payment, forever",
      tagline: "Own it once. No subscription.",
      bullets: [
        `${lifetime.servers} servers`,
        `${lifetime.beats} beats`,
        `${lifetime.artists} artists`,
        "MP3 uploads",
        "Per-artist tracking — see who listened to what",
        "Engagement history",
      ],
      highlight: true,
    },
    {
      key: "pro",
      name: "Pro",
      price: "$12",
      cadence: "/ month — or $99/year",
      tagline: "Unlimited everything for serious producers.",
      bullets: [
        "Unlimited servers, beats, artists",
        "MP3 + WAV uploads",
        "Per-artist tracking + history",
        "Advanced analytics (coming soon)",
        "Priority support",
      ],
    },
  ];
}

function PricingCard({
  card,
  isCurrent,
}: {
  card: PlanCardData;
  isCurrent: boolean;
}) {
  const cta = renderCta(card, isCurrent);
  return (
    <article
      className="flex flex-col"
      style={{
        padding: 26,
        gap: 16,
        borderRadius: "var(--r-lg)",
        background: card.highlight
          ? "linear-gradient(180deg, var(--accent-surface) 0%, var(--bg-1) 60%)"
          : "var(--bg-1)",
        border: card.highlight
          ? "1px solid var(--accent)"
          : "1px solid var(--border-1)",
        position: "relative",
      }}
    >
      {card.highlight && (
        <span
          className="t-mono-s"
          style={{
            position: "absolute",
            top: -10,
            right: 18,
            padding: "4px 10px",
            background: "var(--accent)",
            color: "#fff",
            borderRadius: 999,
            letterSpacing: "0.1em",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          BEST DEAL
        </span>
      )}

      <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {card.name}
        </h2>
        <p className="t-body-s" style={{ color: "var(--fg-3)", margin: 0 }}>
          {card.tagline}
        </p>
      </header>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {card.price}
        </span>
        <span className="t-body-s" style={{ color: "var(--fg-3)" }}>
          {card.cadence}
        </span>
      </div>

      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none",
          flex: 1,
        }}
      >
        {card.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start"
            style={{ gap: 8, color: "var(--fg-2)", fontSize: 14 }}
          >
            <Icon
              name="check"
              size={15}
              style={{
                marginTop: 2,
                color: card.highlight ? "var(--accent)" : "var(--fg-3)",
              }}
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {cta}
    </article>
  );
}

function renderCta(card: PlanCardData, isCurrent: boolean) {
  if (isCurrent) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: 44,
          borderRadius: "var(--r-md)",
          background: "var(--bg-2)",
          color: "var(--fg-2)",
          fontSize: 14,
          fontWeight: 600,
          gap: 8,
        }}
      >
        <Icon name="check" size={15} />
        Current plan
      </div>
    );
  }
  if (card.key === "free") {
    // No checkout for Free — but show the label so the card stays
    // visually balanced with the paid tiers.
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: 44,
          borderRadius: "var(--r-md)",
          background: "transparent",
          color: "var(--fg-3)",
          fontSize: 13,
          fontWeight: 500,
          border: "1px dashed var(--border-2)",
        }}
      >
        Default for every account
      </div>
    );
  }
  if (card.key === "lifetime") {
    return (
      <UpgradeButton
        lookupKey={STRIPE_LOOKUP_KEYS.lifetime}
        label="Get Lifetime"
        variant="primary"
      />
    );
  }
  // Pro — two CTAs (monthly + yearly), stacked.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <UpgradeButton
        lookupKey={STRIPE_LOOKUP_KEYS.proMonthly}
        label="Subscribe — $12/month"
        variant="secondary"
      />
      <UpgradeButton
        lookupKey={STRIPE_LOOKUP_KEYS.proYearly}
        label="Subscribe — $99/year"
        variant="primary"
      />
    </div>
  );
}
