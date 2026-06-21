/**
 * Shared chrome for every /legal/* page.
 *
 * Renders:
 *   - A minimal top bar: Wavloops logo (link back to /) + a
 *     'Back to wavloops.co' chip.
 *   - Title block: kicker ('Legal'), big title, last-updated
 *     mono date.
 *   - The page's content slot, typographically opinionated so
 *     each consumer just writes plain JSX (h2/h3/p/ul/ol/a)
 *     and gets a consistent reading rhythm without per-page
 *     styling.
 *   - A footer line: 'Built by Vitruve. Wavloops, beat sharing
 *     for producers.'
 *
 * Centred layout, max-width 760 — narrow enough that long
 * paragraphs stay readable at 16 px / 1.7.
 *
 * Consumers pass a `title` + `lastUpdated` and the body as
 * children. The body's inline JSX inherits the typography
 * scope via the `legal-prose` className declared inline below.
 */

import * as React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";

interface LegalShellProps {
  title: string;
  /** Display string, e.g. 'June 21, 2026'. Falls under the
   *  title in mono so a returning reader can spot revisions. */
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalShell({ title, lastUpdated, children }: LegalShellProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-0)",
      }}
    >
      {/* ── Top bar ─────────────────────────────────────── */}
      <header
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: 1080 }}
        >
          <Link
            href="/"
            aria-label="Back to Wavloops"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <Logo size={26} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center transition-colors"
            style={{
              gap: 6,
              padding: "8px 12px",
              borderRadius: "var(--r-pill)",
              background: "var(--bg-1)",
              border: "1px solid var(--border-1)",
              color: "var(--fg-2)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              textDecoration: "none",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <Icon name="arrow-right" size={12} style={{ transform: "rotate(180deg)" }} />
            wavloops.co
          </Link>
        </div>
      </header>

      {/* ── Title block ───────────────────────────────────── */}
      <div style={{ padding: "clamp(40px, 6vw, 72px) 24px clamp(20px, 3vw, 32px)" }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <span
            className="t-mono"
            style={{
              color: "var(--accent-text)",
              display: "block",
              marginBottom: 12,
            }}
          >
            Legal
          </span>
          <h1
            className="t-display"
            style={{
              fontSize: "clamp(32px, 4.4vw, 52px)",
              lineHeight: 1.06,
              letterSpacing: "-0.018em",
              marginBottom: 14,
            }}
          >
            {title}
          </h1>
          <p
            className="t-mono"
            style={{ color: "var(--fg-4)" }}
          >
            Last updated · {lastUpdated}
          </p>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <article
        className="legal-prose mx-auto"
        style={{
          maxWidth: 760,
          padding: "16px 24px 96px",
        }}
      >
        {children}
      </article>

      {/* ── Bottom strip ─────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-1)",
          padding: "24px",
          backgroundColor: "var(--bg-inset)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between flex-wrap"
          style={{ maxWidth: 1080, gap: 16 }}
        >
          <span className="t-mono" style={{ color: "var(--fg-4)" }}>
            © 2026 Wavloops · Built by Vitruve Studio
          </span>
          <div className="flex items-center" style={{ gap: 18 }}>
            <LegalCrossLink href="/legal/terms" label="Terms" />
            <LegalCrossLink href="/legal/privacy" label="Privacy" />
            <LegalCrossLink href="/legal/refunds" label="Refunds" />
            <LegalCrossLink href="/legal/cookies" label="Cookies" />
            <LegalCrossLink href="/legal/legal-notice" label="Legal Notice" />
          </div>
        </div>
      </footer>

      {/* Typography scope — keeps every legal page consistent
              without each one importing its own class soup. */}
      <style>{`
        .legal-prose {
          color: var(--fg-2);
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.7;
        }
        .legal-prose h2 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 22px;
          line-height: 1.2;
          letter-spacing: -0.012em;
          color: var(--fg-1);
          margin-top: 44px;
          margin-bottom: 12px;
        }
        .legal-prose h2:first-child {
          margin-top: 0;
        }
        .legal-prose h3 {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 16px;
          color: var(--fg-1);
          margin-top: 24px;
          margin-bottom: 8px;
        }
        .legal-prose p {
          margin-bottom: 14px;
        }
        .legal-prose strong {
          color: var(--fg-1);
          font-weight: 600;
        }
        .legal-prose ul, .legal-prose ol {
          margin: 0 0 18px 0;
          padding-left: 22px;
        }
        .legal-prose li {
          margin-bottom: 8px;
        }
        .legal-prose ul li {
          list-style: disc;
        }
        .legal-prose ol li {
          list-style: decimal;
        }
        .legal-prose a {
          color: var(--accent-text);
          text-decoration: none;
          border-bottom: 1px solid color-mix(in oklch, var(--accent-text) 35%, transparent);
          transition: border-color 0.15s var(--ease);
        }
        .legal-prose a:hover {
          border-bottom-color: var(--accent-text);
        }
        .legal-prose hr {
          margin: 32px 0;
          border: 0;
          height: 1px;
          background: var(--border-1);
        }
        .legal-prose .legal-callout {
          padding: 16px 18px;
          background: var(--bg-1);
          border: 1px solid var(--border-1);
          border-radius: var(--r-md);
          margin: 18px 0;
          font-size: 14.5px;
        }
      `}</style>
    </main>
  );
}

function LegalCrossLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        color: "var(--fg-3)",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        textDecoration: "none",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </Link>
  );
}
