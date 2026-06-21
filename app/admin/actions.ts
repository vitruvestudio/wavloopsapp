/**
 * Admin server actions.
 *
 * Every action re-asserts the caller's admin status before
 * touching the DB — the route-level redirect at /admin only
 * protects the surface; an attacker who knew the action's
 * symbol name could still POST to it. assertAdmin() closes
 * that gap.
 *
 * Writes go through the service-role client (getAdminSupabase)
 * so quota triggers, RLS policies and grant restrictions don't
 * stand in the way of legitimate admin operations.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import type { PlanKey } from "@/lib/billing/plans";

interface ActionResult {
  error: string | null;
}

/** Bounce non-admin callers before any DB work. */
async function assertAdmin(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return { error: "Not authorised." };
  }
  return { error: null };
}

/* ============================================================
   Plan override — set any user's plan to free / lifetime /
   pro. Pro flips current_period_end to 2099-12-31 so the row
   resolves to 'pro' indefinitely via get_user_plan().
   ============================================================ */

export async function adminOverrideUserPlanAction(
  targetUserId: string,
  newPlan: PlanKey,
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard.error) return guard;

  const admin = getAdminSupabase();

  // Build the patch by plan. Lifetime sets lifetime_purchased_at;
  // Pro sets a far-future period_end; Free clears both.
  const patch =
    newPlan === "free"
      ? {
          plan: "free",
          status: "inactive",
          lifetime_purchased_at: null,
          current_period_end: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        }
      : newPlan === "lifetime"
        ? {
            plan: "lifetime",
            status: "active",
            lifetime_purchased_at: new Date().toISOString(),
            current_period_end: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          }
        : {
            plan: "pro",
            status: "active",
            current_period_end: "2099-12-31T23:59:59.000Z",
            lifetime_purchased_at: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          };

  // Upsert keeps the action idempotent — works whether the
  // row already exists or this is the first time we touch
  // this user. unique constraint is on user_id.
  const { error } = await admin
    .from("subscriptions")
    .upsert(
      { user_id: targetUserId, ...patch } as never,
      { onConflict: "user_id" },
    );
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

/* ============================================================
   Landing banner — update the singleton row.
   ============================================================ */

export interface BannerPayload {
  is_active: boolean;
  message: string;
  cta_label: string | null;
  cta_href: string | null;
  variant: "info" | "promo" | "warning";
}

export async function adminUpdateBannerAction(
  payload: BannerPayload,
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard.error) return guard;

  const admin = getAdminSupabase();

  // Defensive normalisation — empty strings become NULL for the
  // optional CTA columns. The check constraint on `variant` is
  // enforced at the DB level; we just trust it here.
  const clean = {
    is_active: payload.is_active,
    message: payload.message.trim(),
    cta_label: payload.cta_label?.trim() || null,
    cta_href: payload.cta_href?.trim() || null,
    variant: payload.variant,
  };

  const { error } = await admin
    .from("landing_banner")
    .update(clean as never)
    .eq("id", true);
  if (error) return { error: error.message };

  // Revalidate the landing so the banner change is live on the
  // next visit. revalidatePath('/', 'page') would only catch the
  // root; 'layout' propagates to every nested page that reads
  // landing_banner.
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { error: null };
}
