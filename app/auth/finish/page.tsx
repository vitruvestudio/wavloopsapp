/**
 * /auth/finish — implicit-flow callback for invite magic-links.
 *
 * Why this isn't /auth/callback
 * ─────────────────────────────
 * Our normal magic-link flow uses PKCE: the artist hits /auth,
 * submits the form, Supabase emails them a link with ?code=...
 * The /auth/callback route handler reads `code` server-side and
 * calls exchangeCodeForSession.
 *
 * Admin-generated magic-links (lib/auth/invite-link.ts → supabase
 * admin.generateLink({ type: 'magiclink' | 'invite' })) follow
 * the implicit flow instead. Supabase verifies the OTP and bounces
 * to redirect_to with the session tokens in the URL FRAGMENT:
 *
 *   https://wavloops.co/auth/finish?next=/listen/dish&as=artist
 *     #access_token=...&refresh_token=...&expires_in=...
 *
 * The fragment is never sent to the server. A route handler can't
 * see it. So we render a client page that reads window.location.hash,
 * calls supabase.auth.setSession({ access_token, refresh_token }),
 * mirrors /auth/callback's side effects (bind_artist_contacts), and
 * navigates to `next`.
 *
 * What the artist sees
 * ────────────────────
 * A black 'Signing you in…' screen for ~200ms. If the hash is
 * missing or setSession errors, the same screen flips to a
 * 'Couldn't sign you in' message with a button back to /auth so
 * they can request a fresh link.
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";

/** True for paths that stay on our origin. Mirrors the guard in
 *  /auth/callback so this finish flow can't be turned into an
 *  open redirector via a forged ?next. */
function isSafeRelativePath(p: string): boolean {
  if (typeof p !== "string" || p.length === 0 || p.length > 1024) return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("//") || p.startsWith("/\\")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(p)) return false;
  return true;
}

export default function AuthFinishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  // Re-entry guard. React 19 strict mode mounts effects twice in
  // dev; without this the setSession call fires twice and the
  // second one races the first.
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      // Parse the fragment Supabase appended to the URL.
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const hashError =
        params.get("error_description") ?? params.get("error");

      if (hashError) {
        setError(hashError);
        return;
      }
      if (!accessToken || !refreshToken) {
        setError(
          "This sign-in link didn't carry valid tokens. Request a fresh one from the producer.",
        );
        return;
      }

      const supabase = createClient();
      const { error: setErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setErr) {
        setError(setErr.message);
        return;
      }

      // Mirror /auth/callback's side effect — bind any existing
      // contact rows to the freshly-authed user so the artist
      // sees every server they were already invited to.
      try {
        await supabase.rpc("bind_artist_contacts");
      } catch (e) {
        console.warn("[auth/finish] bind_artist_contacts failed", e);
      }

      // Clear the hash so the tokens don't sit in the URL bar
      // after navigation (cosmetic + small XSS-via-hash hygiene).
      // history.replaceState is the only browser API that can
      // mutate location without a navigation.
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );

      const rawNext = searchParams.get("next");
      const next =
        rawNext && isSafeRelativePath(rawNext) ? rawNext : "/listen";

      // router.replace so the back button skips /auth/finish — the
      // artist shouldn't be able to bounce back to a consumed link.
      router.replace(next);
    })();
  }, [router, searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ maxWidth: 420, gap: 24 }}
      >
        <Logo size={32} />
        {error ? (
          <>
            <h1
              className="t-display"
              style={{
                fontSize: "clamp(24px, 3vw, 32px)",
                lineHeight: 1.1,
              }}
            >
              Couldn&apos;t sign you in.
            </h1>
            <p
              className="t-body"
              style={{ color: "var(--fg-2)", fontSize: 14.5 }}
            >
              {error}
            </p>
            <a
              href="/auth?as=artist"
              className="inline-flex items-center justify-center"
              style={{
                marginTop: 8,
                padding: "12px 22px",
                background: "var(--accent)",
                color: "#fff",
                borderRadius: "var(--r-md)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Request a fresh sign-in link →
            </a>
          </>
        ) : (
          <>
            <h1
              className="t-display"
              style={{
                fontSize: "clamp(22px, 2.8vw, 28px)",
                lineHeight: 1.1,
              }}
            >
              Signing you in…
            </h1>
            <p
              className="t-mono"
              style={{ color: "var(--fg-3)", fontSize: 11 }}
            >
              ONE SECOND
            </p>
          </>
        )}
      </div>
    </main>
  );
}
