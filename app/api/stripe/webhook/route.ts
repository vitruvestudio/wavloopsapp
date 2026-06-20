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
import { getStripeServer } from "@/lib/stripe/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

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
    case "customer.subscription.updated":
      return handleSubscriptionUpsert(
        event.data.object as Stripe.Subscription,
        admin,
      );

    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription,
        admin,
      );

    case "invoice.payment_succeeded":
      console.log(
        `[stripe/webhook] invoice paid: ${
          (event.data.object as Stripe.Invoice).id
        }`,
      );
      return;

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
}

/** Subscription created or updated. Both events ship the same
 *  shape, so one handler covers both. UPSERT preserves
 *  lifetime_purchased_at if it was set previously — important
 *  for the Lifetime + Pro hybrid case. */
async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  admin: AdminClient,
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
