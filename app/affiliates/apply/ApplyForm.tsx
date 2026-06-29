/**
 * Affiliate application form — client component.
 *
 * Pulls the invite_code out of the URL once on mount and threads
 * it through the server action so the action's own gate check
 * lines up with the page-level gate. useTransition for the
 * submitting spinner; a success card replaces the form once the
 * action returns ok:true so the user gets clear visual feedback
 * that the application landed.
 *
 * No validation library on purpose — every field is also re-
 * validated server-side so client checks are pure UX (faster
 * feedback). Keeping it light keeps the form bundle small.
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitAffiliateApplicationAction } from "./actions";

// Payouts are sent manually outside the app during the curated
// phase, so the dropdown only lists methods we can actually fund
// today: PayPal (most affiliates), Wise (international), bank
// transfer (EU SEPA / wire), or 'Other' as a free-form escape
// hatch. Stripe Connect is reserved for the auto-payout phase
// (Sprint 3) where the affiliate goes through KYC onboarding.
const PAYOUT_METHODS = [
  { value: "paypal", label: "PayPal" },
  { value: "wise", label: "Wise" },
  { value: "bank", label: "Bank transfer" },
  { value: "other", label: "Other" },
];

const AUDIENCE_PLATFORMS = [
  { value: "", label: "—" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X / Twitter" },
  { value: "tiktok", label: "TikTok" },
  { value: "mixed", label: "Mixed / multiple" },
];

export function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite_code") ?? "";
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitAffiliateApplicationAction(
        inviteCode,
        fd,
      );
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      // Account is auto-approved at this point. Flip to the
      // success card briefly so the user reads "you're in" before
      // we punch them through to the dashboard. The dashboard
      // itself will redirect to /auth?next=/affiliate-dashboard
      // if they're not signed in (or land on the cockpit if they
      // already are).
      setDone(true);
      window.setTimeout(() => {
        router.push("/affiliate-dashboard");
      }, 1600);
    });
  };

  if (done) {
    return (
      <div
        style={{
          padding: "40px 28px",
          borderRadius: "var(--r-lg)",
          background:
            "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
          border:
            "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
          textAlign: "center",
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
          YOU&rsquo;RE IN
        </span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 32,
            lineHeight: 1.05,
            letterSpacing: "-0.018em",
            margin: "16px 0 12px",
          }}
        >
          Welcome to the program.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--fg-3)",
            margin: "0 0 18px",
          }}
        >
          Your affiliate account is live. We just sent your share
          link + dashboard URL to your inbox. Redirecting you to
          your dashboard…
        </p>
        <div
          aria-hidden
          style={{
            width: 18,
            height: 18,
            margin: "0 auto",
            borderRadius: "50%",
            border: "1.5px solid var(--accent-text)",
            borderTopColor: "transparent",
            animation: "wlpApplySpin 0.8s linear infinite",
          }}
        />
        <style>{`
          @keyframes wlpApplySpin {
            from { transform: rotate(0); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-lg)",
        padding: 28,
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
          label="Your name"
          placeholder="Mike Johnson"
          required
        />
        <Field
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </Row>

      <Row>
        <Field
          name="handle"
          label="Your handle (will be ?ref=handle)"
          placeholder="prodbymike"
          required
          hint="2-32 chars · letters, digits, dashes"
        />
        <Select
          name="payout_method"
          label="Payout method"
          options={PAYOUT_METHODS}
          required
        />
      </Row>

      <Row>
        <Field
          name="payout_email"
          label="Payout email (optional)"
          type="email"
          placeholder="you@paypal.com"
          hint="Where we send the money. Leave blank to use your sign-in email."
        />
        <Select
          name="audience_platform"
          label="Main audience platform"
          options={AUDIENCE_PLATFORMS}
        />
      </Row>

      <Field
        name="audience_size"
        label="Approx audience size (optional)"
        placeholder="12 000"
        hint="Combined across platforms — helps us calibrate."
      />

      <Textarea
        name="application_note"
        label="Tell us about yourself"
        placeholder="Who you are, what you do, where your producer audience hangs out, and why Wavloops fits."
        hint="2-3 sentences is plenty."
      />

      <button
        type="submit"
        disabled={pending}
        className="t-mono"
        style={{
          marginTop: 10,
          padding: "14px 24px",
          borderRadius: "var(--r-pill)",
          background: pending ? "var(--bg-3)" : "var(--accent)",
          color: "#fff",
          border: "none",
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          cursor: pending ? "wait" : "pointer",
          boxShadow: pending
            ? "none"
            : "0 0 30px -8px var(--accent-glow)",
        }}
      >
        {pending ? "Submitting…" : "Submit application →"}
      </button>

      <p
        className="t-mono-s"
        style={{ color: "var(--fg-4)", textAlign: "center" }}
      >
        We review every application manually. Expect a reply within
        48 h.
      </p>
    </form>
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
  required,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        required={required}
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
  options,
  required,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
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
        {required && (
          <option value="" disabled>
            Pick one…
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  name,
  label,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label htmlFor={name} hint={hint}>
        {label}
      </Label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        rows={5}
        style={{
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          color: "var(--fg-1)",
          fontFamily: "var(--font-body)",
          fontSize: 14.5,
          outline: "none",
          resize: "vertical",
          minHeight: 120,
        }}
      />
    </div>
  );
}
