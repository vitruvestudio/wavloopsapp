/**
 * Server-side Stripe client — single instance, lazily resolved.
 *
 * Why lazy
 * ────────
 * Reading STRIPE_SECRET_KEY at module-load time would crash the
 * build whenever an env var isn't injected yet (preview deploys,
 * CI). Resolving at first call lets the build pass and surfaces
 * a clear runtime error only when billing code actually executes.
 *
 * Why a custom appInfo
 * ────────────────────
 * Stripe asks integrators to identify themselves in API calls so
 * support tickets can be debugged faster and platform abuse can
 * be traced. Plus it shows up in the Stripe dashboard's "Recent
 * API calls" pane with the name we set here, which is nice when
 * scanning logs.
 *
 * Mode helper
 * ───────────
 * getStripeMode() peeks at the key prefix and reports whether
 * the runtime is talking to live or test Stripe. Used by:
 *   - the billing settings page, to badge the UI in TEST builds
 *     so we don't ship "you're in test mode" by accident.
 *   - webhook handlers, to log-prefix events.
 */

import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Configure it in Vercel + .env.local.",
    );
  }
  cached = new Stripe(key, {
    // Use the SDK's bundled API version — pin only when an event
    // shape we depend on diverges between releases. Letting the
    // SDK choose keeps types and runtime in lockstep.
    typescript: true,
    appInfo: {
      name: "Wavloops",
      version: "1.0.0",
      url: "https://wavloops.co",
    },
  });
  return cached;
}

export type StripeMode = "test" | "live" | "unknown";

/** Inspect the key prefix to know which Stripe environment we're
 *  bound to. Cheaper than a /v1/account round-trip and works
 *  before the SDK has been used. */
export function getStripeMode(): StripeMode {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}
