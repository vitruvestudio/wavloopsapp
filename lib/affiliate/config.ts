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
 *  towards an affiliate's commission. The 12-month cap is the
 *  industry standard — pays the affiliate for the full first year
 *  while limiting our long-term LTV exposure (a Pro customer who
 *  stays 5 years no longer pays the affiliate after year 1). */
export const COMMISSION_RECURRING_MONTHS = 12;

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
