/**
 * /admin/affiliates — affiliate program control surface.
 *
 * Surfaces three datasets:
 *   1. KPI strip — total affiliates, pending applications,
 *      total earned (sum of all approved+paid commissions),
 *      total unpaid balance owed to affiliates.
 *   2. Affiliates table grouped by status (pending, active,
 *      suspended/rejected).
 *   3. Recent payouts log.
 *
 * Auth: gated to `isAdminEmail` — non-admins bounce to /.
 * The proxy already redirects anonymous visitors at /admin/*
 * level, but we double-check here in case anyone bypasses the
 * proxy (e.g. local dev with proxy off).
 *
 * Data fetching is done through the service-role admin client
 * so we read across every affiliate regardless of RLS. The
 * dynamic = "force-dynamic" directive keeps this off the build
 * cache: the page reflects the current state of the DB on every
 * admin visit.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { AffiliatesAdminPage } from "./AffiliatesAdminPage";

export const dynamic = "force-dynamic";

export interface AffiliateRow {
  id: string;
  handle: string;
  email: string;
  display_name: string | null;
  status: "pending" | "active" | "suspended" | "rejected";
  commission_rate: number;
  payout_method: string;
  payout_email: string | null;
  total_earned_cents: number;
  total_paid_cents: number;
  unpaid_balance_cents: number;
  audience_platform: string | null;
  audience_size: number | null;
  application_note: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface PayoutRow {
  id: string;
  affiliate_id: string;
  affiliate_handle: string;
  amount_cents: number;
  method: string;
  external_reference: string | null;
  paid_at: string;
}

export interface AffiliateKpis {
  totalAffiliates: number;
  pendingApplications: number;
  activeAffiliates: number;
  totalEarnedCents: number;
  totalPaidCents: number;
  totalUnpaidCents: number;
}

export default async function AffiliatesAdminRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin/affiliates");
  if (!isAdminEmail(user.email)) redirect("/");

  const admin = getAdminSupabase();

  const [affiliates, payouts, kpis] = await Promise.all([
    fetchAffiliates(admin),
    fetchRecentPayouts(admin),
    fetchKpis(admin),
  ]);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-0)",
        padding: "32px 24px 96px",
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1120, display: "flex", flexDirection: "column", gap: 36 }}
      >
        <header
          className="flex items-center justify-between flex-wrap"
          style={{ gap: 12 }}
        >
          <div>
            <Link
              href="/admin"
              className="t-mono"
              style={{
                color: "var(--fg-3)",
                textDecoration: "none",
                letterSpacing: "0.12em",
              }}
            >
              ← ADMIN
            </Link>
            <h1
              className="t-display"
              style={{
                marginTop: 8,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--fg-1)",
              }}
            >
              Affiliates
            </h1>
            <p
              style={{
                marginTop: 4,
                color: "var(--fg-3)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
            >
              Approve applications, create affiliates by hand, record payouts.
            </p>
          </div>
        </header>
        <AffiliatesAdminPage
          kpis={kpis}
          affiliates={affiliates}
          payouts={payouts}
        />
      </div>
    </main>
  );
}

/* ============================================================
   Data fetchers — service-role bypass RLS so we see every row.
   ============================================================ */

async function fetchAffiliates(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<AffiliateRow[]> {
  const { data, error } = await admin
    .from("affiliates")
    .select(
      "id, handle, email, display_name, status, commission_rate, payout_method, payout_email, total_earned_cents, total_paid_cents, unpaid_balance_cents, audience_platform, audience_size, application_note, approved_at, created_at",
    )
    .order("created_at", { ascending: false })
    .returns<AffiliateRow[]>();
  if (error) {
    console.warn("[admin/affiliates] fetchAffiliates failed", error.message);
    return [];
  }
  return data ?? [];
}

async function fetchRecentPayouts(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<PayoutRow[]> {
  // Join the affiliate handle in so the table reads without a
  // second client-side lookup. Cap to the last 50 so the page
  // doesn't drown if we ever ship hundreds of payouts.
  const { data, error } = await admin
    .from("affiliate_payouts")
    .select(
      "id, affiliate_id, amount_cents, method, external_reference, paid_at, affiliate:affiliates(handle)",
    )
    .order("paid_at", { ascending: false })
    .limit(50);
  if (error) {
    console.warn("[admin/affiliates] fetchRecentPayouts failed", error.message);
    return [];
  }
  type RawPayout = {
    id: string;
    affiliate_id: string;
    amount_cents: number;
    method: string;
    external_reference: string | null;
    paid_at: string;
    affiliate: { handle: string } | { handle: string }[] | null;
  };
  return ((data as RawPayout[] | null) ?? []).map((r) => ({
    id: r.id,
    affiliate_id: r.affiliate_id,
    affiliate_handle: Array.isArray(r.affiliate)
      ? (r.affiliate[0]?.handle ?? "—")
      : (r.affiliate?.handle ?? "—"),
    amount_cents: r.amount_cents,
    method: r.method,
    external_reference: r.external_reference,
    paid_at: r.paid_at,
  }));
}

async function fetchKpis(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<AffiliateKpis> {
  // We pull aggregates from the affiliates rows themselves — those
  // totals are already maintained by the webhook + payout RPCs, so
  // they're up-to-date by construction.
  const { data, error } = await admin
    .from("affiliates")
    .select(
      "status, total_earned_cents, total_paid_cents, unpaid_balance_cents",
    )
    .returns<
      {
        status: string;
        total_earned_cents: number;
        total_paid_cents: number;
        unpaid_balance_cents: number;
      }[]
    >();
  if (error || !data) {
    return {
      totalAffiliates: 0,
      pendingApplications: 0,
      activeAffiliates: 0,
      totalEarnedCents: 0,
      totalPaidCents: 0,
      totalUnpaidCents: 0,
    };
  }
  let pending = 0;
  let active = 0;
  let earned = 0;
  let paid = 0;
  let unpaid = 0;
  for (const r of data) {
    if (r.status === "pending") pending++;
    if (r.status === "active") active++;
    earned += r.total_earned_cents;
    paid += r.total_paid_cents;
    unpaid += r.unpaid_balance_cents;
  }
  return {
    totalAffiliates: data.length,
    pendingApplications: pending,
    activeAffiliates: active,
    totalEarnedCents: earned,
    totalPaidCents: paid,
    totalUnpaidCents: unpaid,
  };
}
