/**
 * Affiliate commission engine — server-only.
 *
 * One entry point: `applyAffiliateCommission()`. Called from the
 * Stripe webhook on every paid event we care about:
 *
 *   - Lifetime checkout completed → recurrence_index = 0,
 *     flips the existing pending referral row to 'approved'.
 *   - Pro invoice.payment_succeeded → mints a NEW referral row
 *     per paid invoice (recurrence_index = 0..11), up to the
 *     COMMISSION_RECURRING_MONTHS cap. After the cap the
 *     subscription stops generating commissions; the customer
 *     keeps their plan, the affiliate just stops earning on it.
 *
 * Idempotency comes from the DB's unique indexes on
 *   (stripe_invoice_id, recurrence_index)
 *   (stripe_payment_intent_id) WHERE recurrence_index = 0
 * so a Stripe webhook re-delivery never double-credits.
 *
 * Attribution window: a pending referral older than
 * ATTRIBUTION_WINDOW_DAYS gets marked 'expired' on first read
 * (the visitor came back after the window closed). The webhook
 * skips expired referrals.
 *
 * Self-referral guard: enforced upstream at attribution time
 * (auth/callback compares affiliate.user_id vs the signing-in
 * user), so this layer trusts the referral row's affiliate_id.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ATTRIBUTION_WINDOW_DAYS,
  COMMISSION_RATE_DEFAULT,
  COMMISSION_RECURRING_MONTHS,
  type ReferralPlanKey,
} from "./config";

interface ApplyCommissionInput {
  admin: SupabaseClient;
  userId: string;
  planKey: ReferralPlanKey;
  grossAmountCents: number;
  stripe: {
    customerId?: string | null;
    paymentIntentId?: string | null;
    subscriptionId?: string | null;
    invoiceId?: string | null;
  };
}

interface ApplyCommissionResult {
  applied: boolean;
  reason?:
    | "no_referral"
    | "expired"
    | "already_processed"
    | "recurrence_cap_reached"
    | "self_referral"
    | "affiliate_inactive";
  commissionCents?: number;
  affiliateId?: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function applyAffiliateCommission(
  input: ApplyCommissionInput,
): Promise<ApplyCommissionResult> {
  const { admin, userId, planKey, grossAmountCents, stripe } = input;

  // Find the FIRST referral row for this user — first-touch
  // attribution means the row created at signup time is the
  // canonical one. For Pro recurring we'll mint sibling rows
  // beside it (same affiliate_id, recurrence_index > 0).
  const { data: rootReferral, error: rootErr } = await admin
    .from("affiliate_referrals")
    .select("*, affiliate:affiliates(id, user_id, commission_rate, status, is_active)")
    .eq("attributed_user_id", userId)
    .eq("recurrence_index", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (rootErr) {
    console.warn("[affiliate] root referral lookup failed", rootErr.message);
    return { applied: false, reason: "no_referral" };
  }
  if (!rootReferral) {
    return { applied: false, reason: "no_referral" };
  }

  type AffiliateJoin = {
    id: string;
    user_id: string | null;
    commission_rate: number;
    status: string;
    is_active: boolean;
  };
  const affiliate = rootReferral.affiliate as AffiliateJoin | null;
  if (!affiliate || affiliate.status !== "active" || !affiliate.is_active) {
    return { applied: false, reason: "affiliate_inactive" };
  }
  // Defense-in-depth: belt-and-braces self-referral check.
  if (affiliate.user_id && affiliate.user_id === userId) {
    return { applied: false, reason: "self_referral" };
  }

  const commissionRate = Number(affiliate.commission_rate) || COMMISSION_RATE_DEFAULT;

  // Attribution window — too late to credit.
  const startedAt = new Date(rootReferral.attribution_started_at).getTime();
  const ageDays = (Date.now() - startedAt) / MS_PER_DAY;
  if (ageDays > ATTRIBUTION_WINDOW_DAYS) {
    // Mark expired so we don't keep checking on subsequent
    // events. Best-effort — failure isn't fatal.
    await admin
      .from("affiliate_referrals")
      .update({ status: "expired" })
      .eq("id", rootReferral.id)
      .eq("status", "pending");
    return { applied: false, reason: "expired" };
  }

  /* ============================================================
     Lifetime — flip the pending root row to approved.
     ============================================================ */
  if (planKey === "lifetime") {
    // Already processed?
    if (rootReferral.status !== "pending") {
      return {
        applied: false,
        reason: "already_processed",
        affiliateId: affiliate.id,
      };
    }
    const commissionCents = Math.floor(grossAmountCents * commissionRate);

    const { error: updErr } = await admin
      .from("affiliate_referrals")
      .update({
        status: "approved",
        plan_key: planKey,
        stripe_customer_id: stripe.customerId ?? null,
        stripe_payment_intent_id: stripe.paymentIntentId ?? null,
        stripe_invoice_id: stripe.invoiceId ?? null,
        gross_amount_cents: grossAmountCents,
        commission_cents: commissionCents,
        converted_at: new Date().toISOString(),
      })
      .eq("id", rootReferral.id)
      .eq("status", "pending"); // double-check no race with another retry
    if (updErr) {
      console.warn("[affiliate] lifetime update failed", updErr.message);
      return { applied: false, reason: "no_referral" };
    }

    await admin.rpc("increment_affiliate_earnings", {
      p_affiliate_id: affiliate.id,
      p_amount_cents: commissionCents,
    });

    return { applied: true, commissionCents, affiliateId: affiliate.id };
  }

  /* ============================================================
     Pro recurring — mint a new row per invoice up to the cap.
     ============================================================ */
  if (planKey === "pro_monthly" || planKey === "pro_yearly") {
    // Count existing approved/paid rows for this user to derive
    // the next recurrence_index. We cap at COMMISSION_RECURRING_MONTHS.
    const { count: existingCount } = await admin
      .from("affiliate_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliate.id)
      .eq("attributed_user_id", userId)
      .in("status", ["approved", "paid"]);

    const nextIndex = existingCount ?? 0;
    if (nextIndex >= COMMISSION_RECURRING_MONTHS) {
      return {
        applied: false,
        reason: "recurrence_cap_reached",
        affiliateId: affiliate.id,
      };
    }

    const commissionCents = Math.floor(grossAmountCents * commissionRate);

    if (nextIndex === 0) {
      // First Pro invoice — flip the pending root row.
      const { error: updErr } = await admin
        .from("affiliate_referrals")
        .update({
          status: "approved",
          plan_key: planKey,
          stripe_customer_id: stripe.customerId ?? null,
          stripe_subscription_id: stripe.subscriptionId ?? null,
          stripe_invoice_id: stripe.invoiceId ?? null,
          gross_amount_cents: grossAmountCents,
          commission_cents: commissionCents,
          converted_at: new Date().toISOString(),
        })
        .eq("id", rootReferral.id)
        .eq("status", "pending");
      if (updErr) {
        console.warn("[affiliate] pro first-invoice update failed", updErr.message);
        return { applied: false, reason: "no_referral" };
      }
    } else {
      // Subsequent invoice — insert a sibling row with the next
      // recurrence_index. The DB unique index on
      // (stripe_invoice_id, recurrence_index) makes this idempotent
      // across webhook retries.
      const { error: insErr } = await admin
        .from("affiliate_referrals")
        .insert({
          affiliate_id: affiliate.id,
          attributed_user_id: userId,
          status: "approved",
          plan_key: planKey,
          stripe_customer_id: stripe.customerId ?? null,
          stripe_subscription_id: stripe.subscriptionId ?? null,
          stripe_invoice_id: stripe.invoiceId ?? null,
          gross_amount_cents: grossAmountCents,
          commission_cents: commissionCents,
          recurrence_index: nextIndex,
          attribution_started_at: rootReferral.attribution_started_at,
          converted_at: new Date().toISOString(),
        });
      if (insErr) {
        // 23505 = unique_violation. Webhook retry → row already
        // exists → idempotent skip.
        if ((insErr as { code?: string }).code === "23505") {
          return {
            applied: false,
            reason: "already_processed",
            affiliateId: affiliate.id,
          };
        }
        console.warn("[affiliate] pro recurring insert failed", insErr.message);
        return { applied: false, reason: "no_referral" };
      }
    }

    await admin.rpc("increment_affiliate_earnings", {
      p_affiliate_id: affiliate.id,
      p_amount_cents: commissionCents,
    });

    return { applied: true, commissionCents, affiliateId: affiliate.id };
  }

  return { applied: false, reason: "no_referral" };
}

/** Clawback helper used by the refund handler. The DB RPC
 *  enforces idempotency. */
export async function clawbackAffiliateForPayment(
  admin: SupabaseClient,
  paymentIntentId: string,
): Promise<void> {
  const { data: referral } = await admin
    .from("affiliate_referrals")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("recurrence_index", 0)
    .maybeSingle<{ id: string }>();
  if (!referral?.id) return;
  await admin.rpc("clawback_affiliate_commission", {
    p_referral_id: referral.id,
  });
}
