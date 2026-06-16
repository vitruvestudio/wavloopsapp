/**
 * MagicLinkScreen — passwordless artist sign-in form.
 *
 * Visual is the artist counterpart to the producer AuthScreen —
 * same split-screen anatomy (left brand panel hidden under
 * 900px, right form on a centred card) so producers and artists
 * land on surfaces that read as the same product. Copy and form
 * shape differ: no password, no signup mode, just an email field
 * and a "Send me a link" submit.
 *
 * State flow
 * ──────────
 *   1. Default: render the form. Submit fires
 *      signInWithMagicLinkAction; on success the action redirects
 *      to /auth/magic?sent=1&email=<x>.
 *   2. ?sent=1 hits this same component as `sent` → render the
 *      success state ("Check <email>") with a "Use a different
 *      email" link back to step 1.
 *   3. The callback bounces invalid links back here with ?error,
 *      pre-filled in `initialError`.
 */

"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import {
  signInWithMagicLinkAction,
  type AuthState,
} from "../actions";

interface MagicLinkScreenProps {
  sent: boolean;
  sentEmail: string;
  initialError: string;
  next: string;
}

export function MagicLinkScreen({
  sent,
  sentEmail,
  initialError,
  next,
}: MagicLinkScreenProps) {
  const [state, formAction, pending] = useActionState<
    AuthState | null,
    FormData
  >(
    signInWithMagicLinkAction,
    initialError ? { error: initialError } : null,
  );

  return (
    <div className="flex min-h-[100dvh] bg-bg-0">
      {/* ============================================================
          LEFT brand panel — hidden under 900px
         ============================================================ */}
      <div className="relative hidden flex-1 overflow-hidden border-r border-border-1 min-[900px]:block">
        {/* Radial accent glow */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(80% 60% at 25% 20%, var(--accent-surface), transparent 60%)",
          }}
        />
        {/* Diagonal hatch */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, var(--fg-1) 0 1px, transparent 1px 12px)",
          }}
        />
        <div
          className="relative flex h-full flex-col"
          style={{ padding: "44px 48px" }}
        >
          <Logo size={36} />
          <div
            className="flex-1 flex flex-col justify-center"
            style={{ maxWidth: 440 }}
          >
            <h1
              className="t-display"
              style={{
                fontSize: "clamp(40px, 5vw, 56px)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                color: "var(--fg-1)",
                marginBottom: 18,
              }}
            >
              Your producers,
              <br />
              one inbox.
            </h1>
            <p
              className="t-body"
              style={{ color: "var(--fg-3)", fontSize: 16, lineHeight: 1.55 }}
            >
              Listen, like, and leave notes on every beat producers send
              you — without juggling drives, links, or DMs.
            </p>
            <div
              className="t-mono-s"
              style={{
                color: "var(--accent-text)",
                marginTop: 32,
                letterSpacing: "0.14em",
              }}
            >
              FOR ARTISTS · V1
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          RIGHT form / success
         ============================================================ */}
      <div className="flex flex-1 items-center justify-center">
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            padding: 28,
          }}
        >
          {sent && sentEmail ? (
            <SentState email={sentEmail} />
          ) : (
            <FormState
              formAction={formAction}
              state={state}
              pending={pending}
              next={next}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FormState — email field + submit.
   ============================================================ */

function FormState({
  formAction,
  state,
  pending,
  next,
}: {
  formAction: (formData: FormData) => void;
  state: AuthState | null;
  pending: boolean;
  next: string;
}) {
  return (
    <>
      <div
        className="t-mono-s"
        style={{
          color: "var(--accent-text)",
          letterSpacing: "0.14em",
          marginBottom: 10,
        }}
      >
        ARTIST SIGN-IN
      </div>
      <h1
        className="t-h1"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(28px, 4vw, 36px)",
          letterSpacing: "-0.02em",
          color: "var(--fg-1)",
          margin: 0,
          marginBottom: 10,
        }}
      >
        Get a sign-in link
      </h1>
      <p
        className="t-body"
        style={{ color: "var(--fg-3)", marginBottom: 24 }}
      >
        Drop your email — we&apos;ll send you a one-tap link. No
        password to remember.
      </p>

      <form action={formAction} className="flex flex-col" style={{ gap: 14 }}>
        <input type="hidden" name="next" value={next} />
        <Field
          label="EMAIL"
          icon="mail"
          name="email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          required
        />
        {state?.error && (
          <div
            className="t-body-s"
            style={{
              color: "var(--danger)",
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              background: "var(--danger-surface)",
            }}
          >
            {state.error}
          </div>
        )}
        <Button type="submit" size="lg" disabled={pending} icon="arrow-right">
          {pending ? "Sending…" : "Send me a link"}
        </Button>
      </form>

      <div
        className="t-mono-s"
        style={{
          color: "var(--fg-4)",
          marginTop: 28,
          textAlign: "center",
          letterSpacing: "0.08em",
        }}
      >
        ARE YOU A PRODUCER?{" "}
        <a
          href="/auth"
          style={{ color: "var(--accent-text)", textDecoration: "none" }}
        >
          LOG IN HERE
        </a>
      </div>
    </>
  );
}

/* ============================================================
   SentState — "Check your inbox" confirmation.
   ============================================================ */

function SentState({ email }: { email: string }) {
  return (
    <div className="text-center">
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
        <Icon name="mail" size={28} />
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
        Check your inbox
      </h1>
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
      <p
        className="t-body-s"
        style={{ color: "var(--fg-4)", marginBottom: 20 }}
      >
        The link expires in 60&nbsp;minutes. Nothing arrived?
        Double-check spam, or use a different email.
      </p>
      <a
        href="/auth/magic"
        className="t-mono-s"
        style={{
          color: "var(--accent-text)",
          letterSpacing: "0.08em",
          textDecoration: "none",
        }}
      >
        ← USE A DIFFERENT EMAIL
      </a>
    </div>
  );
}
