/**
 * Admin users table — search + plan override.
 *
 * Search filters by email / handle / name in-memory (we load
 * up to 200 most-recent users on the server). For Wavloops's
 * solo-founder scale that's fine; pagination ships when the
 * list hits 1,000+ rows.
 *
 * Plan override: click 'Override' on a row, pick the target
 * plan in the modal, confirm. The server action does the heavy
 * lifting (upsert into subscriptions, revalidate /admin).
 */

"use client";

import * as React from "react";
import { adminOverrideUserPlanAction } from "./actions";
import type { PlanKey } from "@/lib/billing/plans";

export interface AdminUserRow {
  id: string;
  email: string;
  handle: string | null;
  name: string | null;
  plan: PlanKey;
  status: string | null;
  createdAt: string;
  lastSignInAt: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

const PLAN_TONE: Record<PlanKey, { bg: string; fg: string }> = {
  free: { bg: "var(--bg-2)", fg: "var(--fg-3)" },
  lifetime: { bg: "var(--accent-surface)", fg: "var(--accent-text)" },
  pro: { bg: "var(--ok-surface)", fg: "var(--ok)" },
};

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = React.useState("");
  const [target, setTarget] = React.useState<AdminUserRow | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = `${u.email} ${u.handle ?? ""} ${u.name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      {/* Search bar */}
      <div
        className="flex items-center"
        style={{
          padding: "12px 14px",
          gap: 10,
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, handle, or name…"
          className="t-body"
          style={{
            flex: 1,
            background: "var(--bg-2)",
            border: "1px solid var(--border-1)",
            borderRadius: "var(--r-md)",
            color: "var(--fg-1)",
            padding: "10px 12px",
            fontSize: 14,
            outline: "none",
          }}
        />
        <span className="t-mono" style={{ color: "var(--fg-4)" }}>
          {filtered.length} / {users.length}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ background: "var(--bg-inset)" }}>
              <Th>Email</Th>
              <Th>Plan</Th>
              <Th>Joined</Th>
              <Th>Last sign-in</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const tone = PLAN_TONE[u.plan];
              return (
                <tr
                  key={u.id}
                  style={{ borderTop: "1px solid var(--border-1)" }}
                >
                  <Td>
                    <div className="flex flex-col" style={{ gap: 2 }}>
                      <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>
                        {u.email}
                      </span>
                      {(u.name || u.handle) && (
                        <span
                          className="t-mono-s"
                          style={{ color: "var(--fg-4)" }}
                        >
                          {u.name ?? ""}
                          {u.name && u.handle ? " · " : ""}
                          {u.handle ? `@${u.handle}` : ""}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span
                      className="t-mono"
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--r-pill)",
                        background: tone.bg,
                        color: tone.fg,
                        fontSize: 10,
                      }}
                    >
                      {u.plan.toUpperCase()}
                      {u.status && u.plan === "pro" ? ` · ${u.status}` : ""}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ color: "var(--fg-3)" }}>
                      {fmtDate(u.createdAt)}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ color: "var(--fg-3)" }}>
                      {fmtDate(u.lastSignInAt)}
                    </span>
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      onClick={() => setTarget(u)}
                      style={{
                        background: "var(--bg-2)",
                        border: "1px solid var(--border-2)",
                        borderRadius: "var(--r-sm)",
                        color: "var(--fg-1)",
                        padding: "6px 12px",
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Override plan
                    </button>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={5} align="center">
                  <span className="t-mono" style={{ color: "var(--fg-4)" }}>
                    No matches
                  </span>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {target && (
        <OverrideModal user={target} onClose={() => setTarget(null)} />
      )}
    </div>
  );
}

/* ============================================================
   Override modal
   ============================================================ */

function OverrideModal({
  user,
  onClose,
}: {
  user: AdminUserRow;
  onClose: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const apply = async (plan: PlanKey) => {
    setBusy(true);
    setError(null);
    const res = await adminOverrideUserPlanAction(user.id, plan);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 100%)",
          background: "var(--bg-1)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--r-lg)",
          padding: 24,
          boxShadow: "var(--shadow-pop)",
        }}
      >
        <h3 className="t-h3" style={{ marginBottom: 6 }}>
          Override plan
        </h3>
        <p className="t-body-s" style={{ color: "var(--fg-3)", marginBottom: 20 }}>
          {user.email} · currently <strong style={{ color: "var(--fg-1)" }}>{user.plan}</strong>
        </p>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {(["free", "lifetime", "pro"] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => apply(p)}
              style={{
                background: p === user.plan ? "var(--bg-2)" : "var(--bg-2)",
                border:
                  p === "pro"
                    ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
                    : "1px solid var(--border-1)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                color:
                  p === "pro" ? "var(--accent-text)" : "var(--fg-1)",
                textAlign: "left",
                cursor: busy ? "wait" : "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 14,
                opacity: busy ? 0.5 : 1,
              }}
            >
              Set to {p.toUpperCase()}
              {p === user.plan ? " (current)" : ""}
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: 14,
              padding: "8px 12px",
              borderRadius: "var(--r-md)",
              background: "var(--danger-surface)",
              color: "var(--danger)",
              fontSize: 12,
            }}
          >
            {error}
          </p>
        )}

        <div className="flex" style={{ marginTop: 18, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--fg-3)",
              padding: "8px 12px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Table helpers
   ============================================================ */

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "10px 14px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--fg-4)",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  colSpan,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        textAlign: align ?? "left",
        padding: "12px 14px",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}
