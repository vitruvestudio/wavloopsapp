/**
 * /affiliate-dashboard — the affiliate's own cockpit.
 *
 * Surface the four things an affiliate actually needs:
 *   1. Their share link (with copy-to-clipboard button) — every
 *      other action depends on this.
 *   2. The earnings snapshot: total earned, unpaid balance, paid
 *      to date, plus a quick payout-threshold line so they know
 *      how close they are to a payout.
 *   3. Their referral list: who they brought in, what plan, what
 *      it earned, status (pending / approved / paid / refunded).
 *   4. Their payout history: when, how much, via which method.
 *
 * Lookup strategy:
 *   - Auth required. The proxy already gates /affiliate-dashboard
 *     for unauthed visitors → /auth?next=/affiliate-dashboard.
 *   - Match the affiliate row to the current user via either
 *     affiliates.user_id (when previously linked) OR affiliates.
 *     email = auth.users.email. The email-fallback covers the
 *     common case where the producer applied with an email then
 *     signed up later with the same one; we update user_id on
 *     first dashboard visit so subsequent loads use the faster
 *     PK lookup.
 *   - No affiliate row → friendly "not an affiliate" screen with
 *     a link to /affiliates so they can apply. No data leakage:
 *     we never confirm whether the email is on file.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { LandingHeader } from "@/components/landing/Header";
import { LandingFooter } from "@/components/landing/Footer";
import { MIN_PAYOUT_CENTS } from "@/lib/affiliate/config";
import { CopyLinkButton } from "./CopyLinkButton";
import { PayoutSettings } from "./PayoutSettings";

export const metadata = {
  title: "Affiliate dashboard — Wavloops",
  description:
    "Your affiliate share link, earnings, and referral activity.",
  robots: { index: false, follow: false },
};

interface AffiliateRow {
  id: string;
  user_id: string | null;
  handle: string;
  email: string;
  display_name: string | null;
  status: string;
  is_active: boolean;
  commission_rate: number | string;
  total_earned_cents: number;
  total_paid_cents: number;
  unpaid_balance_cents: number;
  payout_method: string | null;
  payout_email: string | null;
  approved_at: string | null;
}

interface ReferralRow {
  id: string;
  status: string;
  plan_key: string | null;
  commission_cents: number;
  gross_amount_cents: number;
  created_at: string;
  converted_at: string | null;
}

interface PayoutRow {
  id: string;
  amount_cents: number;
  method: string;
  external_reference: string | null;
  created_at: string;
}

export default async function AffiliateDashboardPage() {
  // ── Auth gate ───────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth?next=/affiliate-dashboard");
  }

  const admin = getAdminSupabase();

  // ── Find the affiliate row by user_id OR email ──────────
  const userEmail = (user.email ?? "").toLowerCase();
  let affiliate = await fetchAffiliate(admin, user.id, userEmail);

  // If we matched by email but user_id is unlinked, stamp it now
  // so subsequent loads skip the email lookup. Best-effort.
  if (affiliate && affiliate.user_id === null) {
    // Same `as never` pattern the rest of the affiliate code uses
    // until the hand-written Database types catch up with the
    // schema.
    await admin
      .from("affiliates" as never)
      .update({ user_id: user.id } as never)
      .eq("id", affiliate.id);
    affiliate = { ...affiliate, user_id: user.id };
  }

  if (!affiliate) return <NotAnAffiliateShell />;

  // ── Fetch referrals + payouts in parallel ────────────────
  const [referralsRes, payoutsRes] = await Promise.all([
    admin
      .from("affiliate_referrals")
      .select(
        "id, status, plan_key, commission_cents, gross_amount_cents, created_at, converted_at",
      )
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<ReferralRow[]>(),
    admin
      .from("affiliate_payouts")
      .select(
        "id, amount_cents, method, external_reference, created_at",
      )
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<PayoutRow[]>(),
  ]);

  const referrals = referralsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];

  return (
    <>
      <LandingHeader isAuthed={true} />
      <main
        style={{
          background: "var(--bg-0)",
          color: "var(--fg-1)",
          paddingBottom: 120,
        }}
      >
        <Header affiliate={affiliate} />
        <ShareLink handle={affiliate.handle} />
        <Earnings affiliate={affiliate} />
        <PayoutSettings
          initialMethod={affiliate.payout_method}
          initialEmail={affiliate.payout_email}
          initialDisplayName={affiliate.display_name}
        />
        <ReferralsSection rows={referrals} />
        <PayoutsSection rows={payouts} />
      </main>
      <LandingFooter />
    </>
  );
}

/* ============================================================
   Header
   ============================================================ */

function Header({ affiliate }: { affiliate: AffiliateRow }) {
  const rate = Number(affiliate.commission_rate) || 0;
  return (
    <section
      style={{
        padding: "80px 24px 24px",
        maxWidth: 1080,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span
        className="t-mono"
        style={{
          color: "var(--accent-text)",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        AFFILIATE DASHBOARD
      </span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(32px, 5vw, 48px)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        Hey @{affiliate.handle}.
      </h1>
      <p
        className="t-mono-s"
        style={{ color: "var(--fg-4)", margin: 0 }}
      >
        {affiliate.status === "active" ? (
          <>
            ACTIVE · {Math.round(rate * 100)}% COMMISSION · APPROVED{" "}
            {affiliate.approved_at
              ? new Date(affiliate.approved_at).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "short", day: "numeric" },
                )
              : "—"}
          </>
        ) : (
          <>STATUS: {affiliate.status.toUpperCase()}</>
        )}
      </p>
    </section>
  );
}

/* ============================================================
   Share link
   ============================================================ */

function ShareLink({ handle }: { handle: string }) {
  const link = `https://wavloops.co?ref=${encodeURIComponent(handle)}`;
  return (
    <section
      style={{
        padding: "12px 24px 24px",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          padding: 24,
          borderRadius: "var(--r-lg)",
          background: "var(--bg-1)",
          border:
            "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="t-mono"
          style={{
            color: "var(--fg-4)",
            fontSize: 11,
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          YOUR SHARE LINK · 60-DAY ATTRIBUTION
        </div>
        <div
          className="flex items-center"
          style={{ gap: 12, flexWrap: "wrap" }}
        >
          <code
            style={{
              flex: "1 1 280px",
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--bg-2)",
              border: "1px solid var(--border-1)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--accent-text)",
              wordBreak: "break-all",
            }}
          >
            {link}
          </code>
          <CopyLinkButton link={link} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Earnings KPIs
   ============================================================ */

function Earnings({ affiliate }: { affiliate: AffiliateRow }) {
  const earned = affiliate.total_earned_cents / 100;
  const unpaid = affiliate.unpaid_balance_cents / 100;
  const paid = affiliate.total_paid_cents / 100;
  const threshold = MIN_PAYOUT_CENTS / 100;
  const progress = Math.min(
    100,
    Math.round((unpaid / threshold) * 100),
  );

  return (
    <section
      style={{
        padding: "12px 24px 24px",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <KpiCard
          label="Total earned"
          value={`$${earned.toFixed(2)}`}
          sub="lifetime commissions across every referral"
          highlight
        />
        <KpiCard
          label="Unpaid balance"
          value={`$${unpaid.toFixed(2)}`}
          sub={`payout fires at $${threshold.toFixed(0)}+ · ${progress}% of the way`}
        />
        <KpiCard
          label="Paid to date"
          value={`$${paid.toFixed(2)}`}
          sub={
            affiliate.payout_method
              ? `via ${affiliate.payout_method}`
              : "no payout method on file"
          }
        />
      </div>
    </section>
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
        padding: "20px 22px",
        boxShadow: highlight
          ? "0 0 30px -10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div
        className="t-mono"
        style={{
          color: "var(--fg-4)",
          fontSize: 11,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 32,
          lineHeight: 1,
          letterSpacing: "-0.015em",
          marginTop: 10,
          color: highlight ? "var(--accent-text)" : "var(--fg-1)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        className="t-mono-s"
        style={{ color: "var(--fg-4)", marginTop: 10 }}
      >
        {sub}
      </div>
    </div>
  );
}

/* ============================================================
   Referrals list
   ============================================================ */

function ReferralsSection({ rows }: { rows: ReferralRow[] }) {
  return (
    <section
      style={{
        padding: "24px 24px",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.012em",
          margin: "0 0 16px",
        }}
      >
        Recent referrals
      </h2>
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
        }}
      >
        {rows.length === 0 ? (
          <EmptyHint>
            No referrals yet. Drop your link in a Story or DM to
            light it up.
          </EmptyHint>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <TableHeadRow
                cells={[
                  "WHEN",
                  "PLAN",
                  "COMMISSION",
                  "STATUS",
                ]}
              />
            </thead>
            <tbody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  cells={[
                    new Date(r.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                    formatPlanKey(r.plan_key),
                    `$${(r.commission_cents / 100).toFixed(2)}`,
                    statusBadge(r.status),
                  ]}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   Payouts list
   ============================================================ */

function PayoutsSection({ rows }: { rows: PayoutRow[] }) {
  return (
    <section
      style={{
        padding: "24px 24px",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.012em",
          margin: "0 0 16px",
        }}
      >
        Payout history
      </h2>
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
        }}
      >
        {rows.length === 0 ? (
          <EmptyHint>
            No payouts yet. They&rsquo;ll show up here once your
            balance clears $25.
          </EmptyHint>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <TableHeadRow
                cells={["WHEN", "AMOUNT", "METHOD", "REFERENCE"]}
              />
            </thead>
            <tbody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  cells={[
                    new Date(r.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                    `$${(r.amount_cents / 100).toFixed(2)}`,
                    r.method,
                    r.external_reference ?? "—",
                  ]}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   Shared primitives
   ============================================================ */

function TableHeadRow({ cells }: { cells: string[] }) {
  return (
    <tr>
      {cells.map((c) => (
        <th
          key={c}
          className="t-mono"
          style={{
            padding: "14px 16px",
            textAlign: "left",
            color: "var(--fg-4)",
            fontSize: 11,
            letterSpacing: "0.06em",
            borderBottom: "1px solid var(--border-1)",
            fontWeight: 500,
          }}
        >
          {c}
        </th>
      ))}
    </tr>
  );
}

function TableRow({ cells }: { cells: React.ReactNode[] }) {
  return (
    <tr>
      {cells.map((c, i) => (
        <td
          key={i}
          style={{
            padding: "14px 16px",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--fg-1)",
            borderBottom: "1px solid var(--border-1)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {c}
        </td>
      ))}
    </tr>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "32px 24px",
        textAlign: "center",
        color: "var(--fg-4)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}

function formatPlanKey(planKey: string | null): string {
  if (!planKey) return "—";
  switch (planKey) {
    case "lifetime":
      return "Lifetime";
    case "pro_monthly":
      return "Pro Monthly";
    case "pro_yearly":
      return "Pro Yearly";
    default:
      return planKey;
  }
}

function statusBadge(status: string): React.ReactNode {
  const colors: Record<string, { fg: string; bg: string }> = {
    pending: {
      fg: "var(--fg-3)",
      bg: "color-mix(in oklch, var(--fg-3) 12%, transparent)",
    },
    approved: {
      fg: "var(--accent-text)",
      bg: "var(--accent-surface)",
    },
    paid: {
      fg: "#10b981",
      bg: "color-mix(in oklch, #10b981 12%, transparent)",
    },
    refunded: {
      fg: "var(--danger)",
      bg: "color-mix(in oklch, var(--danger) 12%, transparent)",
    },
    expired: {
      fg: "var(--fg-4)",
      bg: "color-mix(in oklch, var(--fg-4) 12%, transparent)",
    },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span
      className="t-mono"
      style={{
        padding: "4px 10px",
        borderRadius: "var(--r-pill)",
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}

/* ============================================================
   Not-an-affiliate fallback
   ============================================================ */

function NotAnAffiliateShell() {
  return (
    <>
      <LandingHeader isAuthed={true} />
      <main
        style={{
          background: "var(--bg-0)",
          color: "var(--fg-1)",
          paddingBottom: 120,
        }}
      >
        <section
          style={{
            padding: "120px 24px 40px",
            maxWidth: 720,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              padding: "48px 32px",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              border: "1px solid var(--border-1)",
            }}
          >
            <span
              className="t-mono"
              style={{
                color: "var(--accent-text)",
                fontSize: 11,
                letterSpacing: "0.08em",
              }}
            >
              AFFILIATE PROGRAM
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.05,
                letterSpacing: "-0.018em",
                margin: "16px 0",
              }}
            >
              You&rsquo;re not part of the affiliate program yet.
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                lineHeight: 1.5,
                color: "var(--fg-3)",
                margin: "0 auto 28px",
                maxWidth: 480,
              }}
            >
              The program is currently invitation-only. See the
              landing page for the commission rate and how to apply.
            </p>
            <Link
              href="/affiliates"
              className="t-mono"
              style={{
                padding: "14px 26px",
                borderRadius: "var(--r-pill)",
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              See the program →
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}

/* ============================================================
   Data fetcher
   ============================================================ */

async function fetchAffiliate(
  admin: ReturnType<typeof getAdminSupabase>,
  userId: string,
  email: string,
): Promise<AffiliateRow | null> {
  // First try by user_id (fastest, no race with email migration).
  const { data: byUid } = await admin
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<AffiliateRow>();
  if (byUid) return byUid;

  // Fallback: email match (covers the case where the affiliate
  // applied with email X and later signed up with the same one;
  // the user_id is null until we stamp it on first visit).
  if (!email) return null;
  const { data: byEmail } = await admin
    .from("affiliates")
    .select("*")
    .eq("email", email)
    .maybeSingle<AffiliateRow>();
  return byEmail ?? null;
}
