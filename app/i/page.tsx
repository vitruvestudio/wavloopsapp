/**
 * /i — Click-through page for invite magic-links.
 *
 * Why this exists
 * ───────────────
 * The 'added to server' email embeds a Supabase
 * admin-generated magic-link URL as the CTA. That URL contains a
 * single-use OTP token in its query string. When the email lands
 * in a mailbox that auto-fetches every link for malware scanning
 * (Gmail, Outlook SafeLinks, corporate gateways…), the scanner
 * GETs the URL and Supabase verifies + burns the OTP. By the time
 * the recipient clicks, the token is already consumed and they
 * see 'Email link is invalid or has expired'.
 *
 * The fix: put a click-through page between the email and the
 * Supabase verify URL. The page is plain HTML on GET — the OTP
 * token sits inside a hidden form input, never inside a hyperlink
 * the scanner can follow. The recipient explicitly clicks
 * 'Continue', the form POSTs to /i/go, and the route redirects
 * (303) to Supabase. Scanners that don't POST forms can't burn
 * the token; only the recipient's deliberate click does.
 *
 * Anatomy:
 *   - GET /i?u=<encoded action_link> → renders the click-through.
 *   - POST /i/go { u } → 303 redirect to the action_link.
 *
 * Validation: /i/go re-checks that u is a Supabase project URL
 * (host ends with .supabase.co) before redirecting, so we don't
 * become an open redirector.
 */

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

interface PageProps {
  searchParams: Promise<{ u?: string }>;
}

export default async function InviteClickThroughPage({
  searchParams,
}: PageProps) {
  const { u } = await searchParams;

  // No URL → friendly empty state instead of a 404. Lets the
  // recipient at least click through to the marketing page.
  if (!u) {
    return (
      <FallbackShell
        title="This invite link is incomplete."
        body="The sign-in URL didn't come through. Ask the producer to re-send the invite from their server's Artists tab."
      />
    );
  }

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
        style={{ maxWidth: 440, width: "100%", gap: 28 }}
      >
        <Logo size={36} />

        <div className="flex flex-col" style={{ gap: 12 }}>
          <h1
            className="t-display"
            style={{
              fontSize: "clamp(28px, 3.4vw, 38px)",
              lineHeight: 1.08,
              letterSpacing: "-0.018em",
            }}
          >
            One click to your beats.
          </h1>
          <p
            className="t-body"
            style={{
              color: "var(--fg-2)",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            Press Continue to sign in and land on the server the producer just
            invited you to.
          </p>
        </div>

        {/* The token lives in this hidden input, not in a clickable
                anchor. Mail scanners that auto-fetch URLs to scan for
                malware will GET this page but won't submit the form,
                so the OTP stays unburnt until the recipient
                deliberately clicks Continue. */}
        <form
          method="POST"
          action="/i/go"
          style={{ width: "100%" }}
        >
          <input type="hidden" name="u" value={u} />
          <button
            type="submit"
            className="inline-flex items-center justify-center"
            style={{
              width: "100%",
              height: 48,
              background: "var(--accent)",
              color: "#fff",
              border: 0,
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.01em",
              cursor: "pointer",
              gap: 10,
              boxShadow:
                "0 18px 40px -16px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            Continue to sign in →
          </button>
        </form>

        <Link
          href="/"
          className="t-mono"
          style={{
            color: "var(--fg-3)",
            fontSize: 11,
            textDecoration: "none",
          }}
        >
          OR · BACK TO WAVLOOPS.CO
        </Link>
      </div>
    </main>
  );
}

function FallbackShell({ title, body }: { title: string; body: string }) {
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
        style={{ maxWidth: 440, gap: 24 }}
      >
        <Logo size={32} />
        <h1
          className="t-display"
          style={{
            fontSize: "clamp(24px, 3vw, 32px)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        <p
          className="t-body"
          style={{ color: "var(--fg-2)", fontSize: 14.5 }}
        >
          {body}
        </p>
        <Link
          href="/"
          className="t-mono"
          style={{ color: "var(--accent-text)", fontSize: 12 }}
        >
          BACK TO WAVLOOPS.CO →
        </Link>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Sign in — Wavloops",
};
