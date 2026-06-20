/**
 * Billing — Stripe Checkout + Customer Portal server actions.
 *
 * Both actions end in a redirect (the Stripe-hosted URL). They
 * never return a value to the caller — useTransition + Next 16
 * propagate the NEXT_REDIRECT throw correctly through client
 * components.
 *
 * Why resolve prices by lookup_key
 * ─────────────────────────────────
 * Hardcoding `price_id` literals would force a code change every
 * time someone touches the Stripe dashboard, AND break the
 * TEST/LIVE separation (each env has its own price ids). Lookup
 * keys are stable strings we own ("wavloops_pro_monthly" etc.)
 * that resolve to whatever price object is active in the current
 * Stripe environment.
 *
 * Why the metadata duplication
 * ────────────────────────────
 * `metadata.user_id` is set on the Session, the Subscription, AND
 * the PaymentIntent. The webhook only needs one of them, but the
 * three event types we listen to each surface the metadata
 * differently:
 *   - checkout.session.completed → session.metadata
 *   - customer.subscription.* → subscription.metadata
 *   - invoice.payment_* → payment_intent.metadata (via invoice)
 * Duplicating is cheap insurance against having to chase IDs
 * through Stripe API calls inside the webhook.
 */

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  STRIPE_LOOKUP_KEYS,
  type StripeLookupKey,
} from "@/lib/billing/plans";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { getStripeServer } from "@/lib/stripe/server";

const SUBSCRIPTION_LOOKUP_KEYS: ReadonlySet<StripeLookupKey> = new Set([
  STRIPE_LOOKUP_KEYS.proMonthly,
  STRIPE_LOOKUP_KEYS.proYearly,
]);

/** Resolve the public origin for Stripe success/cancel URLs.
 *
 * Two distinct modes:
 *
 * 1. **Production** (`VERCEL_ENV === 'production'`) — return the
 *    hardcoded canonical origin `https://wavloops.co`. We do NOT
 *    trust the Host header here because a malicious upstream
 *    proxy or DNS poisoning could otherwise smuggle in an
 *    attacker-controlled `Host: evil.com` that we'd bake into a
 *    `success_url`. Stripe would then redirect the user there
 *    post-checkout, leaking the `session_id` query param.
 *
 * 2. **Preview / dev / anything else** — use the Host header.
 *    Vercel sets this from its edge layer (signed, not
 *    spoofable from an external client), so on preview deploys
 *    a checkout on `wavloopsapp-xyz.vercel.app` returns the
 *    right preview URL — keeping the user's session alive
 *    through the redirect. This is the case the original
 *    "headers first" inversion was designed to fix.
 *
 * Note on protocol: we hard-set `https` regardless of
 * `X-Forwarded-Proto`. Stripe rejects non-HTTPS success URLs in
 * live mode anyway, but locking it down here means a single
 * downgrade attempt (`X-Forwarded-Proto: http`) can't produce a
 * checkout that lands the user on an interceptable HTTP page. */
const CANONICAL_PROD_ORIGIN = "https://wavloops.co";

async function resolveOrigin(): Promise<string> {
  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_PROD_ORIGIN;
  }
  const h = await headers();
  const host = h.get("host");
  if (host) return `https://${host}`;
  // Fallback for non-HTTP contexts (cron, scripts) outside prod.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  return CANONICAL_PROD_ORIGIN;
}

/** Start a Stripe Checkout Session for the requested lookup_key
 *  and redirect the user there. Throws on configuration errors
 *  (missing price, no email on the user) so they surface clearly
 *  rather than silently dropping the user back on /pricing. */
export async function createCheckoutSession(
  lookupKey: StripeLookupKey,
): Promise<void> {
  // 1. Auth — must be signed in with a verifiable email so Stripe
  //    can attach the customer record sanely.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent("/pricing")}`);
  }
  if (!user.email) {
    // No email on session is a Supabase oddity, but worth guarding.
    throw new Error("Account has no email — cannot create Stripe customer.");
  }

  // 2. Resolve (or create) the Stripe Customer for this user.
  const customerId = await getOrCreateStripeCustomer(user.id, user.email);

  // 3. Resolve the price via lookup_key. ONE API round-trip; the
  //    result will be cached upstream by Stripe so latency is
  //    very low after the first checkout.
  const stripe = getStripeServer();
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    expand: ["data.product"],
    limit: 1,
  });
  const price = prices.data[0];
  if (!price) {
    throw new Error(
      `No Stripe price found for lookup_key="${lookupKey}". ` +
        `Verify the products were created in this Stripe environment.`,
    );
  }

  const isSubscription = SUBSCRIPTION_LOOKUP_KEYS.has(lookupKey);
  const origin = await resolveOrigin();

  // 4. Create the Session. Metadata is set in 3 places — see
  //    the file header for why.
  const sharedMetadata = {
    user_id: user.id,
    lookup_key: lookupKey,
  } as const;

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    customer: customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    client_reference_id: user.id,
    metadata: { ...sharedMetadata },
    ...(isSubscription
      ? {
          subscription_data: { metadata: { ...sharedMetadata } },
        }
      : {
          payment_intent_data: { metadata: { ...sharedMetadata } },
        }),
    // Allow Stripe to enrich the Customer with billing details
    // (name + address) collected during checkout. Useful for tax
    // compliance and clean dashboards.
    customer_update: { name: "auto", address: "auto" },
    allow_promotion_codes: true,
    // Honour the user's browser locale rather than forcing English.
    locale: "auto",
  });

  if (!session.url) {
    throw new Error("Stripe Checkout returned no URL — aborting redirect.");
  }
  redirect(session.url);
}

/** Open the Stripe Customer Portal so the user can update their
 *  payment method, view invoices, and cancel/resume Pro. The
 *  portal handles everything itself — we just provide a return
 *  URL for when the user is done. */
export async function createBillingPortalSession(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  if (!sub?.stripe_customer_id) {
    // No customer = nothing to manage. Route back to /pricing so
    // they can subscribe instead.
    redirect("/pricing");
  }

  const origin = await resolveOrigin();
  const stripe = getStripeServer();
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    // Phase 6 will move this to /settings/billing. For now /pricing
    // is the closest landing surface that exists.
    return_url: `${origin}/pricing`,
  });
  redirect(portal.url);
}
