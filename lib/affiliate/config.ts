/**
 * Affiliate program constants — single source of truth.
 *
 * Touch THIS file (not server.ts or the webhook handler) when you
 * want to tune the commission rate, the cookie window, or the
 * payout threshold. Every consumer reads from here, so the change
 * propagates everywhere in one edit.
 *
 * Money: cents everywhere. Stripe's `unit_amount` is cents, the
 * referrals row stores cents, payouts are cents. The dashboard
 * formats to USD strings at the leaf.
 */

/** Default commission rate when an affiliate has no row-level
 *  override. 30% = standard SaaS 2026 (Notion 50% for Personal,
 *  Webflow 50% for first year, Linear 25%). 30% is a fair middle
 *  that keeps margin while being attractive enough to retain
 *  active promoters. */
export const COMMISSION_RATE_DEFAULT = 0.3;

/** How long the ?ref= cookie sticks on a visitor's browser. 60
 *  days is the SaaS middle-ground (Notion ships 90, Webflow 60,
 *  Lemonsqueezy 30). 60 days catches both impulse buyers and the
 *  "I'll come back to it on Monday" cohort without absurdly long
 *  attribution windows that get gamed. */
export const ATTRIBUTION_WINDOW_DAYS = 60;

/** Cap on how many recurring Pro subscription invoices count
 *  towards an affiliate's commission. The cap is expressed in
 *  MONTHS of customer billing covered, not in number of invoices —
 *  so a yearly Pro plan exhausts the cap in a single invoice and a
 *  monthly Pro plan exhausts it over 12 invoices. Both cases
 *  commission the same gross dollar slice over the same time
 *  window, matching the industry-standard "pay affiliate for the
 *  first 12 months of customer LTV" model.
 *
 *  Use commissionCapInvoicesForPlan() to convert this into the
 *  effective invoice-count cap for a given plan. */
export const COMMISSION_RECURRING_MONTHS = 12;

/** Returns the maximum number of invoice rows we may mint for a
 *  given plan before the affiliate stops earning on that
 *  subscription. Derived from COMMISSION_RECURRING_MONTHS by
 *  dividing by the billing interval in months:
 *    - pro_monthly → 12 invoices  (12 / 1)
 *    - pro_yearly  → 1 invoice    (12 / 12)
 *    - lifetime    → 1 invoice    (the one-shot conversion event)
 *
 *  If we ever introduce a quarterly plan, add a branch here; the
 *  rest of the commission engine already routes through this. */
export function commissionCapInvoicesForPlan(
  planKey: ReferralPlanKey,
): number {
  switch (planKey) {
    case "lifetime":
      return 1;
    case "pro_monthly":
      return COMMISSION_RECURRING_MONTHS;
    case "pro_yearly":
      return Math.max(1, Math.floor(COMMISSION_RECURRING_MONTHS / 12));
  }
}

/** Minimum unpaid balance to trigger a monthly payout. Anything
 *  below rolls over to next month. $25 is generous vs the
 *  industry-standard $50, chosen so new affiliates feel their
 *  first payout fast. */
export const MIN_PAYOUT_CENTS = 25_00;

/** Cookie name. Prefixed `wlp_` so it pattern-matches the rest of
 *  Wavloops's cookie scheme (`wlp_last_mode`, etc.). */
export const REF_COOKIE_NAME = "wlp_ref";

/** Cookie TTL in seconds. Derived from ATTRIBUTION_WINDOW_DAYS so
 *  the two stay in sync. */
export const REF_COOKIE_TTL_SECONDS = ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60;

/** Same regex as the affiliates.handle CHECK constraint in the
 *  DB. Used in the proxy + signup form to reject invalid handles
 *  BEFORE they hit the DB so we surface friendlier errors. */
export const HANDLE_REGEX = /^[a-zA-Z0-9_-]{2,32}$/;

/** Convert a plan_key to its enum value. The webhook receives a
 *  Stripe lookup_key; we map it to the same plan_key string the
 *  referrals.plan_key column accepts. */
export function planKeyFromLookup(lookupKey: string): ReferralPlanKey | null {
  if (lookupKey.includes("lifetime")) return "lifetime";
  if (lookupKey.includes("pro_monthly")) return "pro_monthly";
  if (lookupKey.includes("pro_yearly")) return "pro_yearly";
  return null;
}

export type ReferralPlanKey = "lifetime" | "pro_monthly" | "pro_yearly";

export type AffiliateStatus = "pending" | "active" | "suspended" | "rejected";

export type ReferralStatus =
  | "pending"
  | "approved"
  | "paid"
  | "refunded"
  | "expired";
