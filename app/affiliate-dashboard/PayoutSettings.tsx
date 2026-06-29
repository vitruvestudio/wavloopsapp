/**
 * PayoutSettings — client-side form to edit the affiliate's
 * preferred payout method + payout email + display name.
 *
 * Manual-payout phase: we send funds outside the app, so the only
 * thing the affiliate needs to keep current is where to send the
 * money. The form pre-fills with the current values + flashes
 * 'Saved ✓' for ~1.6 s on successful submit.
 */

"use client";

import * as React from "react";
import { updateAffiliatePayoutSettingsAction } from "./actions";

interface Props {
  initialMethod: string | null;
  initialEmail: string | null;
  initialDisplayName: string | null;
}

const PAYOUT_METHODS = [
  { value: "paypal", label: "PayPal" },
  { value: "wise", label: "Wise" },
  { value: "bank", label: "Bank transfer" },
  { value: "other", label: "Other" },
];

export function PayoutSettings({
  initialMethod,
  initialEmail,
  initialDisplayName,
}: Props) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAffiliatePayoutSettingsAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Couldn't save.");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    });
  };

  // 'stripe_connect' is no longer a user-pickable value, so if the
  // affiliate row carries it (legacy), we fall back to PayPal as
  // the default select option but keep their existing value
  // intact unless they save.
  const safeMethod =
    initialMethod && PAYOUT_METHODS.some((m) => m.value === initialMethod)
      ? initialMethod
      : "paypal";

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
        Payout settings
      </h2>
      <form
        onSubmit={handle}
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-lg)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
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
            {error.toUpperCase()}
          </div>
        )}

        <Row>
          <Field
            name="display_name"
            label="Display name"
            defaultValue={initialDisplayName ?? ""}
            placeholder="Your name (shown to admin)"
          />
          <Select
            name="payout_method"
            label="Payout method"
            defaultValue={safeMethod}
            options={PAYOUT_METHODS}
          />
        </Row>

        <Field
          name="payout_email"
          label="Payout email"
          type="email"
          defaultValue={initialEmail ?? ""}
          placeholder="you@paypal.com"
          hint="Where we send the money. Make sure this matches the address registered with your chosen method."
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 6,
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="t-mono"
            style={{
              padding: "12px 22px",
              borderRadius: "var(--r-pill)",
              background: pending
                ? "var(--bg-3)"
                : saved
                  ? "var(--bg-2)"
                  : "var(--accent)",
              color: saved ? "var(--accent-text)" : "#fff",
              border: saved
                ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
                : "none",
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: pending ? "wait" : "pointer",
              boxShadow:
                pending || saved
                  ? "none"
                  : "0 0 30px -8px var(--accent-glow)",
              transition: "background 200ms, color 200ms",
            }}
          >
            {pending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
          <span
            className="t-mono-s"
            style={{ color: "var(--fg-4)" }}
          >
            We send payouts manually once your balance crosses $25.
            Expect 2-3 business days after we fire it.
          </span>
        </div>
      </form>
    </section>
  );
}

/* ============================================================
   Field primitives
   ============================================================ */

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        htmlFor={htmlFor}
        className="t-mono"
        style={{
          color: "var(--fg-4)",
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </label>
      {hint && (
        <span
          className="t-mono-s"
          style={{ color: "var(--fg-4)", fontSize: 11 }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor={name} hint={hint}>
        {label}
      </Label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        style={{
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          color: "var(--fg-1)",
          fontFamily: "var(--font-body)",
          fontSize: 14.5,
          outline: "none",
        }}
      />
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        style={{
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          color: "var(--fg-1)",
          fontFamily: "var(--font-body)",
          fontSize: 14.5,
          outline: "none",
          appearance: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
