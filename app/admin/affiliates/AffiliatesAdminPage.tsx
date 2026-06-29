/**
 * /admin/affiliates — client surface.
 *
 * Renders the KPI strip + a stack of sections (pending,
 * active, suspended/rejected, recent payouts) plus a "Create
 * affiliate from admin" form for fast-tracking producers Theo
 * DMs personally.
 *
 * Every mutating button delegates to the corresponding server
 * action in ./actions.ts. We surface inline error toasts on
 * failure and revalidate the path on success (handled by the
 * action via revalidatePath, so the server-rendered list comes
 * back fresh on the next paint).
 *
 * Security posture (UI side):
 *   - Inputs are validated again on the client as a friendlier
 *     UX layer, but ALL real authority lives in the server
 *     action. A user who bypasses the form would hit the same
 *     validation in the action.
 *   - All text rendered through React's default escaping; no
 *     dangerouslySetInnerHTML anywhere.
 *   - The share-link preview doesn't auto-submit anywhere — it's
 *     a CSS-styled preview string.
 */

"use client";

import * as React from "react";
import {
  adjustCommissionRateAction,
  approveAffiliateAction,
  createAffiliateFromAdminAction,
  reactivateAffiliateAction,
  recordAffiliatePayoutAction,
  rejectAffiliateAction,
  suspendAffiliateAction,
} from "./actions";
import type {
  AffiliateKpis,
  AffiliateRow,
  PayoutRow,
} from "./page";

interface Props {
  kpis: AffiliateKpis;
  affiliates: AffiliateRow[];
  payouts: PayoutRow[];
}

export function AffiliatesAdminPage({ kpis, affiliates, payouts }: Props) {
  const pending = affiliates.filter((a) => a.status === "pending");
  const active = affiliates.filter((a) => a.status === "active");
  const inactive = affiliates.filter(
    (a) => a.status === "suspended" || a.status === "rejected",
  );

  return (
    <div className="flex flex-col" style={{ gap: 36 }}>
      <KpiStrip kpis={kpis} />

      <Section title="Create affiliate" sub="Skip the application form — onboard a producer in one click.">
        <CreateAffiliateForm />
      </Section>

      <Section
        title={`Pending applications (${pending.length})`}
        sub="Review and approve / reject before they can ship a link."
      >
        {pending.length === 0 ? (
          <EmptyHint>No pending applications.</EmptyHint>
        ) : (
          <AffiliateTable rows={pending} mode="pending" />
        )}
      </Section>

      <Section
        title={`Active affiliates (${active.length})`}
        sub="Track conversions, adjust commission rate, record payouts."
      >
        {active.length === 0 ? (
          <EmptyHint>No active affiliates yet.</EmptyHint>
        ) : (
          <AffiliateTable rows={active} mode="active" />
        )}
      </Section>

      {inactive.length > 0 && (
        <Section
          title={`Suspended / rejected (${inactive.length})`}
          sub="Frozen — keep visible for audit but no commission accrues."
        >
          <AffiliateTable rows={inactive} mode="inactive" />
        </Section>
      )}

      <Section
        title={`Recent payouts (${payouts.length})`}
        sub="Last 50 cash transfers to affiliates."
      >
        {payouts.length === 0 ? (
          <EmptyHint>No payouts recorded yet.</EmptyHint>
        ) : (
          <PayoutsTable rows={payouts} />
        )}
      </Section>
    </div>
  );
}

/* ============================================================
   KPI strip — 6 little cards across the top.
   ============================================================ */

function KpiStrip({ kpis }: { kpis: AffiliateKpis }) {
  const items = [
    { label: "Total affiliates", value: String(kpis.totalAffiliates) },
    { label: "Pending", value: String(kpis.pendingApplications) },
    { label: "Active", value: String(kpis.activeAffiliates) },
    { label: "Earned (gross)", value: formatMoney(kpis.totalEarnedCents) },
    { label: "Paid out", value: formatMoney(kpis.totalPaidCents) },
    { label: "Unpaid", value: formatMoney(kpis.totalUnpaidCents), highlight: true },
  ];
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
      }}
    >
      {items.map((i) => (
        <div
          key={i.label}
          style={{
            padding: 16,
            borderRadius: "var(--r-md)",
            background: i.highlight ? "var(--accent-surface)" : "var(--bg-1)",
            border: i.highlight
              ? "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)"
              : "1px solid var(--border-1)",
          }}
        >
          <div
            className="t-mono"
            style={{
              color: i.highlight ? "var(--accent-text)" : "var(--fg-3)",
              letterSpacing: "0.08em",
              fontSize: 11,
            }}
          >
            {i.label.toUpperCase()}
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 22,
              color: i.highlight ? "var(--accent-text)" : "var(--fg-1)",
            }}
          >
            {i.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Section wrapper.
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
    <section
      style={{
        padding: 24,
        borderRadius: "var(--r-xl)",
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2
          className="t-display"
          style={{
            fontSize: 18,
            letterSpacing: "-0.01em",
            color: "var(--fg-1)",
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            style={{
              marginTop: 4,
              fontSize: 13,
              color: "var(--fg-3)",
              fontFamily: "var(--font-body)",
            }}
          >
            {sub}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "32px 16px",
        textAlign: "center",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: "var(--fg-3)",
        border: "1px dashed var(--border-1)",
        borderRadius: "var(--r-md)",
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   Create affiliate from admin — inline form.
   ============================================================ */

function CreateAffiliateForm() {
  const [handle, setHandle] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [commissionPct, setCommissionPct] = React.useState("30");
  const [payoutMethod, setPayoutMethod] = React.useState("paypal");
  const [payoutEmail, setPayoutEmail] = React.useState("");
  const [audiencePlatform, setAudiencePlatform] = React.useState("");
  const [audienceSize, setAudienceSize] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<{
    kind: "ok" | "err";
    message: string;
  } | null>(null);

  function reset() {
    setHandle("");
    setEmail("");
    setDisplayName("");
    setCommissionPct("30");
    setPayoutMethod("paypal");
    setPayoutEmail("");
    setAudiencePlatform("");
    setAudienceSize("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const rateNum = Number(commissionPct);
    if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 100) {
      setFeedback({ kind: "err", message: "Commission must be between 0 and 100." });
      return;
    }
    const audienceNum = audienceSize.trim() ? Number(audienceSize) : undefined;
    if (audienceNum !== undefined && !Number.isFinite(audienceNum)) {
      setFeedback({ kind: "err", message: "Audience size must be a number." });
      return;
    }
    startTransition(async () => {
      const res = await createAffiliateFromAdminAction({
        handle: handle.trim(),
        email: email.trim(),
        displayName: displayName.trim() || undefined,
        commissionRate: rateNum / 100,
        payoutMethod,
        payoutEmail: payoutEmail.trim() || undefined,
        audiencePlatform: audiencePlatform || undefined,
        audienceSize:
          typeof audienceNum === "number" ? Math.floor(audienceNum) : undefined,
      });
      if (res.error) {
        setFeedback({ kind: "err", message: res.error });
        return;
      }
      setFeedback({
        kind: "ok",
        message: `Affiliate created. Share link: wavloops.co/?ref=${handle.trim()}`,
      });
      reset();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      <TextInput
        label="Handle"
        hint="2-32 chars, letters/digits/dashes — becomes ?ref=handle."
        value={handle}
        onChange={setHandle}
        required
        placeholder="prodbymike40"
      />
      <TextInput
        label="Email"
        value={email}
        onChange={setEmail}
        type="email"
        required
        placeholder="mike@example.com"
      />
      <TextInput
        label="Display name (optional)"
        value={displayName}
        onChange={setDisplayName}
        placeholder="Mike (prod by Mike)"
      />
      <TextInput
        label="Commission %"
        value={commissionPct}
        onChange={setCommissionPct}
        type="number"
        step="1"
        min="0"
        max="100"
        required
      />
      <SelectInput
        label="Payout method"
        value={payoutMethod}
        onChange={setPayoutMethod}
        options={[
          { value: "paypal", label: "PayPal" },
          { value: "wise", label: "Wise" },
          { value: "bank", label: "Bank transfer" },
          { value: "other", label: "Other" },
        ]}
      />
      <TextInput
        label="Payout email (optional)"
        value={payoutEmail}
        onChange={setPayoutEmail}
        type="email"
        placeholder="mike@paypal.com"
      />
      <SelectInput
        label="Audience platform (optional)"
        value={audiencePlatform}
        onChange={setAudiencePlatform}
        options={[
          { value: "", label: "—" },
          { value: "instagram", label: "Instagram" },
          { value: "youtube", label: "YouTube" },
          { value: "twitter", label: "X / Twitter" },
          { value: "tiktok", label: "TikTok" },
          { value: "mixed", label: "Mixed" },
        ]}
      />
      <TextInput
        label="Audience size (optional)"
        value={audienceSize}
        onChange={setAudienceSize}
        type="number"
        min="0"
        placeholder="12000"
      />
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {feedback && (
          <span
            className="t-body"
            style={{
              fontSize: 13,
              color: feedback.kind === "ok" ? "var(--ok)" : "var(--err)",
            }}
          >
            {feedback.message}
          </span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn-primary"
          style={primaryBtnStyle(pending)}
        >
          {pending ? "Creating…" : "Create affiliate"}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   Affiliates table.
   ============================================================ */

function AffiliateTable({
  rows,
  mode,
}: {
  rows: AffiliateRow[];
  mode: "pending" | "active" | "inactive";
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-body)",
          fontSize: 13,
        }}
      >
        <thead style={{ background: "var(--bg-2)" }}>
          <tr>
            <Th>Handle</Th>
            <Th>Email</Th>
            <Th>Rate</Th>
            <Th align="right">Earned</Th>
            <Th align="right">Unpaid</Th>
            <Th>Audience</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AffiliateRowView key={row.id} row={row} mode={mode} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AffiliateRowView({
  row,
  mode,
}: {
  row: AffiliateRow;
  mode: "pending" | "active" | "inactive";
}) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [showPayout, setShowPayout] = React.useState(false);
  const [showRateEdit, setShowRateEdit] = React.useState(false);

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      <tr style={{ borderTop: "1px solid var(--border-1)" }}>
        <Td>
          <div style={{ fontWeight: 600, color: "var(--fg-1)" }}>{row.handle}</div>
          {row.display_name && (
            <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
              {row.display_name}
            </div>
          )}
        </Td>
        <Td>{row.email}</Td>
        <Td>{(row.commission_rate * 100).toFixed(0)}%</Td>
        <Td align="right">{formatMoney(row.total_earned_cents)}</Td>
        <Td align="right">{formatMoney(row.unpaid_balance_cents)}</Td>
        <Td>
          {row.audience_platform ? (
            <>
              {row.audience_platform}
              {row.audience_size != null && (
                <span style={{ color: "var(--fg-3)" }}>
                  {" "}
                  · {row.audience_size.toLocaleString("en-US")}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: "var(--fg-4)" }}>—</span>
          )}
        </Td>
        <Td align="right">
          <div
            className="flex items-center justify-end flex-wrap"
            style={{ gap: 6 }}
          >
            {mode === "pending" && (
              <>
                <ActionBtn
                  variant="primary"
                  disabled={pending}
                  onClick={() => run(() => approveAffiliateAction(row.id))}
                >
                  Approve
                </ActionBtn>
                <ActionBtn
                  variant="danger"
                  disabled={pending}
                  onClick={() => run(() => rejectAffiliateAction(row.id))}
                >
                  Reject
                </ActionBtn>
              </>
            )}
            {mode === "active" && (
              <>
                <ActionBtn
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setShowRateEdit((v) => !v)}
                >
                  Rate
                </ActionBtn>
                <ActionBtn
                  variant="primary"
                  disabled={pending || row.unpaid_balance_cents <= 0}
                  onClick={() => setShowPayout((v) => !v)}
                >
                  Pay
                </ActionBtn>
                <ActionBtn
                  variant="danger"
                  disabled={pending}
                  onClick={() => run(() => suspendAffiliateAction(row.id))}
                >
                  Suspend
                </ActionBtn>
              </>
            )}
            {mode === "inactive" && row.status === "suspended" && (
              <ActionBtn
                variant="primary"
                disabled={pending}
                onClick={() => run(() => reactivateAffiliateAction(row.id))}
              >
                Reactivate
              </ActionBtn>
            )}
          </div>
        </Td>
      </tr>
      {error && (
        <tr>
          <td
            colSpan={7}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              color: "var(--err)",
              background: "var(--err-surface)",
            }}
          >
            {error}
          </td>
        </tr>
      )}
      {showPayout && (
        <tr>
          <td colSpan={7} style={{ padding: 16, background: "var(--bg-inset)" }}>
            <PayoutForm
              affiliateId={row.id}
              maxCents={row.unpaid_balance_cents}
              defaultMethod={row.payout_method}
              onDone={(ok) => {
                if (ok) setShowPayout(false);
              }}
            />
          </td>
        </tr>
      )}
      {showRateEdit && (
        <tr>
          <td colSpan={7} style={{ padding: 16, background: "var(--bg-inset)" }}>
            <RateEditor
              affiliateId={row.id}
              currentRate={row.commission_rate}
              onDone={(ok) => {
                if (ok) setShowRateEdit(false);
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

/* ============================================================
   Payout form (inline, expanded under a row).
   ============================================================ */

function PayoutForm({
  affiliateId,
  maxCents,
  defaultMethod,
  onDone,
}: {
  affiliateId: string;
  maxCents: number;
  defaultMethod: string;
  onDone: (ok: boolean) => void;
}) {
  const [amount, setAmount] = React.useState((maxCents / 100).toFixed(2));
  const [method, setMethod] = React.useState(defaultMethod);
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Amount must be positive.");
      return;
    }
    const amountCents = Math.round(amountNum * 100);
    if (amountCents > maxCents) {
      setError(`Amount exceeds unpaid balance (${formatMoney(maxCents)}).`);
      return;
    }
    startTransition(async () => {
      const res = await recordAffiliatePayoutAction({
        affiliateId,
        amountCents,
        method,
        externalReference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (res.error) {
        setError(res.error);
        onDone(false);
        return;
      }
      onDone(true);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      <TextInput
        label="Amount (USD)"
        value={amount}
        onChange={setAmount}
        type="number"
        step="0.01"
        min="0.01"
        required
      />
      <SelectInput
        label="Method"
        value={method}
        onChange={setMethod}
        options={[
          { value: "paypal", label: "PayPal" },
          { value: "wise", label: "Wise" },
          { value: "stripe_connect", label: "Stripe Connect" },
          { value: "bank", label: "Bank" },
          { value: "other", label: "Other" },
        ]}
      />
      <TextInput
        label="Reference"
        value={reference}
        onChange={setReference}
        placeholder="Transaction ID"
      />
      <TextInput
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional"
      />
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {error && (
          <span
            className="t-body"
            style={{ fontSize: 12, color: "var(--err)" }}
          >
            {error}
          </span>
        )}
        <div className="flex items-center" style={{ gap: 8 }}>
          <button
            type="button"
            onClick={() => onDone(false)}
            style={ghostBtnStyle()}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            style={primaryBtnStyle(pending)}
          >
            {pending ? "Recording…" : `Record ${formatMoney(Math.round(Number(amount || 0) * 100))}`}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ============================================================
   Rate editor (inline).
   ============================================================ */

function RateEditor({
  affiliateId,
  currentRate,
  onDone,
}: {
  affiliateId: string;
  currentRate: number;
  onDone: (ok: boolean) => void;
}) {
  const [pct, setPct] = React.useState((currentRate * 100).toFixed(0));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const num = Number(pct);
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      setError("Rate must be between 0 and 100.");
      return;
    }
    startTransition(async () => {
      const res = await adjustCommissionRateAction(affiliateId, num / 100);
      if (res.error) {
        setError(res.error);
        onDone(false);
        return;
      }
      onDone(true);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-end flex-wrap"
      style={{ gap: 10 }}
    >
      <TextInput
        label="Commission %"
        value={pct}
        onChange={setPct}
        type="number"
        step="1"
        min="0"
        max="100"
      />
      {error && (
        <span style={{ fontSize: 12, color: "var(--err)", flex: 1 }}>
          {error}
        </span>
      )}
      <div className="flex items-center" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={() => onDone(false)}
          style={ghostBtnStyle()}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          style={primaryBtnStyle(pending)}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   Payouts table.
   ============================================================ */

function PayoutsTable({ rows }: { rows: PayoutRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-body)",
          fontSize: 13,
        }}
      >
        <thead style={{ background: "var(--bg-2)" }}>
          <tr>
            <Th>Date</Th>
            <Th>Affiliate</Th>
            <Th align="right">Amount</Th>
            <Th>Method</Th>
            <Th>Reference</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid var(--border-1)" }}>
              <Td>{new Date(p.paid_at).toLocaleDateString("en-US")}</Td>
              <Td>{p.affiliate_handle}</Td>
              <Td align="right">{formatMoney(p.amount_cents)}</Td>
              <Td>{p.method}</Td>
              <Td>
                {p.external_reference ? (
                  p.external_reference
                ) : (
                  <span style={{ color: "var(--fg-4)" }}>—</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   Atoms.
   ============================================================ */

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--fg-3)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <td
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        color: "var(--fg-2)",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function TextInput({
  label,
  hint,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  step,
  min,
  max,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span
        className="t-mono"
        style={{
          fontSize: 11,
          color: "var(--fg-3)",
          letterSpacing: "0.06em",
        }}
      >
        {label.toUpperCase()}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        style={{
          height: 36,
          padding: "0 10px",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--border-2)",
          background: "var(--bg-inset)",
          color: "var(--fg-1)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          outline: "none",
        }}
      />
      {hint && (
        <span style={{ fontSize: 11, color: "var(--fg-4)" }}>{hint}</span>
      )}
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span
        className="t-mono"
        style={{
          fontSize: 11,
          color: "var(--fg-3)",
          letterSpacing: "0.06em",
        }}
      >
        {label.toUpperCase()}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 36,
          padding: "0 10px",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--border-2)",
          background: "var(--bg-inset)",
          color: "var(--fg-1)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionBtn({
  children,
  onClick,
  variant,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    height: 28,
    padding: "0 12px",
    borderRadius: "var(--r-sm)",
    fontFamily: "var(--font-body)",
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "1px solid transparent",
  };
  const themed: React.CSSProperties =
    variant === "primary"
      ? {
          background: "var(--accent)",
          color: "white",
        }
      : variant === "danger"
        ? {
            background: "transparent",
            color: "var(--err)",
            border: "1px solid color-mix(in oklch, var(--err) 35%, transparent)",
          }
        : {
            background: "var(--bg-2)",
            color: "var(--fg-2)",
            border: "1px solid var(--border-2)",
          };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...themed }}
    >
      {children}
    </button>
  );
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 36,
    padding: "0 16px",
    borderRadius: "var(--r-sm)",
    background: "var(--accent)",
    color: "white",
    border: "none",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}

function ghostBtnStyle(): React.CSSProperties {
  return {
    height: 36,
    padding: "0 16px",
    borderRadius: "var(--r-sm)",
    background: "transparent",
    color: "var(--fg-2)",
    border: "1px solid var(--border-2)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    cursor: "pointer",
  };
}

function formatMoney(cents: number): string {
  const dollars = (cents ?? 0) / 100;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
