/**
 * /billing/success — landing page after a successful Stripe checkout.
 *
 * The webhook does the real provisioning (writes plan + status to
 * subscriptions). That's asynchronous and usually finishes within
 * 1-3 seconds, but the user shouldn't have to wait or refresh —
 * we show a polished "thanks, activating now" view and read the
 * plan on the next render so it's accurate if the webhook beat
 * the redirect.
 *
 * The session_id query param is informational only at this stage
 * (Phase 6 will use it to render the receipt summary by fetching
 * the Session from Stripe). For Phase 2 we just trust the webhook.
 */

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getCurrentUserPlan } from "@/lib/billing/server";

export const metadata = {
  title: "Thanks for your purchase — Wavloops",
};

// Always render fresh — the webhook may flip the plan between the
// redirect and this render, and we want the latest value visible.
export const dynamic = "force-dynamic";

export default async function BillingSuccessPage() {
  const plan = await getCurrentUserPlan();
  const planLabel =
    plan === "pro"
      ? "Pro"
      : plan === "lifetime"
        ? "Lifetime"
        : "activating…";

  return (
    <main
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: "100vh",
        padding: "32px 22px",
        background: "var(--bg-0)",
        color: "var(--fg-1)",
      }}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ maxWidth: 480, gap: 22 }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "var(--accent-surface)",
            color: "var(--accent)",
          }}
        >
          <Icon name="check" size={36} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Payment received.
          </h1>
          <p
            className="t-body"
            style={{
              color: "var(--fg-3)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Your plan is being activated — usually done within seconds.
            If you don&apos;t see the new quotas yet, refresh the page.
          </p>
        </div>

        <div
          className="t-mono-s flex items-center"
          style={{
            gap: 8,
            padding: "10px 16px",
            borderRadius: 999,
            background: "var(--bg-1)",
            border: "1px solid var(--border-1)",
            color: "var(--fg-2)",
            letterSpacing: "0.1em",
          }}
        >
          <Icon name="zap" size={13} />
          PLAN: {planLabel.toUpperCase()}
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center"
          style={{
            height: 48,
            padding: "0 24px",
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "var(--r-md)",
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
            gap: 8,
          }}
        >
          Open dashboard
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </main>
  );
}
