/**
 * Stripe Customer resolver — lazy create + cache on the subscriptions row.
 *
 * Why lazy
 * ────────
 * Eagerly creating a Stripe Customer for every auth signup would
 * pollute the dashboard with thousands of empty rows (most users
 * will stay on Free forever). We only mint a Customer the first
 * time the user clicks "Upgrade" and need a checkout session.
 *
 * Why two-sided storage
 * ─────────────────────
 * - On the Stripe side, the Customer is created with
 *   `metadata.user_id` so a support agent can trace it back to
 *   our DB even if the subscriptions row is dropped.
 * - On our side, the resulting `stripe_customer_id` is written
 *   to the subscriptions row so subsequent checkouts skip the
 *   Stripe API call entirely.
 *
 * Why the admin client
 * ────────────────────
 * The subscriptions table has RLS that denies all client writes;
 * only service-role can insert/update. The webhook also writes
 * here later, so reusing the admin client keeps the contract
 * consistent.
 */

import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { getStripeServer } from "./server";

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const admin = getAdminSupabase();

  // Fast path — subscriptions row already has the customer id.
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle<{ stripe_customer_id: string | null }>();
  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  // Slow path — mint the Customer in Stripe with metadata pointing
  // back to the auth user. The metadata is what lets a support
  // agent (or a future migration) reconcile dashboard rows with
  // our DB even if the subscriptions row is dropped.
  const stripe = getStripeServer();
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  // Upsert the local row. If a row already exists (e.g. a prior
  // failed checkout left bookkeeping behind), we only patch the
  // customer id and leave plan/status alone — the webhook owns
  // those columns.
  // The `as never` cast is necessary because the admin Supabase
  // client isn't typed with the Database schema generic — same
  // pattern other action files use when writing to tables not
  // exposed in the hand-crafted database.types.ts.
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
    } as never,
    { onConflict: "user_id" },
  );
  if (error) {
    // Don't strand the Customer in Stripe with no local link —
    // surface the error so the caller can decide. The Customer
    // stays in Stripe; next attempt will re-find it via metadata.
    console.warn("[stripe/customer] subscriptions upsert failed", error);
    throw new Error("Could not link Stripe customer to user.");
  }
  return customer.id;
}
