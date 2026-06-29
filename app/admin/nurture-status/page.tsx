/**
 * /admin/nurture-status — funnel + per-contact view of the
 * producer-nurture email sequence.
 *
 * Three sections, same shape as /admin:
 *   1. KPI strip — total contacts in the sequence + breakdown
 *      by status (pending / converted / unsubbed / bounced /
 *      completed).
 *   2. Manual cron trigger — fires the same route the daily
 *      scheduler hits, returns the JSON inline so the founder
 *      can see exactly what happened.
 *   3. Contacts table — one row per contact in the sequence
 *      with step, status, last_sent_at, source server, and the
 *      contact's email. Sorted newest activity first.
 *
 * Auth: same allow-list as /admin and /admin/affiliates.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { TriggerButton } from "./TriggerButton";

export const dynamic = "force-dynamic";

interface FunnelKpis {
  total: number;
  pending: number;
  converted: number;
  unsubscribed: number;
  bounced: number;
  completedNormal: number;
}

interface NurtureRow {
  id: string;
  email: string;
  currentStep: number | null;
  status: string;
  lastSentAt: string | null;
  completedAt: string | null;
  completionReason: string | null;
  createdAt: string;
  firstSeenAt: string | null;
  sourceServerName: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  completed_normal: "DONE",
  converted: "CONVERTED",
  unsubscribed: "UNSUB",
  bounced: "BOUNCED",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--fg-2)",
  completed_normal: "var(--ok)",
  converted: "var(--accent-text)",
  unsubscribed: "var(--fg-4)",
  bounced: "var(--danger)",
};

export default async function NurtureStatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin/nurture-status");
  if (!isAdminEmail(user.email)) redirect("/");

  const admin = getAdminSupabase();
  const [kpis, rows] = await Promise.all([
    fetchKpis(admin),
    fetchRows(admin),
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
        style={{
          maxWidth: 1120,
          display: "flex",
          flexDirection: "column",
          gap: 36,
        }}
      >
        <Header email={user.email ?? ""} />
        <KpiStrip kpis={kpis} />
        <Section
          title="Trigger cron"
          sub="Fire the producer-nurture run on demand. Same auth + same body as the daily scheduler."
        >
          <TriggerButton />
        </Section>
        <Section
          title="Contacts in sequence"
          sub={`${rows.length} rows · newest activity first`}
        >
          <Table rows={rows} />
        </Section>
        <Section
          title="Email previews"
          sub="Eyeball any of the 4 steps as they'll ship"
        >
          <div
            className="flex flex-wrap"
            style={{ gap: 10, padding: 18 }}
          >
            {[1, 2, 3, 4].map((n) => (
              <Link
                key={n}
                href={`/admin/email-previews/nurture/${n}`}
                target="_blank"
                className="t-mono"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--accent-surface)",
                  border:
                    "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
                  color: "var(--accent-text)",
                  textDecoration: "none",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                }}
              >
                STEP {n} →
              </Link>
            ))}
          </div>
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
    <header
      className="flex items-end justify-between flex-wrap"
      style={{ gap: 16 }}
    >
      <div className="flex flex-col">
        <span
          className="t-mono"
          style={{ color: "var(--accent-text)", marginBottom: 8 }}
        >
          Admin &middot; Nurture sequence
        </span>
        <h1
          className="t-display"
          style={{ fontSize: 36, lineHeight: 1.05 }}
        >
          Producer-nurture funnel.
        </h1>
      </div>
      <div className="flex items-center" style={{ gap: 14 }}>
        <Link
          href="/admin"
          className="t-mono"
          style={{
            padding: "8px 14px",
            borderRadius: "var(--r-pill)",
            background: "var(--bg-2)",
            border: "1px solid var(--border-1)",
            color: "var(--fg-2)",
            textDecoration: "none",
            letterSpacing: "0.08em",
            fontSize: 11,
          }}
        >
          ← BACK TO COCKPIT
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

function KpiStrip({ kpis }: { kpis: FunnelKpis }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 14,
      }}
    >
      <KpiCard
        label="In funnel"
        value={kpis.total}
        sub="total sequence rows"
      />
      <KpiCard
        label="Pending"
        value={kpis.pending}
        sub="still receiving"
        highlight
      />
      <KpiCard
        label="Converted"
        value={kpis.converted}
        sub="became a producer"
      />
      <KpiCard
        label="Completed"
        value={kpis.completedNormal}
        sub="all 4 steps sent"
      />
      <KpiCard
        label="Unsub"
        value={kpis.unsubscribed}
        sub="clicked the link"
      />
      <KpiCard
        label="Bounced"
        value={kpis.bounced}
        sub="hard bounce from Resend"
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
  value: number;
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
      <div
        className="t-mono"
        style={{ color: "var(--fg-4)", marginBottom: 8 }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 28,
          lineHeight: 1,
          letterSpacing: "-0.015em",
          color: highlight ? "var(--accent-text)" : "var(--fg-1)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value.toLocaleString("en-US")}
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
        <h2
          className="t-h2"
          style={{ fontSize: 22, letterSpacing: "-0.012em" }}
        >
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
   Table
   ============================================================ */

function Table({ rows }: { rows: NurtureRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        className="t-body"
        style={{
          padding: "32px 18px",
          textAlign: "center",
          color: "var(--fg-3)",
        }}
      >
        No contacts in the sequence yet. The first cron tick after a
        producer-audience contact joins a server will create the row.
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 900,
        }}
      >
        <thead>
          <tr
            className="t-mono"
            style={{
              color: "var(--fg-4)",
              fontSize: 10,
              letterSpacing: "0.06em",
              background: "var(--bg-2)",
              borderBottom: "1px solid var(--border-1)",
            }}
          >
            <th style={cellStyle("left")}>EMAIL</th>
            <th style={cellStyle("left")}>SOURCE SERVER</th>
            <th style={cellStyle("left")}>STEP</th>
            <th style={cellStyle("left")}>STATUS</th>
            <th style={cellStyle("left")}>LAST SENT</th>
            <th style={cellStyle("left")}>JOINED</th>
            <th style={cellStyle("left")}>REASON</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.id}
              style={{
                borderBottom:
                  i === rows.length - 1
                    ? "none"
                    : "1px solid var(--border-1)",
                color: "var(--fg-1)",
              }}
            >
              <td style={cellStyle("left")}>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {r.email}
                </span>
              </td>
              <td style={cellStyle("left")}>
                <span
                  className="t-mono-s"
                  style={{ color: "var(--fg-3)" }}
                >
                  {r.sourceServerName ?? "—"}
                </span>
              </td>
              <td style={cellStyle("left")}>
                <span
                  className="t-mono"
                  style={{
                    color: "var(--accent-text)",
                    fontSize: 12,
                  }}
                >
                  {r.currentStep ?? 0}/4
                </span>
              </td>
              <td style={cellStyle("left")}>
                <span
                  className="t-mono"
                  style={{
                    color:
                      STATUS_COLOR[r.status] ?? "var(--fg-3)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                  }}
                >
                  {STATUS_LABEL[r.status] ?? r.status.toUpperCase()}
                </span>
              </td>
              <td style={cellStyle("left")}>
                <span
                  className="t-mono-s"
                  style={{ color: "var(--fg-3)" }}
                >
                  {r.lastSentAt ? fmtRelative(r.lastSentAt) : "—"}
                </span>
              </td>
              <td style={cellStyle("left")}>
                <span
                  className="t-mono-s"
                  style={{ color: "var(--fg-4)" }}
                >
                  {r.firstSeenAt
                    ? fmtRelative(r.firstSeenAt)
                    : "—"}
                </span>
              </td>
              <td style={cellStyle("left")}>
                <span
                  className="t-mono-s"
                  style={{ color: "var(--fg-4)" }}
                >
                  {r.completionReason ?? "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellStyle(align: "left" | "right"): React.CSSProperties {
  return {
    padding: "12px 16px",
    textAlign: align,
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  };
}

/* ============================================================
   Data fetchers
   ============================================================ */

async function fetchKpis(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<FunnelKpis> {
  const { data } = await admin
    .from("contact_nurture_sequence" as never)
    .select("status");
  const rows = (data ?? []) as unknown as Array<{ status: string }>;
  const total = rows.length;
  const tally: Record<string, number> = {};
  for (const r of rows) {
    tally[r.status] = (tally[r.status] ?? 0) + 1;
  }
  return {
    total,
    pending: tally["pending"] ?? 0,
    converted: tally["converted"] ?? 0,
    unsubscribed: tally["unsubscribed"] ?? 0,
    bounced: tally["bounced"] ?? 0,
    completedNormal: tally["completed_normal"] ?? 0,
  };
}

async function fetchRows(
  admin: ReturnType<typeof getAdminSupabase>,
): Promise<NurtureRow[]> {
  // Sequence rows + the contact's email + first_seen_at via an
  // embedded join. The source-server name is a follow-up because
  // contacts can be granted on multiple servers — we pick the
  // most recent producer-audience grant as the 'origin'.
  const { data } = await admin
    .from("contact_nurture_sequence" as never)
    .select(
      "id, contact_id, current_step, status, last_sent_at, completed_at, completion_reason, created_at, contacts:contact_id(email, first_seen_at)",
    )
    .order("last_sent_at", { ascending: false, nullsFirst: false });

  type RawRow = {
    id: string;
    contact_id: string;
    current_step: number | null;
    status: string;
    last_sent_at: string | null;
    completed_at: string | null;
    completion_reason: string | null;
    created_at: string;
    contacts: { email: string; first_seen_at: string } | null;
  };
  const raw = ((data ?? []) as unknown) as RawRow[];

  // Resolve the source producer-audience server per contact in
  // a single follow-up query (avoid N+1).
  const contactIds = raw.map((r) => r.contact_id);
  const serverByContact = new Map<string, string>();
  if (contactIds.length > 0) {
    const { data: gRows } = await admin
      .from("server_contacts")
      .select(
        "contact_id, granted_at, servers!inner(name, audience_type)",
      )
      .in("contact_id", contactIds)
      .eq("status", "granted")
      .order("granted_at", { ascending: false });
    type GRow = {
      contact_id: string;
      granted_at: string;
      servers: { name: string; audience_type: string } | null;
    };
    for (const g of ((gRows ?? []) as unknown) as GRow[]) {
      if (
        g.servers?.audience_type === "producers" &&
        !serverByContact.has(g.contact_id)
      ) {
        serverByContact.set(g.contact_id, g.servers.name);
      }
    }
  }

  return raw.map((r) => ({
    id: r.id,
    email: r.contacts?.email ?? "—",
    currentStep: r.current_step,
    status: r.status,
    lastSentAt: r.last_sent_at,
    completedAt: r.completed_at,
    completionReason: r.completion_reason,
    createdAt: r.created_at,
    firstSeenAt: r.contacts?.first_seen_at ?? null,
    sourceServerName: serverByContact.get(r.contact_id) ?? null,
  }));
}

/* ============================================================
   Helpers
   ============================================================ */

function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - t) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
