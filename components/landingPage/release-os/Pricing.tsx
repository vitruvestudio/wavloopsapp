/**
 * Pricing — Section 07 of the Release OS landing
 *
 * Two-card pricing — Starter (ghost CTA) + Pro (primary CTA, "Most popular"
 * badge, accent border + outer glow). Both link to /onboarding_early.
 *
 *   STARTER  $9.99 / mo  → ghost button + 4 feats with neutral check pills
 *   PRO      $19.99 / mo → primary button + 4 feats with accent check pills,
 *                          first item is the "Everything in Starter" lead
 *                          (arrow icon, transparent pill, bold copy)
 *
 * Layout:
 *   - default       : 2-col grid centered, max-w 840px
 *   - max-[720px]   : single column, max-w 420px, larger gap, no min-height
 *                     on the description so cards size to content
 *
 * Below the grid, a centered mono caption with a lock icon underlines the
 * "early-access price for life" promise — a softer commitment than a hard
 * countdown.
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`.
 */

import Link from "next/link";
import { Icon } from "./Icon";

/* ================================================================== */
/* DATA                                                                */
/* ================================================================== */

interface Feat {
  /** Lead items render the arrow icon + transparent pill + bold copy. */
  lead?: boolean;
  label: string;
}

interface Plan {
  name: string;
  amount: string;
  per: string;
  desc: string;
  ctaLabel: string;
  /** "primary" → filled accent | "ghost" → outlined neutral */
  ctaVariant: "primary" | "ghost";
  feats: ReadonlyArray<Feat>;
  /** Pro plan only — adds accent border + outer glow + badge */
  highlighted?: boolean;
  /** Shown as a small mono pill anchored above the card. */
  badge?: string;
}

const PLANS: ReadonlyArray<Plan> = [
  {
    name: "Starter",
    amount: "$14.99",
    per: "/ mo",
    desc: "For producers getting their beats out there.",
    ctaLabel: "Get early access",
    ctaVariant: "ghost",
    feats: [
      { label: "Auto-prepare cover, title, description, tags" },
      { label: "Auto-post to YouTube on your schedule" },
      { label: "Producer Wall — 0% commission" },
      { label: "Up to 10 beats / month" },
    ],
  },
  {
    name: "Pro",
    amount: "$24.99",
    per: "/ mo",
    desc: "For producers who release consistently.",
    ctaLabel: "Get early access",
    ctaVariant: "primary",
    highlighted: true,
    badge: "Most popular",
    feats: [
      { lead: true, label: "Everything in Starter" },
      { label: "Unlimited beats" },
      { label: "Smart contact sending (style & mood matching)" },
      { label: "Priority scheduling & multi-platform" },
    ],
  },
];

/* ================================================================== */
/* SUB-COMPONENT — single plan card                                    */
/* ================================================================== */

function PlanCard({ plan }: { plan: Plan }) {
  const highlighted = !!plan.highlighted;

  return (
    <div
      className={`relative flex flex-col rounded-card border px-[30px] py-[32px] ${
        highlighted
          ? "border-accent"
          : "border-line-strong bg-surface-1"
      }`}
      style={
        highlighted
          ? {
              background:
                "linear-gradient(180deg, var(--accent-soft), transparent 36%), var(--surface-1)",
              boxShadow:
                "0 0 0 1px var(--accent), 0 30px 70px -30px rgba(43,37,255,0.55)",
            }
          : undefined
      }
    >
      {/* "Most popular" badge */}
      {plan.badge && (
        <span
          className="absolute left-1/2 top-[-12px] -translate-x-1/2 whitespace-nowrap rounded-pill bg-accent px-[14px] py-[6px] font-mono text-[9px] uppercase tracking-[0.13em] text-white"
          style={{ boxShadow: "0 8px 20px -8px rgba(43,37,255,0.9)" }}
        >
          {plan.badge}
        </span>
      )}

      {/* name */}
      <div
        className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
          highlighted ? "text-[#cfd0ff]" : "text-text-2"
        }`}
      >
        {plan.name}
      </div>

      {/* price */}
      <div className="mt-[16px] flex items-baseline gap-[6px]">
        <span className="font-display text-[48px] font-bold leading-none tracking-[-0.04em] text-text-1">
          {plan.amount}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
          {plan.per}
        </span>
      </div>

      {/* description */}
      <p className="mt-[14px] min-h-[38px] text-pretty text-[13.5px] leading-[1.5] text-text-2 max-[720px]:min-h-0">
        {plan.desc}
      </p>

      {/* CTA */}
      <Link
        href="/onboarding_early"
        className={`wv-btn ${
          plan.ctaVariant === "primary" ? "wv-btn-primary" : "wv-btn-ghost"
        } mt-[22px] w-full justify-center`}
      >
        {plan.ctaLabel}
      </Link>

      {/* feats — hairline-separated from CTA */}
      <ul className="m-0 mt-[24px] flex flex-col gap-[13px] border-t border-line p-0 pt-[24px]">
        {plan.feats.map((feat) => (
          <li
            key={feat.label}
            className={`flex items-start gap-[11px] text-[13.5px] leading-[1.45] text-text-1 ${
              feat.lead ? "font-semibold" : ""
            }`}
          >
            <span
              className={`mt-[1px] inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                feat.lead
                  ? "text-accent"
                  : highlighted
                    ? "border border-accent bg-accent text-white"
                    : "border border-line-strong bg-surface-2 text-text-2"
              }`}
            >
              <Icon name={feat.lead ? "arrowR" : "check"} size={11} />
            </span>
            {feat.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* SECTION                                                             */
/* ================================================================== */

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-line bg-bg-deep py-[clamp(84px,11vw,132px)]"
    >
      {/* top-centered blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[520px] w-[880px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(43,37,255,0.14), transparent 64%)",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* heading */}
        <header className="mx-auto mb-[clamp(46px,6vw,70px)] max-w-[680px] text-center">
          <div className="wv-eyebrow">
            <span className="slash">//</span> 007 — pricing
          </div>
          <h2 className="mt-[18px] text-balance font-display text-[clamp(32px,4.6vw,62px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1">
            Simple. No surprises.
          </h2>
        </header>

        {/* plans grid */}
        <div className="mx-auto grid max-w-[840px] grid-cols-2 items-stretch gap-[20px] max-[720px]:max-w-[420px] max-[720px]:grid-cols-1 max-[720px]:gap-[26px]">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        {/* footer note */}
        <div className="mt-[30px] flex items-center justify-center gap-[9px] font-mono text-[10.5px] uppercase tracking-[0.1em] text-text-2">
          <Icon name="lock" size={13} className="text-accent" />
          Lock your early-access price for life.
        </div>
      </div>
    </section>
  );
}
