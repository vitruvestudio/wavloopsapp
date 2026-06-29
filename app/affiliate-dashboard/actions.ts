/**
 * Affiliate-side actions.
 *
 * Only one action right now: updateAffiliatePayoutSettings, which
 * lets a logged-in affiliate edit their payout method + payout
 * email from their dashboard. The financial side (commission rate,
 * balance, status) stays admin-only.
 *
 * Auth model:
 *   - Caller must be authenticated.
 *   - The action looks up an `affiliates` row owned by the caller,
 *     either via affiliates.user_id = auth.uid() OR via
 *     affiliates.email = auth.users.email (the same fallback the
 *     dashboard page uses on first visit).
 *   - No affiliate row → "not_an_affiliate" error. No data leaks.
 *
 * Inputs are explicitly validated server-side. The affiliate can
 * only touch their OWN row's payout_method + payout_email + the
 * read-only display_name; every other column is untouchable from
 * the dashboard.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

interface ActionResult {
  ok: boolean;
  error: string | null;
}

// Stripe Connect is intentionally absent from the dashboard
// dropdown until we ship the auto-payout flow (Sprint 3). The
// backend still accepts the legacy value so existing rows that
// pre-date this change keep validating — we just stop offering
// it as a new choice.
const ALLOWED_PAYOUT_METHODS = new Set([
  "paypal",
  "wise",
  "bank",
  "other",
  "stripe_connect",
]);

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function updateAffiliatePayoutSettingsAction(
  formData: FormData,
): Promise<ActionResult> {
  // 1. Auth.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in." };
  }

  // 2. Locate the affiliate row that belongs to this user.
  const admin = getAdminSupabase();
  const userEmail = (user.email ?? "").toLowerCase();

  let affiliateId: string | null = null;
  {
    const { data: byUid } = await admin
      .from("affiliates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();
    if (byUid?.id) affiliateId = byUid.id;
  }
  if (!affiliateId && userEmail) {
    const { data: byEmail } = await admin
      .from("affiliates")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle<{ id: string }>();
    if (byEmail?.id) affiliateId = byEmail.id;
  }
  if (!affiliateId) {
    return { ok: false, error: "No affiliate account found." };
  }

  // 3. Validate the payload. Pull each field by name (no spread,
  //    no Object.assign — mass-assignment guard).
  const payoutMethod = String(formData.get("payout_method") ?? "")
    .trim()
    .toLowerCase();
  const payoutEmail = String(formData.get("payout_email") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!ALLOWED_PAYOUT_METHODS.has(payoutMethod)) {
    return { ok: false, error: "Pick a valid payout method." };
  }
  if (payoutEmail && !EMAIL_REGEX.test(payoutEmail)) {
    return { ok: false, error: "Payout email looks invalid." };
  }
  if (displayName.length > 80) {
    return { ok: false, error: "Display name max 80 chars." };
  }

  // 4. Update. Only the three columns the dashboard owns.
  const { error: updErr } = await admin
    .from("affiliates" as never)
    .update({
      payout_method: payoutMethod,
      payout_email: payoutEmail || null,
      display_name: displayName || null,
    } as never)
    .eq("id", affiliateId);
  if (updErr) {
    console.warn(
      "[affiliate-dashboard] payout settings update failed",
      updErr.message,
    );
    return {
      ok: false,
      error: "Couldn't save right now. Try again in a moment.",
    };
  }

  revalidatePath("/affiliate-dashboard");
  revalidatePath("/admin/affiliates");
  return { ok: true, error: null };
}
