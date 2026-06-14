/**
 * AuthScreen — split-screen producer auth entry.
 *
 * Pixel-ported from prototype `screens_producer_a.jsx`:
 *
 *   ┌─ LEFT (hidden < 900px) ─────────┬─ RIGHT (form) ─────────────┐
 *   │  Logo                            │  WELCOME BACK              │
 *   │                                  │  Log in to Wavloops        │
 *   │  Your beats,                     │                            │
 *   │  a living link.                  │  EMAIL                     │
 *   │  (display 52, line 0.98)         │  [you@studio.com........]  │
 *   │  Drop beats into shareable…      │  PASSWORD                  │
 *   │  (body-l max-w 380)              │  [••••••••..............]  │
 *   │                                  │                            │
 *   │  FOR PRODUCERS · V1              │  [    Log in    ]   lg     │
 *   │                                  │  ─── OR ───                │
 *   │  Radial accent surface 25%/20%   │  [ Continue with Google ]  │
 *   │  + diagonal hatch lines 60°      │  No account yet? Sign up   │
 *   └──────────────────────────────────┴────────────────────────────┘
 *
 * Wiring status (V1 J2):
 *   - Form submit: redirects to `/dashboard` for now. Real Supabase auth
 *     lands in the next commit (signUp / signIn / OAuth + middleware).
 *   - Google button: disabled. We'll re-enable when Supabase OAuth is
 *     configured (Google Cloud project + redirect URL).
 *   - Toggle login/signup is local state only.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";

type Mode = "login" | "signup";

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("login");
  const isLogin = mode === "login";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // V1 stub — Supabase signIn/signUp lands in the next commit.
    // After wiring: signup → /onboarding, login → /dashboard.
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[100dvh] bg-bg-0">
      {/* ============================================================
          LEFT brand panel — hidden under 900px wide
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
        {/* Diagonal hatch pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "repeating-linear-gradient(60deg, transparent 0 9px, oklch(1 0 0 / 0.025) 9px 10px)",
          }}
        />

        {/* Content stack — Logo top, headline+sub middle-anchored bottom,
            kicker bottom. Proto uses justify-between to spread vertically. */}
        <div
          className="relative flex h-full flex-col justify-between"
          style={{ padding: "52px 56px" }}
        >
          <Logo size={30} />

          <div>
            <h1
              className="t-display"
              style={{ fontSize: 52, lineHeight: 0.98, marginBottom: 22 }}
            >
              Your beats,
              <br />a living link.
            </h1>
            <p className="t-body-l" style={{ maxWidth: 380 }}>
              Drop beats into shareable servers. Send one link — capture every
              contact and see who listens, in real time.
            </p>
          </div>

          <div className="t-mono-s" style={{ color: "var(--fg-4)" }}>
            FOR PRODUCERS · V1
          </div>
        </div>
      </div>

      {/* ============================================================
          RIGHT form panel
         ============================================================ */}
      <div
        className="flex flex-1 items-center justify-center"
        style={{ padding: 32 }}
      >
        <form
          onSubmit={onSubmit}
          className="w-full"
          style={{ maxWidth: 380 }}
        >
          {/* Heading */}
          <div style={{ marginBottom: 30 }}>
            <div
              className="t-mono-s"
              style={{ color: "var(--accent-text)", marginBottom: 12 }}
            >
              {isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}
            </div>
            <h2 className="t-h1" style={{ fontSize: 30 }}>
              {isLogin ? "Log in to Wavloops" : "Start sharing beats"}
            </h2>
          </div>

          {/* Fields + submit */}
          <div className="flex flex-col" style={{ gap: 14 }}>
            <Field
              label="EMAIL"
              type="email"
              name="email"
              placeholder="you@studio.com"
              autoComplete="email"
              required
            />
            <Field
              label="PASSWORD"
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
            <Button type="submit" size="lg" full style={{ marginTop: 6 }}>
              {isLogin ? "Log in" : "Create account"}
            </Button>
          </div>

          {/* OR divider */}
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

          {/* Google — disabled until Supabase OAuth is wired (V1 next commit) */}
          <Button
            type="button"
            variant="secondary"
            full
            disabled
            title="Google sign-in — available soon"
          >
            Continue with Google
          </Button>

          {/* Mode toggle */}
          <div
            className="t-body"
            style={{ textAlign: "center", marginTop: 26 }}
          >
            {isLogin ? "No account yet? " : "Already have one? "}
            <button
              type="button"
              onClick={() => setMode(isLogin ? "signup" : "login")}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{
                color: "var(--accent-text)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
