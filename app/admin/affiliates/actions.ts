/**
 * Admin server actions — affiliate program.
 *
 * Defense in depth:
 *   1. Route-level `/admin/affiliates/page.tsx` redirects non-
 *      admins before render.
 *   2. Every action below re-asserts admin status. An attacker
 *      who knew the action's exported symbol name could still
 *      POST to it; assertAdmin() closes that gap.
 *   3. Inputs are explicitly validated — coerced to expected
 *      types, range-checked, never spread/Object.assign'd into
 *      DB writes (mass-assignment guard).
 *   4. Multi-row mutations (payouts) go through SECURITY
 *      DEFINER RPCs that take FOR UPDATE locks so concurrent
 *      webhook commits don't race.
 *   5. Audit trail: approver / payer user_id is stamped on the
 *      affected rows so every financial change is attributable.
 *   6. UUID + handle inputs are regex-checked BEFORE the DB
 *      sees them — bogus values short-circuit with a friendly
 *      error rather than triggering a DB constraint trip.
 */

"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  HANDLE_REGEX,
  COMMISSION_RATE_DEFAULT,
} from "@/lib/affiliate/config";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendAffiliateApprovedEmail } from "@/lib/resend/emails";

interface ActionResult {
  error: string | null;
}

/** UUID v4 string (the only kind Postgres `gen_random_uuid()`
 *  emits). Rejects anything else BEFORE the admin client sees
 *  the value — saves a round-trip on most fat-fingered ids and
 *  blocks attackers from injecting non-UUID payloads. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PAYOUT_METHODS = new Set([
  "paypal",
  "wise",
  "stripe_connect",
  "bank",
  "other",
]);

const AUDIENCE_PLATFORMS = new Set([
  "instagram",
  "youtube",
  "twitter",
  "tiktok",
  "mixed",
]);

/** Bounce non-admin callers + return the admin's verified user
 *  id (needed by RPCs that stamp audit fields). The user object
 *  comes from supabase.auth.getUser(), which round-trips Supabase
 *  to verify the session — getSession() reads the cookie blindly
 *  and would let a forged session through. */
async function assertAdmin(): Promise<
  | { error: string; userId: null }
  | { error: null; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { error: "Not authorised.", userId: null };
  }
  return { error: null, userId: user.id };
}

/* ============================================================
   Status transitions — approve / reject / suspend / reactivate
   All four routes go through the same admin_set_affiliate_status
   RPC, which validates the FROM state so a stale UI can't
   accidentally rehabilitate a rejected affiliate.
   ============================================================ */

async function transitionAffiliateStatus(
  affiliateId: string,
  newStatus: "active" | "suspended" | "rejected",
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard.error) return { error: guard.error };

  if (!UUID_REGEX.test(affiliateId)) {
    return { error: "Invalid affiliate id." };
  }

  const admin = getAdminSupabase();
  // The generated database.types.ts doesn't yet know about this
  // RPC (it ships ahead of the next type regen), so we cast the
  // args. The SECURITY DEFINER function validates the payload
  // server-side regardless of any TS escape hatch.
  const { error } = await admin.rpc(
    "admin_set_affiliate_status" as never,
    {
      p_affiliate_id: affiliateId,
      p_new_status: newStatus,
      p_admin_user_id: guard.userId,
    } as never,
  );
  if (error) {
    // PostgREST surfaces the RPC's RAISE EXCEPTION message
    // verbatim — sanitise so we don't leak internals.
    if (/Illegal status transition/.test(error.message)) {
      return {
        error:
          "Cannot apply that status from the affiliate's current state.",
      };
    }
    return { error: "Unable to update affiliate status." };
  }

  revalidatePath("/admin/affiliates");
  revalidatePath("/admin");
  return { error: null };
}

export async function approveAffiliateAction(
  affiliateId: string,
): Promise<ActionResult> {
  const result = await transitionAffiliateStatus(affiliateId, "active");
  if (result.error) return result;

  // Best-effort approval email. Failure does NOT roll back the
  // status change — the admin already approved, and Theo can
  // re-send manually if Resend goes down. The send error is
  // logged for follow-up.
  try {
    const admin = getAdminSupabase();
    const { data: row } = await admin
      .from("affiliates")
      .select("email, display_name, handle, commission_rate")
      .eq("id", affiliateId)
      .maybeSingle<{
        email: string;
        display_name: string | null;
        handle: string;
        commission_rate: number | string | null;
      }>();
    if (row?.email && row.handle) {
      const rate =
        row.commission_rate == null
          ? COMMISSION_RATE_DEFAULT
          : Number(row.commission_rate) || COMMISSION_RATE_DEFAULT;
      const sendResult = await sendAffiliateApprovedEmail({
        affiliateEmail: row.email,
        displayName: row.display_name || row.handle,
        handle: row.handle,
        commissionRate: rate,
      });
      if (!sendResult.ok) {
        console.warn(
          "[admin/affiliates] approval email failed",
          sendResult.error,
        );
      }
    }
  } catch (e) {
    console.warn("[admin/affiliates] approval email threw", e);
  }

  return result;
}

export async function rejectAffiliateAction(
  affiliateId: string,
): Promise<ActionResult> {
  return transitionAffiliateStatus(affiliateId, "rejected");
}

export async function suspendAffiliateAction(
  affiliateId: string,
): Promise<ActionResult> {
  return transitionAffiliateStatus(affiliateId, "suspended");
}

export async function reactivateAffiliateAction(
  affiliateId: string,
): Promise<ActionResult> {
  return transitionAffiliateStatus(affiliateId, "active");
}

/* ============================================================
   Create from admin — fast-track an affiliate without making
   them fill the public landing form. Used when Theo DMs a
   producer and wants them shipping a link in the next minute.
   ============================================================ */

export interface CreateAffiliatePayload {
  handle: string;
  email: string;
  displayName?: string;
  commissionRate?: number; // 0..1
  payoutMethod?: string;
  payoutEmail?: string;
  audiencePlatform?: string;
  audienceSize?: number;
}

export async function createAffiliateFromAdminAction(
  payload: CreateAffiliatePayload,
): Promise<ActionResult & { affiliateId?: string }> {
  const guard = await assertAdmin();
  if (guard.error) return { error: guard.error };

  // Validate every field explicitly. No spread, no Object.assign.
  const handle = String(payload.handle ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const displayName = payload.displayName?.trim() || null;

  if (!HANDLE_REGEX.test(handle)) {
    return {
      error:
        "Handle must be 2–32 chars of letters, digits, dashes or underscores.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address." };
  }
  if (displayName && displayName.length > 80) {
    return { error: "Display name max 80 characters." };
  }

  const commissionRate =
    typeof payload.commissionRate === "number" &&
    Number.isFinite(payload.commissionRate)
      ? payload.commissionRate
      : 0.3;
  if (commissionRate < 0 || commissionRate > 1) {
    return { error: "Commission rate must be between 0 and 1." };
  }

  const payoutMethod =
    payload.payoutMethod && PAYOUT_METHODS.has(payload.payoutMethod)
      ? payload.payoutMethod
      : "paypal";
  const payoutEmail = payload.payoutEmail?.trim() || null;
  if (payoutEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payoutEmail)) {
    return { error: "Invalid payout email." };
  }

  const audiencePlatform =
    payload.audiencePlatform && AUDIENCE_PLATFORMS.has(payload.audiencePlatform)
      ? payload.audiencePlatform
      : null;
  const audienceSize =
    typeof payload.audienceSize === "number" &&
    Number.isInteger(payload.audienceSize) &&
    payload.audienceSize >= 0 &&
    payload.audienceSize < 100_000_000
      ? payload.audienceSize
      : null;

  const admin = getAdminSupabase();

  // Pre-check uniqueness on lower(handle) so we can return a
  // friendly error instead of a Postgres UNIQUE violation.
  const { data: existing } = await admin
    .from("affiliates")
    .select("id")
    .ilike("handle", handle)
    .maybeSingle<{ id: string }>();
  if (existing?.id) {
    return { error: "That handle is already taken." };
  }

  const { data, error } = await admin
    .from("affiliates")
    .insert({
      handle,
      email,
      display_name: displayName,
      commission_rate: commissionRate,
      payout_method: payoutMethod,
      payout_email: payoutEmail,
      audience_platform: audiencePlatform,
      audience_size: audienceSize,
      status: "active",
      is_active: true,
      approved_at: new Date().toISOString(),
      approved_by_user_id: guard.userId,
    } as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return { error: "Unable to create affiliate." };

  revalidatePath("/admin/affiliates");
  return { error: null, affiliateId: data?.id };
}

/* ============================================================
   Adjust commission rate — per-affiliate override.
   ============================================================ */

export async function adjustCommissionRateAction(
  affiliateId: string,
  newRate: number,
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard.error) return { error: guard.error };

  if (!UUID_REGEX.test(affiliateId)) {
    return { error: "Invalid affiliate id." };
  }
  if (
    typeof newRate !== "number" ||
    !Number.isFinite(newRate) ||
    newRate < 0 ||
    newRate > 1
  ) {
    return { error: "Commission rate must be between 0 and 1." };
  }

  const admin = getAdminSupabase();
  const { error } = await admin
    .from("affiliates")
    .update({ commission_rate: newRate } as never)
    .eq("id", affiliateId);
  if (error) return { error: "Unable to update commission rate." };

  revalidatePath("/admin/affiliates");
  return { error: null };
}

/* ============================================================
   Record a manual payout — wraps the SECURITY DEFINER RPC
   which does insert + balance update + referral linking
   atomically under a FOR UPDATE lock.
   ============================================================ */

export interface RecordPayoutPayload {
  affiliateId: string;
  amountCents: number;
  method: string;
  externalReference?: string;
  notes?: string;
}

export async function recordAffiliatePayoutAction(
  payload: RecordPayoutPayload,
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard.error) return { error: guard.error };

  if (!UUID_REGEX.test(payload.affiliateId)) {
    return { error: "Invalid affiliate id." };
  }
  if (
    typeof payload.amountCents !== "number" ||
    !Number.isInteger(payload.amountCents) ||
    payload.amountCents <= 0 ||
    payload.amountCents > 1_000_000_00 // $1,000,000 sanity cap
  ) {
    return { error: "Amount must be a positive integer in cents (max $1M)." };
  }
  if (!PAYOUT_METHODS.has(payload.method)) {
    return {
      error: "Method must be paypal, wise, stripe_connect, bank, or other.",
    };
  }
  const externalReference = payload.externalReference?.trim() || null;
  if (externalReference && externalReference.length > 240) {
    return { error: "Reference too long (max 240 characters)." };
  }
  const notes = payload.notes?.trim() || null;
  if (notes && notes.length > 1024) {
    return { error: "Notes too long (max 1024 characters)." };
  }

  const admin = getAdminSupabase();
  // Cast: see comment on admin_set_affiliate_status above.
  // RPC validates amount > 0, method whitelist, balance limits.
  const { error } = await admin.rpc(
    "admin_record_affiliate_payout" as never,
    {
      p_affiliate_id: payload.affiliateId,
      p_amount_cents: payload.amountCents,
      p_method: payload.method,
      p_external_reference: externalReference,
      p_notes: notes,
      p_admin_user_id: guard.userId,
    } as never,
  );
  if (error) {
    // The RPC surfaces friendly business messages via RAISE
    // EXCEPTION (e.g. "Amount $X exceeds unpaid balance $Y").
    // Echo them through but only the message (not the full
    // Postgres details object).
    return { error: error.message || "Unable to record payout." };
  }

  revalidatePath("/admin/affiliates");
  return { error: null };
}
