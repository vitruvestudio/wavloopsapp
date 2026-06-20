/**
 * UpgradeRequiredModal — modal version of the gate refusal.
 *
 * Pops the moment a server action returns a quota error. Instead
 * of staring at a red banner above their form, the producer gets
 * a focused upgrade surface with the exact tiers that would
 * unlock the action they just tried — one click, into Stripe
 * Checkout, back to where they were.
 *
 * Plan-aware content
 * ──────────────────
 *   - Free   → Lifetime card + Pro Monthly + Pro Yearly
 *   - Lifetime → Pro Monthly + Pro Yearly (no Lifetime repeat;
 *                Pro Yearly takes the accent slot as the natural
 *                next step)
 *   - Pro    → impossible (Pro hits no quota with finite caps);
 *              shown defensively as a generic "you're at fair-use
 *              limit, contact us" card.
 *
 * The CTAs go through createCheckoutSession just like /pricing
 * and the Settings billing tab — single source of truth for
 * provisioning.
 */

"use client";

import * as React from "react";
import { useTransition } from "react";
import { createCheckoutSession } from "@/app/billing/actions";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { STRIPE_LOOKUP_KEYS } from "@/lib/billing/plans";
import type { PlanKey, StripeLookupKey } from "@/lib/billing/plans";

interface UpgradeRequiredModalProps {
  open: boolean;
  onClose: () => void;
  /** The user's effective billing plan when the gate fired. */
  currentPlan: PlanKey;
  /** Verbatim message from the gate, e.g. 'Your Lifetime plan
   *  includes 3 servers. Upgrade to Pro for unlimited.' Becomes
   *  the modal's sub-headline. */
  reason: string;
}

export function UpgradeRequiredModal({
  open,
  onClose,
  currentPlan,
  reason,
}: UpgradeRequiredModalProps) {
  return (
    <Modal open={open} onClose={onClose} ariaCloseLabel="Close upgrade dialog">
      <div
        role="dialog"
        aria-labelledby="upgrade-modal-title"
        className="relative w-full"
        style={{
          maxWidth: 720,
          background: "var(--bg-1)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--border-1)",
          padding: 28,
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
          style={{
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            borderRadius: "var(--r-sm)",
            border: "none",
            background: "transparent",
            color: "var(--fg-3)",
          }}
        >
          <Icon name="x" size={18} />
        </button>

        <header
          className="flex flex-col"
          style={{ gap: 8, marginBottom: 22, maxWidth: 520 }}
        >
          <div
            className="t-mono-s"
            style={{
              color: "var(--accent-text)",
              letterSpacing: "0.1em",
            }}
          >
            UPGRADE REQUIRED
          </div>
          <h2
            id="upgrade-modal-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            You&apos;ve hit your plan&apos;s limit.
          </h2>
          <p
            className="t-body-s"
            style={{ color: "var(--fg-3)", lineHeight: 1.55, margin: 0 }}
          >
            {reason}
          </p>
        </header>

        <UpgradeCards currentPlan={currentPlan} />

        <footer
          className="t-mono-s"
          style={{
            color: "var(--fg-3)",
            marginTop: 22,
            letterSpacing: "0.08em",
            textAlign: "center",
          }}
        >
          CANCEL ANYTIME · INSTANT PROVISIONING
        </footer>
      </div>
    </Modal>
  );
}

function UpgradeCards({ currentPlan }: { currentPlan: PlanKey }) {
  const [pending, startTransition] = useTransition();

  // Typed StripeLookupKey + no `as` cast — keeps the union closed
  // so a future call site can't smuggle in an unknown lookup key
  // (e.g. "wavloops_pro_yearly_discount") that would hit Stripe
  // with an unknown plan. Server action also re-validates against
  // STRIPE_LOOKUP_KEYS as defense in depth, but locking the type
  // at the call site avoids a useless round-trip.
  const fire = (lookupKey: StripeLookupKey) =>
    startTransition(async () => {
      try {
        await createCheckoutSession(lookupKey);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not start checkout.";
        if (!/NEXT_REDIRECT/i.test(msg)) {
          // Log only the message — the full error object can carry
          // Stripe customer / subscription ids in details that we
          // don't want to ship to the browser console (or whatever
          // log drain it forwards to).
          console.error("[upgrade-modal] checkout failed:", msg);
          window.alert(msg);
        }
      }
    });

  if (currentPlan === "pro") {
    // Defensive: Pro shouldn't generally land here (fair-use caps
    // are 1000/100k, not 25/15). If it does, route them to support.
    return (
      <div
        className="flex flex-col items-center text-center"
        style={{
          padding: 24,
          gap: 10,
          background: "var(--bg-2)",
          borderRadius: "var(--r-md)",
        }}
      >
        <Icon name="mail" size={24} style={{ color: "var(--accent-text)" }} />
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          You&apos;ve hit the Pro fair-use cap.
        </div>
        <a
          href="mailto:support@wavloops.co"
          className="t-body-s"
          style={{ color: "var(--accent-text)" }}
        >
          Contact us at support@wavloops.co
        </a>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2"
      style={{ gap: 12 }}
    >
      {currentPlan === "free" && (
        <PlanOption
          kicker="BEST VALUE"
          name="Lifetime"
          price="129 €"
          unit="once"
          features={[
            "3 servers · 150 beats · 500 artists",
            "Per-artist tracking",
            "One payment, no renewal",
          ]}
          ctaLabel={pending ? "Redirecting…" : "Get Lifetime"}
          onCta={() => fire(STRIPE_LOOKUP_KEYS.lifetime)}
          pending={pending}
          accent
        />
      )}
      <PlanOption
        kicker="MONTHLY"
        name="Pro"
        price="12 €"
        unit="/ month"
        features={[
          "Unlimited servers, beats, artists",
          "MP3 + WAV uploads",
          "Cancel anytime",
        ]}
        ctaLabel={pending ? "Redirecting…" : "Subscribe — 12 €/mo"}
        onCta={() => fire(STRIPE_LOOKUP_KEYS.proMonthly)}
        pending={pending}
      />
      <PlanOption
        kicker="2 MONTHS OFF"
        name="Pro — Yearly"
        price="99 €"
        unit="/ year"
        features={[
          "Same as Pro Monthly",
          "Pay yearly, save ~30 %",
          "Cancel anytime",
        ]}
        ctaLabel={pending ? "Redirecting…" : "Subscribe — 99 €/yr"}
        onCta={() => fire(STRIPE_LOOKUP_KEYS.proYearly)}
        pending={pending}
        accent={currentPlan === "lifetime"}
      />
    </div>
  );
}

function PlanOption({
  kicker,
  name,
  price,
  unit,
  features,
  ctaLabel,
  onCta,
  pending,
  accent = false,
}: {
  kicker: string;
  name: string;
  price: string;
  unit: string;
  features: string[];
  ctaLabel: string;
  onCta: () => void;
  pending: boolean;
  accent?: boolean;
}) {
  return (
    <article
      className="flex flex-col"
      style={{
        padding: 18,
        gap: 12,
        borderRadius: "var(--r-md)",
        background: accent
          ? "linear-gradient(180deg, var(--accent-surface) 0%, var(--bg-2) 70%)"
          : "var(--bg-2)",
        border: accent
          ? "1px solid var(--accent)"
          : "1px solid var(--border-1)",
      }}
    >
      <div
        className="t-mono-s"
        style={{
          color: accent ? "var(--accent-text)" : "var(--fg-3)",
          letterSpacing: "0.1em",
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: "-0.01em",
        }}
      >
        {name}
      </div>
      <div className="flex items-baseline" style={{ gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-0.01em",
          }}
        >
          {price}
        </span>
        <span className="t-body-s" style={{ color: "var(--fg-3)" }}>
          {unit}
        </span>
      </div>
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          margin: 0,
          padding: 0,
          listStyle: "none",
          flex: 1,
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start"
            style={{ gap: 6, color: "var(--fg-2)", fontSize: 13 }}
          >
            <Icon
              name="check"
              size={13}
              style={{
                marginTop: 2,
                color: accent ? "var(--accent)" : "var(--fg-3)",
              }}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCta}
        disabled={pending}
        className="inline-flex items-center justify-center cursor-pointer transition-opacity duration-fast"
        style={{
          marginTop: 4,
          height: 40,
          padding: "0 16px",
          width: "100%",
          borderRadius: "var(--r-md)",
          border: accent ? "none" : "1px solid var(--border-2)",
          background: accent ? "var(--accent)" : "transparent",
          color: accent ? "#fff" : "var(--fg-1)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {ctaLabel}
      </button>
    </article>
  );
}
