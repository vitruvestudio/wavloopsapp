/**
 * PlanBadge — TopBar pill that surfaces the producer's billing plan
 * and deep-links to the billing tab in /settings.
 *
 *   Free      → muted pill, "Upgrade" hint on hover
 *   Lifetime  → accent surface + soft glow ("Lifetime")
 *   Pro       → accent surface + zap icon ("Pro")
 *
 * Plan flows in via ProducerContext (resolved server-side in the
 * (app) layout via getCurrentUserPlan()) — no client RPC per
 * render. Hidden < md to keep the mobile topbar quiet; the same
 * info shows up in /settings on small screens anyway.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useProducerPlan } from "@/app/(app)/_components/ProducerContext";

const LABELS = {
  free: "Free",
  lifetime: "Lifetime",
  pro: "Pro",
} as const;

export function PlanBadge() {
  const plan = useProducerPlan();
  const isPaid = plan !== "free";

  return (
    <Link
      href="/settings?tab=billing"
      aria-label={`Current plan: ${LABELS[plan]} — manage billing`}
      title={
        isPaid
          ? `${LABELS[plan]} plan — manage billing`
          : "Free plan — upgrade"
      }
      className="hidden items-center transition-all md:inline-flex"
      style={{
        gap: 7,
        height: 32,
        padding: "0 12px",
        borderRadius: "var(--r-pill)",
        background: isPaid
          ? "var(--accent-surface)"
          : "color-mix(in oklch, var(--bg-2) 80%, transparent)",
        border: isPaid
          ? "1px solid color-mix(in oklch, var(--accent-text) 45%, transparent)"
          : "1px solid var(--border-2)",
        color: isPaid ? "var(--accent-text)" : "var(--fg-2)",
        fontFamily: "var(--font-body)",
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        textDecoration: "none",
        boxShadow: isPaid
          ? "0 0 24px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 1px 0 rgba(255,255,255,0.02)",
        transitionDuration: "var(--dur)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {isPaid ? (
        <Icon name="zap" size={13} />
      ) : (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--fg-3)",
          }}
        />
      )}
      <span>{LABELS[plan]}</span>
      {!isPaid && (
        <span
          aria-hidden
          style={{
            marginLeft: 4,
            paddingLeft: 8,
            borderLeft: "1px solid var(--border-2)",
            color: "var(--accent-text)",
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: 0.1,
          }}
        >
          Upgrade
        </span>
      )}
    </Link>
  );
}
