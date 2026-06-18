/**
 * AuthScreen — unified entry for Producer + Artist.
 *
 * Three states driven by URL search params + local navigation:
 *
 *   1. CHOOSE  (default / no ?as)
 *      Split-screen with brand-left, 2 Producer/Artist cards on
 *      the right. Click a card → push to `?as=producer|artist`
 *      which flips to the EMAIL state.
 *
 *   2. EMAIL   (?as=producer or ?as=artist)
 *      Same split-screen, the right column swaps to a single
 *      email input + Google OAuth button. Submit fires
 *      requestMagicLinkAction with the chosen role baked in.
 *
 *   3. SENT    (?sent=1)
 *      Success card "Check your inbox". Shown after the magic-
 *      link has been requested. If ?requested=1 (came from gate
 *      flow), copy adapts to "Request submitted".
 *
 * Drop entirely: password fields, signInAction / signUpAction.
 * The whole flow is now passwordless.
 */

"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import {
  requestMagicLinkAction,
  signInWithGoogleAction,
  type AuthRole,
  type AuthState,
} from "./actions";

export interface AuthScreenProps {
  /** Pre-selected role from URL (?as=). null → render the CHOOSE
   *  step with the 2 cards. */
  initialRole: AuthRole | null;
  /** True when ?sent=1 — show the SentState card. */
  sent: boolean;
  /** Email echoed back from the magic-link request, used in the
   *  SentState copy. */
  sentEmail: string;
  /** True when the user came in via gate-flow magic-link. Tweaks
   *  the SentState copy to "Request submitted". */
  requested: boolean;
  /** Optional next path the callback should bounce to after the
   *  magic-link is exchanged. */
  next: string;
  /** Error pre-populated from a failed callback round-trip (e.g.
   *  expired link). */
  initialError: string;
}

export function AuthScreen({
  initialRole,
  sent,
  sentEmail,
  requested,
  next,
  initialError,
}: AuthScreenProps) {
  const router = useRouter();

  // Decide which step to render. SENT wins (it's the post-submit
  // confirmation), then EMAIL (a role is set), else CHOOSE.
  const step: "choose" | "email" | "sent" = sent
    ? "sent"
    : initialRole
      ? "email"
      : "choose";

  const setRole = (r: AuthRole) => {
    const qs = new URLSearchParams();
    qs.set("as", r);
    if (next) qs.set("next", next);
    router.push(`/auth?${qs.toString()}`);
  };

  const goBackToChoose = () => {
    router.push("/auth");
  };

  return (
    <div className="flex min-h-[100dvh] bg-bg-0">
      {/* ============================================================
          LEFT brand panel — hidden under 900px
         ============================================================ */}
      <BrandPanel role={initialRole} />

      {/* ============================================================
          RIGHT — choose / email / sent
         ============================================================ */}
      <div
        className="flex flex-1 items-center justify-center"
        style={{ padding: 32 }}
      >
        {step === "choose" && <ChooseRole onPick={setRole} />}
        {step === "email" && initialRole && (
          <EmailStep
            role={initialRole}
            next={next}
            initialError={initialError}
            onBack={goBackToChoose}
          />
        )}
        {step === "sent" && (
          <SentState
            email={sentEmail}
            requested={requested}
            onReset={goBackToChoose}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   BrandPanel — left column. Copy adapts to the chosen role
   so Producer sees "Your beats, a living link." and Artist
   sees "Your producers, one inbox.".
   ============================================================ */

function BrandPanel({ role }: { role: AuthRole | null }) {
  // No role yet → default to the producer pitch (main audience).
  // Once the user picks Artist, copy adapts so they feel addressed.
  const copy =
    role === "artist"
      ? {
          kicker: "FOR ARTISTS",
          h1: (
            <>
              Your producers,
              <br />
              one inbox.
            </>
          ),
          sub:
            "Listen, like, and leave notes on every pack producers send you — without juggling drives, links, or DMs.",
        }
      : {
          kicker: "FOR PRODUCERS",
          h1: (
            <>
              Your beats,
              <br />a living link.
            </>
          ),
          sub:
            "Drop beats into shareable servers. Send one link — capture every contact and see who listens, in real time.",
        };

  return (
    <div className="relative hidden flex-1 overflow-hidden border-r border-border-1 min-[900px]:block">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(80% 60% at 25% 20%, var(--accent-surface), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(60deg, transparent 0 9px, oklch(1 0 0 / 0.025) 9px 10px)",
        }}
      />
      <div
        className="relative flex h-full flex-col justify-between"
        style={{ padding: "52px 56px" }}
      >
        <Logo size={30} />
        <div>
          <h1
            className="t-display"
            style={{
              fontSize: "clamp(40px, 5vw, 52px)",
              lineHeight: 0.98,
              marginBottom: 22,
            }}
          >
            {copy.h1}
          </h1>
          <p className="t-body-l" style={{ maxWidth: 380 }}>
            {copy.sub}
          </p>
        </div>
        <div className="t-mono-s" style={{ color: "var(--fg-4)" }}>
          {copy.kicker} · V1
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ChooseRole — 2 cards Producer / Artist.
   This is the "pro" entry point: explicit, B2B-clean, no copy
   ambiguity. The third "Both" path is reached AFTER signup via
   Settings → Account → Add other mode.
   ============================================================ */

function ChooseRole({ onPick }: { onPick: (r: AuthRole) => void }) {
  return (
    <div style={{ width: "100%", maxWidth: 460 }}>
      <div style={{ marginBottom: 32 }}>
        <div
          className="t-mono-s"
          style={{ color: "var(--accent-text)", marginBottom: 12 }}
        >
          GET STARTED
        </div>
        <h2 className="t-h1" style={{ fontSize: 30 }}>
          How will you use Wavloops?
        </h2>
      </div>

      <div className="flex flex-col" style={{ gap: 14 }}>
        <RoleCard
          icon="library"
          role="producer"
          title="I make beats"
          body="Share packs with the artists I work with. See who listens, who likes, who leaves notes."
          onClick={() => onPick("producer")}
        />
        <RoleCard
          icon="play"
          role="artist"
          title="I pick beats for my project"
          body="Get packs from producers you trust. Listen, save your favorites, send back feedback."
          onClick={() => onPick("artist")}
        />
      </div>

      <div
        className="t-body"
        style={{ textAlign: "center", marginTop: 26, color: "var(--fg-3)" }}
      >
        Already on Wavloops?{" "}
        <button
          type="button"
          onClick={() => onPick("producer")}
          className="cursor-pointer border-0 bg-transparent p-0"
          style={{
            color: "var(--accent-text)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  role: _role,
  title,
  body,
  onClick,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  role: AuthRole;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left border border-border-1 hover:border-fg-4 transition-colors duration-fast cursor-pointer"
      style={{
        background: "var(--bg-1)",
        borderRadius: "var(--r-lg)",
        padding: "22px 24px",
      }}
    >
      <div className="flex items-start" style={{ gap: 18 }}>
        <div
          className="shrink-0 inline-flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--r-md)",
            background: "var(--accent-surface)",
            color: "var(--accent-text)",
          }}
        >
          <Icon name={icon} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 17,
              color: "var(--fg-1)",
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <p
            className="t-body-s"
            style={{ color: "var(--fg-3)", lineHeight: 1.5, margin: 0 }}
          >
            {body}
          </p>
        </div>
        <Icon
          name="chevron-right"
          size={18}
          style={{ color: "var(--fg-4)", marginTop: 12 }}
        />
      </div>
    </button>
  );
}

/* ============================================================
   EmailStep — single email field + Google OAuth.
   Tied to the role chosen on the previous screen. Submit fires
   requestMagicLinkAction with the role embedded so the callback
   knows which onboarding to route to on first login.
   ============================================================ */

function EmailStep({
  role,
  next,
  initialError,
  onBack,
}: {
  role: AuthRole;
  next: string;
  initialError: string;
  onBack: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    AuthState | null,
    FormData
  >(
    requestMagicLinkAction,
    initialError ? { error: initialError } : null,
  );
  const [googleState, googleAction, googlePending] = useActionState<
    AuthState | null,
    FormData
  >(signInWithGoogleAction, null);

  const isProducer = role === "producer";

  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <button
        type="button"
        onClick={onBack}
        className="t-mono-s inline-flex items-center cursor-pointer border-0 bg-transparent p-0"
        style={{
          color: "var(--fg-3)",
          letterSpacing: "0.08em",
          gap: 6,
          marginBottom: 22,
        }}
      >
        <Icon name="chevron-left" size={13} />
        BACK
      </button>

      <div style={{ marginBottom: 26 }}>
        <div
          className="t-mono-s"
          style={{ color: "var(--accent-text)", marginBottom: 10 }}
        >
          {isProducer ? "FOR PRODUCERS" : "FOR ARTISTS"}
        </div>
        <h2 className="t-h1" style={{ fontSize: 30 }}>
          {isProducer ? "Share your beats" : "Pick your beats"}
        </h2>
        <p
          className="t-body"
          style={{ color: "var(--fg-3)", marginTop: 12, lineHeight: 1.55 }}
        >
          Drop your email — we&apos;ll send you a one-tap sign-in link.
          No password to remember.
        </p>
      </div>

      <form action={formAction} className="flex flex-col" style={{ gap: 14 }}>
        <input type="hidden" name="role" value={role} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          label="EMAIL"
          icon="mail"
          name="email"
          type="email"
          placeholder="you@studio.com"
          autoComplete="email"
          required
        />
        {state?.error && (
          <div
            role="alert"
            className="t-body-s"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--r-sm)",
              background: "var(--danger-surface)",
              color: "var(--danger)",
              border: "1px solid var(--danger)",
              lineHeight: 1.4,
            }}
          >
            {state.error}
          </div>
        )}
        <Button
          type="submit"
          size="lg"
          full
          disabled={pending}
          icon="arrow-right"
        >
          {pending ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>

      <div
        className="flex items-center"
        style={{ gap: 12, margin: "22px 0" }}
      >
        <div
          className="flex-1"
          style={{ height: 1, background: "var(--border-1)" }}
        />
        <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
          OR
        </span>
        <div
          className="flex-1"
          style={{ height: 1, background: "var(--border-1)" }}
        />
      </div>

      <form action={googleAction}>
        <input type="hidden" name="role" value={role} />
        {next && <input type="hidden" name="next" value={next} />}
        <Button
          type="submit"
          variant="secondary"
          full
          disabled={googlePending}
        >
          {googlePending ? "Redirecting…" : "Continue with Google"}
        </Button>
        {googleState?.error && (
          <div
            role="alert"
            className="t-body-s"
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: "var(--r-sm)",
              background: "var(--danger-surface)",
              color: "var(--danger)",
              lineHeight: 1.4,
            }}
          >
            {googleState.error}
          </div>
        )}
      </form>

      <div
        className="t-mono-s"
        style={{
          textAlign: "center",
          marginTop: 28,
          color: "var(--fg-4)",
          letterSpacing: "0.08em",
        }}
      >
        {isProducer ? "PICKING BEATS INSTEAD?" : "MAKING BEATS INSTEAD?"}{" "}
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer border-0 bg-transparent p-0"
          style={{
            color: "var(--accent-text)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.08em",
          }}
        >
          SWITCH
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SentState — "Check your inbox" confirmation.
   Reused for both standard magic-link flow and gate-flow
   ("Request submitted" framing when ?requested=1).
   ============================================================ */

function SentState({
  email,
  requested,
  onReset,
}: {
  email: string;
  requested: boolean;
  onReset: () => void;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
      <div
        className="inline-flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          background: "var(--accent-surface)",
          color: "var(--accent-text)",
          margin: "0 auto 18px",
        }}
      >
        <Icon name={requested ? "check" : "mail"} size={28} />
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(26px, 4vw, 32px)",
          letterSpacing: "-0.02em",
          color: "var(--fg-1)",
          margin: 0,
          marginBottom: 10,
        }}
      >
        {requested ? "Request submitted" : "Check your inbox"}
      </h1>
      {requested ? (
        <p
          className="t-body"
          style={{
            color: "var(--fg-3)",
            marginBottom: 18,
            lineHeight: 1.55,
          }}
        >
          Your access request was sent to the producer. To finalize,{" "}
          <strong style={{ color: "var(--fg-1)" }}>
            confirm your email
          </strong>{" "}
          by clicking the sign-in link we just sent to{" "}
          <strong style={{ color: "var(--fg-1)" }}>{email}</strong>.
          You&apos;ll get notified once they approve.
        </p>
      ) : (
        <p
          className="t-body"
          style={{
            color: "var(--fg-3)",
            marginBottom: 18,
            lineHeight: 1.55,
          }}
        >
          We sent a sign-in link to{" "}
          <strong style={{ color: "var(--fg-1)" }}>{email}</strong>. Tap
          it on this device to land back in Wavloops.
        </p>
      )}
      <p
        className="t-body-s"
        style={{ color: "var(--fg-4)", marginBottom: 20 }}
      >
        The link expires in 60&nbsp;minutes. Nothing arrived?
        Double-check spam, or use a different email.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="t-mono-s cursor-pointer border-0 bg-transparent p-0"
        style={{
          color: "var(--accent-text)",
          letterSpacing: "0.08em",
        }}
      >
        ← USE A DIFFERENT EMAIL
      </button>
    </div>
  );
}
