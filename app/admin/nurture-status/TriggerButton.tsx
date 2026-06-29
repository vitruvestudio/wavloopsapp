/**
 * Trigger-cron client button. Click → server action fires the
 * cron route → result JSON renders inline so the founder sees
 * "5 sends, 2 converted, 0 errors" without leaving the page.
 *
 * Status pill stays sticky after the call so the next time the
 * page reloads the result is still visible (last_result lives in
 * client state — refresh wipes it, which is fine).
 */

"use client";

import * as React from "react";
import { triggerNurtureCronAction } from "./actions";

interface CronResult {
  pool_size?: number;
  sends?: number;
  converted?: number;
  skipped_unsubbed?: number;
  skipped_completed?: number;
  skipped_too_early?: number;
  errors?: string[];
}

export function TriggerButton() {
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<CronResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handle = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const r = await triggerNurtureCronAction();
      if (!r.ok) {
        setError(r.error ?? "Unknown error");
        return;
      }
      setResult((r.payload as CronResult) ?? null);
    });
  };

  return (
    <div
      className="flex flex-col"
      style={{ gap: 14, padding: 18 }}
    >
      <div
        className="flex items-center"
        style={{ gap: 16, flexWrap: "wrap" }}
      >
        <button
          type="button"
          onClick={handle}
          disabled={pending}
          className="t-mono"
          style={{
            padding: "10px 18px",
            borderRadius: "var(--r-pill)",
            background: pending ? "var(--bg-3)" : "var(--accent)",
            color: "#fff",
            border: "none",
            fontSize: 12,
            letterSpacing: "0.06em",
            cursor: pending ? "wait" : "pointer",
            textTransform: "uppercase",
          }}
        >
          {pending ? "TICKING…" : "Trigger cron now →"}
        </button>
        <span
          className="t-mono-s"
          style={{ color: "var(--fg-4)" }}
        >
          Fires the same route the daily 10:00 UTC scheduler hits.
        </span>
      </div>

      {error && (
        <div
          className="t-mono-s"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            background:
              "color-mix(in oklch, var(--danger) 12%, transparent)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
          }}
        >
          ERROR · {error}
        </div>
      )}

      {result && (
        <div
          className="grid"
          style={{
            gridTemplateColumns:
              "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <ResultPill label="Pool" value={result.pool_size ?? 0} />
          <ResultPill
            label="Sends"
            value={result.sends ?? 0}
            accent
          />
          <ResultPill
            label="Converted"
            value={result.converted ?? 0}
          />
          <ResultPill
            label="Too early"
            value={result.skipped_too_early ?? 0}
          />
          <ResultPill
            label="Completed"
            value={result.skipped_completed ?? 0}
          />
          <ResultPill
            label="Errors"
            value={result.errors?.length ?? 0}
            danger={(result.errors?.length ?? 0) > 0}
          />
        </div>
      )}

      {result && (result.errors?.length ?? 0) > 0 && (
        <div
          className="t-mono-s"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            background:
              "color-mix(in oklch, var(--danger) 8%, transparent)",
            color: "var(--fg-2)",
            border: "1px solid var(--border-1)",
            whiteSpace: "pre-wrap",
          }}
        >
          {result.errors?.join("\n") ?? ""}
        </div>
      )}
    </div>
  );
}

function ResultPill({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "var(--r-md)",
        background: "var(--bg-2)",
        border: `1px solid ${
          danger
            ? "var(--danger)"
            : accent
              ? "color-mix(in oklch, var(--accent-text) 35%, transparent)"
              : "var(--border-1)"
        }`,
      }}
    >
      <div
        className="t-mono"
        style={{ color: "var(--fg-4)", fontSize: 10 }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          lineHeight: 1,
          marginTop: 6,
          color: danger
            ? "var(--danger)"
            : accent
              ? "var(--accent-text)"
              : "var(--fg-1)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
