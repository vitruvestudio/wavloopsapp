/**
 * Admin landing-banner form.
 *
 * Drives the singleton public.landing_banner row. The landing
 * reads this on every render (force-dynamic) so a Save here is
 * live on wavloops.co within a refresh.
 *
 * Three states:
 *   - Off: is_active = false → landing renders nothing.
 *   - On + message only: announcement strip.
 *   - On + cta_label + cta_href: clickable promo strip.
 *
 * 'variant' picks the colour scheme — info (neutral), promo
 * (accent indigo), warning (danger red).
 */

"use client";

import * as React from "react";
import { adminUpdateBannerAction, type BannerPayload } from "./actions";

export function AdminBannerForm({ initial }: { initial: BannerPayload }) {
  const [form, setForm] = React.useState<BannerPayload>(initial);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSave = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await adminUpdateBannerAction(form);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col" style={{ gap: 18, padding: 22 }}>
      {/* Live preview */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        <span className="t-mono" style={{ color: "var(--fg-4)" }}>
          Preview
        </span>
        <BannerPreview banner={form} />
      </div>

      {/* Toggle + variant */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <Field label="Status">
          <ToggleRow
            value={form.is_active}
            onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          />
        </Field>
        <Field label="Variant">
          <select
            value={form.variant}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                variant: e.target.value as BannerPayload["variant"],
              }))
            }
            style={selectStyle}
          >
            <option value="info">Info (neutral)</option>
            <option value="promo">Promo (accent)</option>
            <option value="warning">Warning (danger)</option>
          </select>
        </Field>
      </div>

      {/* Message */}
      <Field label="Message">
        <input
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="🎉 Black Friday: 30% off Lifetime with code BFCM30"
          style={inputStyle}
        />
      </Field>

      {/* CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <Field label="CTA label (optional)">
          <input
            value={form.cta_label ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, cta_label: e.target.value }))
            }
            placeholder="Claim offer"
            style={inputStyle}
          />
        </Field>
        <Field label="CTA URL (optional)">
          <input
            value={form.cta_href ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, cta_href: e.target.value }))
            }
            placeholder="/auth?intent=signup&plan=lifetime"
            style={inputStyle}
          />
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          style={{
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

      <div className="flex items-center" style={{ gap: 12 }}>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          style={{
            background: "var(--accent)",
            color: "var(--accent-fg)",
            border: "1px solid var(--accent)",
            borderRadius: "var(--r-md)",
            padding: "10px 18px",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.65 : 1,
          }}
        >
          {busy ? "Saving…" : "Save banner"}
        </button>
        {saved && (
          <span
            className="t-mono"
            style={{ color: "var(--ok)" }}
          >
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Preview — same component shape the landing renders.
   ============================================================ */

function BannerPreview({ banner }: { banner: BannerPayload }) {
  if (!banner.is_active || !banner.message.trim()) {
    return (
      <div
        style={{
          padding: "12px 16px",
          background: "var(--bg-inset)",
          border: "1px dashed var(--border-1)",
          borderRadius: "var(--r-md)",
          color: "var(--fg-4)",
          fontSize: 12,
        }}
      >
        Banner is off — landing renders nothing.
      </div>
    );
  }
  const tone =
    banner.variant === "promo"
      ? { bg: "var(--accent-surface)", fg: "var(--accent-text)" }
      : banner.variant === "warning"
        ? { bg: "var(--danger-surface)", fg: "var(--danger)" }
        : { bg: "var(--bg-2)", fg: "var(--fg-1)" };
  return (
    <div
      style={{
        padding: "10px 16px",
        background: tone.bg,
        color: tone.fg,
        borderRadius: "var(--r-md)",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ flex: 1 }}>{banner.message}</span>
      {banner.cta_label && banner.cta_href && (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "var(--r-pill)",
            border: "1px solid currentColor",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {banner.cta_label} →
        </span>
      )}
    </div>
  );
}

/* ============================================================
   Field wrappers + styles
   ============================================================ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col" style={{ gap: 6 }}>
      <span className="t-mono" style={{ color: "var(--fg-4)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleRow({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center"
      style={{
        gap: 8,
        padding: "8px 12px",
        background: value ? "var(--ok-surface)" : "var(--bg-2)",
        border: `1px solid ${value ? "color-mix(in oklch, var(--ok) 35%, transparent)" : "var(--border-1)"}`,
        borderRadius: "var(--r-md)",
        color: value ? "var(--ok)" : "var(--fg-2)",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 32,
          height: 18,
          borderRadius: "var(--r-pill)",
          background: value ? "var(--ok)" : "var(--border-2)",
          position: "relative",
          transition: "background 0.2s var(--ease)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: value ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s var(--ease)",
          }}
        />
      </span>
      {value ? "Active" : "Off"}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-1)",
  borderRadius: "var(--r-md)",
  color: "var(--fg-1)",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};
