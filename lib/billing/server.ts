/**
 * Billing — server-side plan + usage resolvers.
 *
 * Every server component / server action that needs to know the
 * current user's plan or whether they're hitting a quota MUST go
 * through these helpers. They:
 *   - cache per request via React.cache(), so multiple call sites
 *     in the same render don't re-hit the DB;
 *   - default sanely (free, zero usage) when there's no session;
 *   - return a fully resolved PlanContext that bundles plan +
 *     quotas + usage in one shot — the shape the gating UI needs.
 *
 * The plan itself comes from public.get_user_plan() (migration
 * #37), which is the single source of truth for the resolution
 * order: active Pro > Lifetime > free. App code never inspects
 * `subscriptions` columns directly.
 */

import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PLAN_QUOTAS, type PlanKey, type PlanQuotas } from "./plans";

/* ============================================================
   Plan resolution
   ============================================================ */

/** Resolve the current user's billing plan via get_user_plan().
 *  Cached per render. Returns 'free' if not signed in or anything
 *  fails — never throws (gating must keep working even if the DB
 *  blips). */
/** Closed set of plan strings we recognize. Anything the RPC
 *  hands back that isn't one of these → fall through to 'free'
 *  rather than `as PlanKey`-cast our way to undefined behavior
 *  downstream. Adding a new tier means touching THIS set on top
 *  of plans.ts. */
const KNOWN_PLAN_KEYS: ReadonlySet<string> = new Set<PlanKey>([
  "free",
  "lifetime",
  "pro",
]);

export const getCurrentUserPlan = cache(async (): Promise<PlanKey> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "free";
    const { data, error } = await supabase.rpc("get_user_plan", {
      p_user_id: user.id,
    });
    if (error) {
      console.warn("[billing] get_user_plan failed", error);
      return "free";
    }
    // Validate the RPC response against the closed plan set so a
    // future DB row with `plan='enterprise'` (or any typo) can't
    // get cast to PlanKey and crash `PLAN_QUOTAS[plan]` downstream.
    // Default-deny to 'free' — gating must err safe, not fail open.
    if (typeof data === "string" && KNOWN_PLAN_KEYS.has(data)) {
      return data as PlanKey;
    }
    return "free";
  } catch (e) {
    console.warn("[billing] getCurrentUserPlan threw", e);
    return "free";
  }
});

/* ============================================================
   Usage snapshot
   ============================================================ */

/** Live counts of the resources the producer surface caps. The
 *  `listensThisMonth` field is wired in Phase 4 once the
 *  matching SQL count function lands — for now it stays 0 so the
 *  type is stable and Phase 4 doesn't break the call sites. */
export interface QuotaUsage {
  servers: number;
  beats: number;
  artists: number;
  listensThisMonth: number;
}

/** Snapshot the current producer's resource usage. Returns null
 *  when there's no signed-in user (the caller should treat the
 *  absence as "no usage" and route via the auth flow). */
export const getCurrentUserQuotaUsage = cache(
  async (): Promise<QuotaUsage | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Resolve the producer profile id. Artists without a profile
    // row still get a zeroed snapshot — they can't upload beats,
    // so all counts are 0 anyway.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();
    if (!profile) {
      return { servers: 0, beats: 0, artists: 0, listensThisMonth: 0 };
    }

    // Run the 3 producer-scoped counts in parallel. head + count
    // means we never ship row payloads on the wire — just the
    // count integers. Listens-this-month is wired in Phase 4.
    const [serversRes, beatsRes, contactsRes] = await Promise.all([
      supabase
        .from("servers")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile.id),
      supabase
        .from("beats")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile.id),
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile.id),
    ]);

    return {
      servers: serversRes.count ?? 0,
      beats: beatsRes.count ?? 0,
      artists: contactsRes.count ?? 0,
      listensThisMonth: 0,
    };
  },
);

/* ============================================================
   Resolved context — what gating UI consumes
   ============================================================ */

export interface PlanContext {
  plan: PlanKey;
  quotas: PlanQuotas;
  usage: QuotaUsage;
}

/** Convenience: one cached call returns plan + quotas + usage.
 *  Falls back to free + zero-usage when there's no session. */
export const getCurrentPlanContext = cache(
  async (): Promise<PlanContext> => {
    const [plan, usage] = await Promise.all([
      getCurrentUserPlan(),
      getCurrentUserQuotaUsage(),
    ]);
    return {
      plan,
      // Defense in depth — getCurrentUserPlan() already constrains
      // `plan` to PlanKey, but if the union ever grows ahead of
      // PLAN_QUOTAS being updated, this `?? .free` keeps gating
      // safe (fail closed) instead of crashing the whole UI.
      quotas: PLAN_QUOTAS[plan] ?? PLAN_QUOTAS.free,
      usage: usage ?? {
        servers: 0,
        beats: 0,
        artists: 0,
        listensThisMonth: 0,
      },
    };
  },
);
