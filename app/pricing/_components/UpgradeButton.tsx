/**
 * UpgradeButton — client wrapper around createCheckoutSession.
 *
 * The action ends in a Stripe redirect (NEXT_REDIRECT throw),
 * which useTransition propagates correctly. We disable the
 * button while pending so a double-click can't open two
 * Checkout sessions (which would create two distinct sessions
 * server-side, double the work, and confuse Stripe analytics).
 */

"use client";

import * as React from "react";
import { useTransition } from "react";
import { createCheckoutSession } from "@/app/billing/actions";
import type { StripeLookupKey } from "@/lib/billing/plans";

interface UpgradeButtonProps {
  lookupKey: StripeLookupKey;
  /** Visible label for the idle state, e.g. "Get Lifetime". */
  label: string;
  /** Visible label while redirecting, defaults to "Redirecting…". */
  pendingLabel?: string;
  /** Accent the CTA — used for the recommended tier. */
  variant?: "primary" | "secondary";
}

export function UpgradeButton({
  lookupKey,
  label,
  pendingLabel = "Redirecting…",
  variant = "primary",
}: UpgradeButtonProps) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      try {
        await createCheckoutSession(lookupKey);
      } catch (e) {
        // A real error (price not found, no email…) — surface it
        // rather than silently failing. NEXT_REDIRECT throws are
        // expected and handled by Next; only non-redirect errors
        // land here.
        const msg =
          e instanceof Error ? e.message : "Could not start checkout.";
        if (!/NEXT_REDIRECT/i.test(msg)) {
          console.error("[billing] checkout failed:", e);
          window.alert(msg);
        }
      }
    });
  };

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    padding: "0 18px",
    width: "100%",
    borderRadius: "var(--r-md)",
    border: "none",
    fontFamily: "var(--font-body)",
    fontSize: 15,
    fontWeight: 600,
    cursor: pending ? "wait" : "pointer",
    opacity: pending ? 0.7 : 1,
    transition: "opacity var(--dur-fast) var(--ease)",
  } as React.CSSProperties;

  const themed: React.CSSProperties =
    variant === "primary"
      ? { background: "var(--accent)", color: "#fff" }
      : {
          background: "transparent",
          color: "var(--fg-1)",
          border: "1px solid var(--border-2)",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{ ...base, ...themed }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
