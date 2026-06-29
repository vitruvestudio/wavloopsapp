/**
 * Server action: submit an affiliate application.
 *
 * Inserts a row into `affiliates` with status='pending' so the
 * founder can review it on /admin/affiliates. Anti-abuse guard
 * rails:
 *   1. Re-checks the AFFILIATE_INVITE_CODE before touching the DB
 *      — a curl call straight at the action shouldn't bypass the
 *      page-level gate.
 *   2. Normalises and validates every field server-side. Mass-
 *      assignment guard: we build the insert payload from
 *      explicit fields, never from the raw FormData.
 *   3. Rejects duplicates by handle OR email at the action layer
 *      with a friendly error before the DB constraint fires.
 *   4. Inserts via the admin client because affiliates RLS only
 *      permits very narrow self-inserts; the application form is
 *      a public-facing surface that's allowed to mint pending
 *      rows on behalf of any email.
 */

"use server";

import { revalidatePath } from "next/cache";
import { HANDLE_REGEX } from "@/lib/affiliate/config";
import { getAdminSupabase } from "@/lib/supabase/admin";

interface SubmitResult {
  ok: boolean;
  error: string | null;
}

const ALLOWED_PAYOUT_METHODS = new Set([
  "paypal",
  "wise",
  "stripe_connect",
  "bank",
  "other",
]);

const ALLOWED_AUDIENCE_PLATFORMS = new Set([
  "instagram",
  "youtube",
  "twitter",
  "tiktok",
  "mixed",
]);

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function submitAffiliateApplicationAction(
  inviteCode: string,
  formData: FormData,
): Promise<SubmitResult> {
  // 1. Gate — same env check the page-level guard uses. If the
  // env is missing entirely we reject everything (failsafe).
  const expected = process.env.AFFILIATE_INVITE_CODE ?? "";
  if (!expected || inviteCode !== expected) {
    return {
      ok: false,
      error: "This application is currently invitation-only.",
    };
  }

  // 2. Pull + normalise fields. Trim and lowercase where it
  // matters; reject obvious bad input early.
  const handle = String(formData.get("handle") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const payoutMethod = String(formData.get("payout_method") ?? "")
    .trim()
    .toLowerCase();
  const payoutEmail = String(formData.get("payout_email") ?? "")
    .trim()
    .toLowerCase();
  const audiencePlatformRaw = String(
    formData.get("audience_platform") ?? "",
  )
    .trim()
    .toLowerCase();
  const audienceSizeRaw = String(
    formData.get("audience_size") ?? "",
  ).trim();
  const applicationNote = String(
    formData.get("application_note") ?? "",
  ).trim();

  if (!HANDLE_REGEX.test(handle)) {
    return {
      ok: false,
      error: "Handle must be 2-32 chars: letters, digits, dashes only.",
    };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }
  if (!displayName) {
    return { ok: false, error: "Please tell us your name." };
  }
  if (!ALLOWED_PAYOUT_METHODS.has(payoutMethod)) {
    return { ok: false, error: "Pick a valid payout method." };
  }
  if (payoutEmail && !EMAIL_REGEX.test(payoutEmail)) {
    return { ok: false, error: "Payout email looks invalid." };
  }
  const audiencePlatform = audiencePlatformRaw
    ? ALLOWED_AUDIENCE_PLATFORMS.has(audiencePlatformRaw)
      ? audiencePlatformRaw
      : null
    : null;
  const audienceSize = audienceSizeRaw
    ? Number.parseInt(audienceSizeRaw.replace(/[^\d]/g, ""), 10) || null
    : null;
  if (applicationNote.length > 2000) {
    return {
      ok: false,
      error: "Note is too long — keep it under 2 000 chars.",
    };
  }

  // 3. Duplicate-check by handle OR email. The DB has unique
  // indexes on both, but a friendly error before the DB error
  // makes the form a kinder UX.
  const admin = getAdminSupabase();
  const { data: clash } = await admin
    .from("affiliates")
    .select("id, handle, email")
    .or(`handle.eq.${handle},email.eq.${email}`)
    .limit(1)
    .maybeSingle<{
      id: string;
      handle: string;
      email: string;
    }>();
  if (clash) {
    if (clash.handle === handle) {
      return {
        ok: false,
        error: `Handle "${handle}" is already taken — pick a different one.`,
      };
    }
    if (clash.email === email) {
      return {
        ok: false,
        error: "An application with this email already exists.",
      };
    }
  }

  // 4. Insert the row. Status defaults to 'pending' in the
  // schema. We cast through `as never` for the same reason the
  // rest of the affiliate code path does — Database types lag
  // the schema by one regen.
  const { error: insertErr } = await admin
    .from("affiliates" as never)
    .insert({
      handle,
      email,
      display_name: displayName,
      payout_method: payoutMethod,
      payout_email: payoutEmail || null,
      audience_platform: audiencePlatform,
      audience_size: audienceSize,
      application_note: applicationNote || null,
      status: "pending",
      is_active: true,
    } as never);
  if (insertErr) {
    console.warn(
      "[affiliates/apply] insert failed",
      insertErr.message,
    );
    return {
      ok: false,
      error:
        "Couldn't submit your application right now. Try again in a minute.",
    };
  }

  revalidatePath("/admin/affiliates");
  return { ok: true, error: null };
}
