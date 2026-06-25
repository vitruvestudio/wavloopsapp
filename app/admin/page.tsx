/**
 * /admin — founder control surface (V1).
 *
 * Three sections, 80/20 priority:
 *   1. KPI strip — total users, paying users, MRR estimate,
 *      new signups last 7 days.
 *   2. Users table — search by email + click to override plan.
 *   3. Landing banner — singleton row that controls a sitewide
 *      promo banner above the hero.
 *
 * Auth: gated to the email allow-list in lib/auth/admin.ts.
 * Anyone else who lands here gets bounced to /.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { AdminUsersTable, type AdminUserRow } from "./UsersTable";
import { AdminBannerForm } from "./BannerForm";

export const dynamic = "force-dynamic";

interface KpiData {
  totalUsers: number;
  freeUsers: number;
  lifetimeUsers: number;
  proUsers: number;
  newLast7Days: number;
  mrrEstimateEur: number;
}

interface BannerData {
  is_active: boolean;
  message: string;
  cta_label: string | null;
  cta_href: string | null;
  variant: "info" | "promo" | "warning";
}

export default async function AdminPage() {
  // ── Auth + admin gate ───────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/");

  // ── Fetch everything through the admin client (bypasses
  //    RLS so we can count all users / read every plan). ───
  const admin = getAdminSupabase();

  const [kpis, users, banner] = await Promise.all([
    fetchKpis(admin),
    fetchUsers(admin),
    fetchBanner(admin),
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
        <Header email={user.email ?? ""} />
        <KpiStrip kpis={kpis} />
        <Section title="Users" sub={`${users.length} total · click a row to override plan`}>
          <AdminUsersTable users={users} />
        </Section>
        <Section title="Landing banner" sub="Singleton row read by the public landing on every render">
          <AdminBannerForm initial={banner} />
        </Section>
      </div>
    </main>
  );
}

/* ============================================================
   Header
   ============================================================ */

function Header({ email }: { email: string }) {
  return (
    <header className="flex items-end justify-between flex-wrap" style={{ gap: 16 }}>
      <div className="flex flex-col">
        <span className="t-mono" style={{ color: "var(--accent-text)", marginBottom: 8 }}>
          Admin · V1
        </span>
        <h1 className="t-display" style={{ fontSize: 36, lineHeight: 1.05 }}>
          Founder cockpit.
        </h1>
      </div>
      <div className="flex items-center" style={{ gap: 14 }}>
        <Link
          href="/admin/affiliates"
          className="t-mono"
          style={{
            padding: "8px 14px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent-surface)",
            border: "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
            color: "var(--accent-text)",
            textDecoration: "none",
            letterSpacing: "0.08em",
            fontSize: 11,
          }}
        >
          AFFILIATES →
        </Link>
        <span className="t-mono" style={{ color: "var(--fg-4)" }}>
          Signed in as {email}
        </span>
      </div>
    </header>
  );
}

/* ============================================================
   KPI strip
   ============================================================ */

function KpiStrip({ kpis }: { kpis: KpiData }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
      }}
    >
      <KpiCard
        label="Total users"
        value={kpis.totalUsers.toLocaleString("en-US")}
        sub={`${kpis.freeUsers} free · ${kpis.lifetimeUsers + kpis.proUsers} paid`}
      />
      <KpiCard
        label="Paying users"
        value={(kpis.lifetimeUsers + kpis.proUsers).toLocaleString("en-US")}
        sub={`${kpis.lifetimeUsers} lifetime · ${kpis.proUsers} pro`}
        highlight
      />
      <KpiCard
        label="MRR (est.)"
        // Field name retained for backwards compat with existing
        // metric collectors; the numeric value now reflects USD
        // since the underlying Stripe prices flipped to USD as of
        // 2026-06-24. Rename to `mrrEstimateUsd` whenever we get
        // around to migrating the rest of the call sites.
        value={`$${kpis.mrrEstimateEur.toLocaleString("en-US")}`}
        sub="pro monthly + pro yearly amortised"
      />
      <KpiCard
        label="New, last 7d"
        value={kpis.newLast7Days.toLocaleString("en-US")}
        sub="auth.users created_at"
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight
          ? "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)"
          : "var(--bg-1)",
        border: highlight
          ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
          : "1px solid var(--border-1)",
        borderRadius: "var(--r-lg)",
        padding: "16px 18px",
        boxShadow: highlight
          ? "0 0 30px -10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div className="t-mono" style={{ color: "var(--fg-4)", marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 30,
          lineHeight: 1,
          letterSpacing: "-0.015em",
          color: highlight ? "var(--accent-text)" : "var(--fg-1)",
          textShadow: highlight ? "0 0 18px var(--accent-glow)" : "none",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div className="t-mono-s" style={{ color: "var(--fg-4)", marginTop: 10 }}>
        {sub}
      </div>
    </div>
  );
}

/* ============================================================
   Section wrapper
   ============================================================ */

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col" style={{ gap: 16 }}>
      <div className="flex flex-col" style={{ gap: 4 }}>
        <h2 className="t-h2" style={{ fontSize: 22, letterSpacing: "-0.012em" }}>
          {title}
        </h2>
        {sub && (
          <span className="t-mono" style={{ color: "var(--fg-4)" }}>
            {sub}
          </span>
        )}
      </div>
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-lg)",
          padding: 0,
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   Server data fetchers
   ============================================================ */

async function fetchKpis(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<KpiData> {
  // Subscriptions snapshot (all rows). Anyone without a sub row
  // is implicitly Free, so we count them separately from
  // auth.users.
  const { data: subs } = await admin
    .from("subscriptions")
    .select("plan, status")
    .returns<Array<{ plan: string; status: string }>>();

  let lifetime = 0;
  let pro = 0;
  for (const s of subs ?? []) {
    if (s.plan === "lifetime") lifetime++;
    else if (s.plan === "pro" && ["active", "trialing", "past_due"].includes(s.status)) {
      pro++;
    }
  }

  // Total auth.users via the auth admin API (Supabase doesn't
  // expose auth.users via PostgREST, so we use admin.listUsers).
  const { data: authData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const allUsers = authData?.users ?? [];
  const totalUsers = allUsers.length;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newLast7Days = allUsers.filter(
    (u) => new Date(u.created_at).getTime() >= sevenDaysAgo,
  ).length;

  // MRR estimate: pro monthly + pro yearly amortised. We don't
  // know each user's billing cycle without hitting Stripe, so
  // we apply the conservative assumption: 70 % of pros are
  // yearly (matches Wavloops's pricing nudge), 30 % monthly.
  const mrrEstimateEur = Math.round(
    pro * (0.3 * 12 + 0.7 * (99 / 12)),
  );

  const freeUsers = Math.max(0, totalUsers - lifetime - pro);

  return {
    totalUsers,
    freeUsers,
    lifetimeUsers: lifetime,
    proUsers: pro,
    newLast7Days,
    mrrEstimateEur,
  };
}

async function fetchUsers(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<AdminUserRow[]> {
  // Two-step: pull every auth.users entry, then join the
  // matching subscriptions row in memory. Keeps the result
  // small enough for a single-page admin without pagination.
  const [authData, subsRes, profilesRes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin
      .from("subscriptions")
      .select("user_id, plan, status")
      .returns<
        Array<{ user_id: string; plan: string; status: string }>
      >(),
    admin
      .from("profiles")
      .select("user_id, handle, name")
      .returns<
        Array<{ user_id: string; handle: string | null; name: string | null }>
      >(),
  ]);

  const subByUser = new Map(
    (subsRes.data ?? []).map((s) => [s.user_id, s]),
  );
  const profByUser = new Map(
    (profilesRes.data ?? []).map((p) => [p.user_id, p]),
  );

  const rows: AdminUserRow[] = (authData.data?.users ?? []).map((u) => {
    const sub = subByUser.get(u.id);
    const prof = profByUser.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "—",
      handle: prof?.handle ?? null,
      name: prof?.name ?? null,
      plan: (sub?.plan ?? "free") as "free" | "lifetime" | "pro",
      status: sub?.status ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    };
  });

  rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return rows;
}

async function fetchBanner(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<BannerData> {
  const { data } = await admin
    .from("landing_banner")
    .select("is_active, message, cta_label, cta_href, variant")
    .eq("id", true)
    .maybeSingle<BannerData>();
  return (
    data ?? {
      is_active: false,
      message: "",
      cta_label: null,
      cta_href: null,
      variant: "info",
    }
  );
}
