/**
 * Stripe Webhook — the only writer of `public.subscriptions`.
 *
 * Pipeline
 * ────────
 *   1. Verify signature against STRIPE_WEBHOOK_SECRET. A bad
 *      signature is a 400 with no work done. Without this gate
 *      anyone could POST a forged event and flip a user to Pro
 *      for free.
 *   2. Idempotency check — Stripe re-delivers on any non-2xx
 *      and sometimes on 2xx too. We log every processed event
 *      id in `stripe_events_processed`; same id twice → no-op.
 *   3. Dispatch by event.type. Handlers are themselves
 *      idempotent (UPDATE same-shape rows, no INSERTs of
 *      drift-prone state) as a belt-and-braces.
 *   4. Mark the event processed AFTER the handler succeeds.
 *      A crashed handler retries on the next delivery; a
 *      successful handler that fails to insert the marker
 *      retries once more, which is fine.
 *
 * Why node runtime
 * ────────────────
 * Stripe's `constructEvent` needs the EXACT raw body bytes to
 * verify the signature; Vercel's edge runtime can re-encode
 * UTF-8 in transit. nodejs runtime gets the bytes verbatim via
 * `request.text()`.
 *
 * Why we don't 500 on handler errors after the marker insert
 * ───────────────────────────────────────────────────────────
 * If the handler succeeds but inserting the marker fails (e.g.
 * primary key collision from a parallel retry), Stripe retrying
 * is harmless because the next attempt will hit the cache. Only
 * pre-marker failures bubble up as 500s so Stripe retries.
 */

import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  applyAffiliateCommission,
  clawbackAffiliateForPayment,
} from "@/lib/affiliate/server";
import { planKeyFromLookup } from "@/lib/affiliate/config";
import { getStripeServer } from "@/lib/stripe/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  capture as posthogCapture,
  identify as posthogIdentify,
  flushServerEvents,
} from "@/lib/analytics/posthog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof getAdminSupabase>;

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured for this env",
    );
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  // Read raw bytes — never .json() here, Stripe verifies the
  // signature against the literal request body.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeServer();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.warn("[stripe/webhook] signature verification failed:", msg);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  const admin = getAdminSupabase();

  // Idempotency — skip if we've already processed this event id.
  //
  // KNOWN GAP (accepted at MVP): the SELECT and INSERT below are
  // separate round-trips. If Stripe delivers the same event twice
  // in tight succession (rare but documented), both deliveries
  // can pass this SELECT before either reaches the INSERT, then
  // both fire `dispatch()`. This is SAFE today because every
  // handler is itself idempotent (UPSERTs on subscriptions keyed
  // by user_id / stripe_subscription_id, no side-effects beyond
  // the DB write). The marker INSERT then deduplicates downstream
  // observers.
  //
  // If we ever add a side-effect that ISN'T safe to run twice
  // (a transactional "Welcome to Pro" email, a Slack ping, a
  // referral bounty payout), wrap this check in a single
  // round-trip UPSERT — INSERT ... ON CONFLICT (event_id) DO
  // NOTHING RETURNING event_id; absence of returned row = already
  // processed, bail. The unique constraint on event_id makes that
  // atomic.
  const { data: existing } = await admin
    .from("stripe_events_processed")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await dispatch(event, admin);
  } catch (err) {
    console.error(
      `[stripe/webhook] handler failed for ${event.type} (${event.id}):`,
      err,
    );
    // 500 so Stripe retries. Handler is idempotent.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  // Mark processed AFTER successful handler. Insert failure here
  // is non-fatal — Stripe will retry, idempotency cache will
  // catch the duplicate on the second pass.
  const { error: markErr } = await admin
    .from("stripe_events_processed")
    .insert({
      event_id: event.id,
      event_type: event.type,
    } as never);
  if (markErr) {
    console.warn(
      `[stripe/webhook] could not mark ${event.id} processed:`,
      markErr.message,
    );
  }

  return NextResponse.json({ received: true });
}

/* ============================================================
   Dispatch
   ============================================================ */

async function dispatch(event: Stripe.Event, admin: AdminClient) {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
        admin,
      );

    case "customer.subscription.created":
      return handleSubscriptionUpsert(
        event.data.object as Stripe.Subscription,
        admin,
        { isCreate: true },
      );
    case "customer.subscription.updated":
      return handleSubscriptionUpsert(
        event.data.object as Stripe.Subscription,
        admin,
        { isCreate: false },
      );

    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription,
        admin,
      );

    case "invoice.payment_succeeded":
      return handleInvoicePaid(event.data.object as Stripe.Invoice, admin);

    case "charge.refunded":
      return handleChargeRefunded(
        event.data.object as Stripe.Charge,
        admin,
      );

    case "invoice.payment_failed":
      // Phase 4+ will email the user. For now, log only — Stripe's
      // automatic dunning emails already cover the user-facing side.
      console.warn(
        `[stripe/webhook] invoice failed: ${
          (event.data.object as Stripe.Invoice).id
        }`,
      );
      return;

    default:
      // Defensive: events we didn't subscribe to shouldn't reach
      // here, but log if they do.
      console.log(`[stripe/webhook] unhandled event type: ${event.type}`);
      return;
  }
}

/* ============================================================
   user_id resolution
   ────────────────────────────────────────────────────────────
   Three concentric strategies, fastest first:
     1. metadata.user_id on the event object directly (we set it
        in createCheckoutSession on Session, Subscription, AND
        PaymentIntent for exactly this).
     2. Lookup by stripe_customer_id in our subscriptions table
        (populated by getOrCreateStripeCustomer at checkout time).
     3. Round-trip Stripe to fetch the Customer + read its
        metadata.user_id (our last-resort fallback).
   ============================================================ */

async function resolveUserId(
  obj: {
    metadata?: Stripe.Metadata | null;
    customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  },
  admin: AdminClient,
): Promise<string | null> {
  const metaUid = obj.metadata?.user_id;
  if (metaUid) return metaUid;

  const customerId =
    typeof obj.customer === "string"
      ? obj.customer
      : (obj.customer?.id ?? null);
  if (!customerId) return null;

  const { data: row } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ user_id: string }>();
  if (row?.user_id) return row.user_id;

  // Final fallback — fetch the customer + read metadata.
  try {
    const stripe = getStripeServer();
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && customer.metadata?.user_id) {
      return customer.metadata.user_id;
    }
  } catch (e) {
    console.warn("[stripe/webhook] customer fetch fallback failed:", e);
  }
  return null;
}

/* ============================================================
   Handlers
   ============================================================ */

/** A successful checkout. Two flavors:
 *   - mode=payment  → Lifetime. Stamp lifetime_purchased_at.
 *   - mode=subscription → Pro. The Pro provisioning happens via
 *     customer.subscription.created which carries more reliable
 *     status data, so this branch is a no-op (early plan='pro'
 *     would race against the subscription event). */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  admin: AdminClient,
) {
  if (session.mode !== "payment") {
    // Subscription mode — defer to customer.subscription.created.
    return;
  }
  // Lifetime path.
  const userId = await resolveUserId(session, admin);
  if (!userId) {
    throw new Error(
      `Cannot resolve user_id for Lifetime checkout ${session.id}`,
    );
  }
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "lifetime",
      // Lifetime has no recurring lifecycle; status stays 'active'
      // as the marker that the purchase is current.
      status: "active",
      stripe_customer_id: customerId,
      lifetime_purchased_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
  console.log(
    `[stripe/webhook] lifetime activated for user ${userId} (session ${session.id})`,
  );

  // PostHog: revenue event. Fires only on the CHECKOUT completion,
  // not on any subsequent read of the row, so it stays 1:1 with
  // paid conversions. `revenue_usd_cents` is left raw so PostHog
  // insights can bucket by currency downstream if we ever ship
  // non-USD pricing. Best-effort — analytics doesn't gate revenue.
  try {
    await posthogIdentify(userId, { plan: "lifetime" });
    await posthogCapture(userId, "subscription_upgraded", {
      plan: "lifetime",
      revenue_usd_cents: session.amount_total ?? null,
      stripe_session_id: session.id,
    });
    await flushServerEvents();
  } catch (e) {
    console.warn("[stripe/webhook] posthog subscription_upgraded failed", e);
  }

  // Affiliate commission — best-effort. We don't want a failure
  // here to cause Stripe to retry the entire webhook (the user is
  // already provisioned). Errors are logged inside the helper.
  try {
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    const grossAmountCents = session.amount_total ?? 0;
    if (grossAmountCents > 0) {
      await applyAffiliateCommission({
        admin,
        userId,
        planKey: "lifetime",
        grossAmountCents,
        stripe: {
          customerId,
          paymentIntentId,
          invoiceId:
            typeof session.invoice === "string"
              ? session.invoice
              : (session.invoice?.id ?? null),
        },
      });
    }
  } catch (e) {
    console.warn(
      "[stripe/webhook] affiliate commission (lifetime) failed",
      e,
    );
  }
}

/** Subscription created or updated. Both events ship the same
 *  shape, so one handler covers both. UPSERT preserves
 *  lifetime_purchased_at if it was set previously — important
 *  for the Lifetime + Pro hybrid case. */
async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  admin: AdminClient,
  { isCreate }: { isCreate: boolean },
) {
  const userId = await resolveUserId(sub, admin);
  if (!userId) {
    throw new Error(`Cannot resolve user_id for subscription ${sub.id}`);
  }

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Stripe sends current_period_end as a unix timestamp at the
  // root of the subscription object in older API versions and
  // inside the active phase in newer ones. Probe both.
  const cpeUnix: number | null =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null;
  const currentPeriodEnd =
    cpeUnix != null ? new Date(cpeUnix * 1000).toISOString() : null;

  // Stripe statuses we accept verbatim; anything else we coerce
  // to 'inactive' so the CHECK constraint passes.
  const ACCEPTED_STATUSES = new Set([
    "active",
    "trialing",
    "past_due",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "unpaid",
    "paused",
  ]);
  const status = ACCEPTED_STATUSES.has(sub.status)
    ? sub.status
    : "inactive";

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "pro",
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    } as never,
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
  console.log(
    `[stripe/webhook] subscription ${sub.id} → ${status} for user ${userId}`,
  );

  // PostHog: fire subscription_upgraded ONLY on the create event.
  // customer.subscription.updated fires on every renewal, cancel-
  // at-period-end toggle, plan swap, tax delta, etc. — we don't
  // want any of those in the "upgraded" funnel. The plan properties
  // still identify() on every write so cohorts stay fresh.
  try {
    await posthogIdentify(userId, { plan: "pro" });
    if (isCreate && status === "active") {
      await posthogCapture(userId, "subscription_upgraded", {
        plan: "pro",
        stripe_subscription_id: sub.id,
      });
    }
    await flushServerEvents();
  } catch (e) {
    console.warn("[stripe/webhook] posthog subscription_upgraded failed", e);
  }
}

/** Subscription deleted (final cancellation). We do NOT clear
 *  lifetime_purchased_at — a Lifetime+Pro hybrid customer
 *  reverts to Lifetime via get_user_plan()'s resolution order.
 *  Plain Pro users get the implicit downgrade to Free for free
 *  (no row update needed — status='canceled' alone is enough). */
async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  admin: AdminClient,
) {
  const userId = await resolveUserId(sub, admin);
  if (!userId) {
    throw new Error(
      `Cannot resolve user_id for canceled subscription ${sub.id}`,
    );
  }

  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      // Keep stripe_subscription_id for audit; it's the only
      // breadcrumb back to the canceled sub if a support case
      // comes in later.
    } as never)
    .eq("user_id", userId);
  if (error) throw new Error(`subscriptions update failed: ${error.message}`);
  console.log(
    `[stripe/webhook] subscription ${sub.id} canceled for user ${userId}`,
  );
}

/** Pro recurring invoice — fires on each monthly/yearly billing.
 *  We use this event (not customer.subscription.created) to drive
 *  the affiliate commission because:
 *    1. It also fires on the FIRST Pro invoice (no special-case).
 *    2. It carries `amount_paid` directly (subscription events
 *       don't always have the amount denormalised).
 *    3. Stripe retries this event on any 5xx; idempotency is
 *       guaranteed by the DB unique index on
 *       (stripe_invoice_id, recurrence_index).
 *
 *  Non-subscription invoices (Lifetime had its own checkout
 *  branch) are ignored — we'd double-credit Lifetime otherwise. */
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  admin: AdminClient,
) {
  const subId =
    typeof (invoice as unknown as { subscription?: string | Stripe.Subscription })
      .subscription === "string"
      ? ((invoice as unknown as { subscription: string }).subscription as string)
      : (
          (invoice as unknown as { subscription?: Stripe.Subscription })
            .subscription?.id ?? null
        );
  if (!subId) {
    // Non-subscription invoice (e.g. one-time billed via
    // Invoices API). Wavloops doesn't use these — log and move on.
    console.log(
      `[stripe/webhook] invoice ${invoice.id} has no subscription id, skipping affiliate`,
    );
    return;
  }

  const userId = await resolveUserId(invoice, admin);
  if (!userId) {
    console.warn(
      `[stripe/webhook] cannot resolve user for invoice ${invoice.id}`,
    );
    return;
  }

  // Extract the Stripe lookup_key from the first line item.
  // Different Stripe API versions surface the price reference
  // under different paths on InvoiceLineItem:
  //   - Newer API (2024-06+):       line.pricing.price_details.price
  //   - Slightly older variants:    line.pricing.price
  //   - Older / classic shape:      line.price (expanded Price object)
  //                                 or line.price as a string id
  //   - Brand-new (2025+):          line.pricing.price_details.product
  //                                 also exists in parallel
  //
  // We try every known path before giving up, and we also accept
  // an already-expanded Price object so we can skip the
  // round-trip to Stripe entirely when possible. Pro subscriptions
  // have a single price line; multi-line invoices pick the first.
  const firstLine = invoice.lines?.data?.[0];
  let lookupKey: string | null = null;
  let resolvedPriceId: string | null = null;
  if (firstLine) {
    const anyLine = firstLine as unknown as Record<string, unknown>;

    // Path 1 — expanded Price object on the line item.
    const linePrice = anyLine.price as
      | { id?: string; lookup_key?: string | null }
      | string
      | null
      | undefined;
    if (linePrice && typeof linePrice === "object") {
      if (linePrice.lookup_key) lookupKey = linePrice.lookup_key;
      if (!resolvedPriceId && linePrice.id) resolvedPriceId = linePrice.id;
    } else if (typeof linePrice === "string") {
      resolvedPriceId = linePrice;
    }

    // Path 2 — newer pricing.price_details.price (string id).
    if (!resolvedPriceId) {
      const pricing = anyLine.pricing as
        | {
            price?: string | null;
            price_details?: { price?: string | null } | null;
          }
        | undefined;
      const fromDetails = pricing?.price_details?.price ?? null;
      const fromPricing = pricing?.price ?? null;
      resolvedPriceId = fromDetails || fromPricing || null;
    }

    // Path 3 — round-trip Stripe to fetch the Price by id.
    if (!lookupKey && resolvedPriceId) {
      try {
        const stripe = getStripeServer();
        const price = await stripe.prices.retrieve(resolvedPriceId);
        lookupKey = price.lookup_key ?? null;
      } catch (e) {
        console.warn(
          `[stripe/webhook] failed to resolve price ${resolvedPriceId} for invoice ${invoice.id}`,
          e,
        );
      }
    }
  }
  if (!lookupKey) {
    // Log enough context to debug the next time this fires —
    // earlier this path was silently dropping every Pro invoice
    // because the SDK's actual shape didn't match the single
    // path we tried. Include the line keys so we can spot the
    // payload shape from Vercel logs without replaying the event.
    const lineKeys = firstLine
      ? Object.keys(firstLine as unknown as Record<string, unknown>)
      : [];
    console.warn(
      `[stripe/webhook] invoice ${invoice.id} missing lookup_key, skipping affiliate. line.keys=${JSON.stringify(lineKeys)} resolvedPriceId=${resolvedPriceId ?? "null"}`,
    );
    return;
  }
  const planKey = planKeyFromLookup(lookupKey);
  if (!planKey || planKey === "lifetime") {
    // Lifetime isn't billed via invoice events — defensive skip.
    return;
  }

  const grossAmountCents = invoice.amount_paid ?? 0;
  if (grossAmountCents <= 0) {
    return;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer?.id ?? null);

  try {
    const result = await applyAffiliateCommission({
      admin,
      userId,
      planKey,
      grossAmountCents,
      stripe: {
        customerId,
        subscriptionId: subId,
        invoiceId: invoice.id ?? null,
      },
    });
    if (result.applied) {
      console.log(
        `[stripe/webhook] affiliate commission $${
          (result.commissionCents ?? 0) / 100
        } credited for invoice ${invoice.id}`,
      );
    }
  } catch (e) {
    console.warn(
      "[stripe/webhook] affiliate commission (pro recurring) failed",
      e,
    );
  }
}

/** Charge refunded — clawback the affiliate commission so the
 *  payee doesn't keep money on a transaction we just reversed.
 *  The DB RPC is idempotent so retry deliveries are safe. */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  admin: AdminClient,
) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);
  if (!paymentIntentId) return;
  try {
    await clawbackAffiliateForPayment(admin, paymentIntentId);
  } catch (e) {
    console.warn(
      `[stripe/webhook] affiliate clawback failed for ${paymentIntentId}`,
      e,
    );
  }
}
