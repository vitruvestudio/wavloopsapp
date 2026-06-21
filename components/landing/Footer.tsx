/**
 * Landing — Footer.
 *
 * Two zones:
 *   - Top: brand column (Logo + tagline + socials + status pill)
 *     and three nav columns (Product / Company / Legal).
 *   - Bottom: hairline divider, copyright line, and a small
 *     'Built by Vitruve' attribution.
 *
 * Mobile collapses the four columns into a single stack so
 * everything reads in scroll order. Anchors point at the
 * landing sections we already shipped (#how-it-works,
 * #pricing, #faq); legal links target /legal/* — those routes
 * can land later as placeholder pages without changing the
 * footer markup.
 */

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Sign in", href: "/auth" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "mailto:contact@wavloops.co" },
      { label: "Status", href: "https://status.wavloops.co", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Refund policy", href: "/legal/refunds" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Legal notice", href: "/legal/legal-notice" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer
      className="relative"
      style={{
        paddingTop: "clamp(64px, 8vw, 96px)",
        paddingBottom: "clamp(32px, 4vw, 48px)",
        backgroundColor: "var(--bg-inset)",
        borderTop: "1px solid var(--border-1)",
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        {/* TOP — brand on the left, three nav columns on the
                right. Mobile collapses both into a single stack
                via grid-cols-1; md+ uses a 1fr / 2fr split so the
                three nav columns share the right half evenly. */}
        <div
          className="grid grid-cols-1 md:grid-cols-[1fr_2fr]"
          style={{ gap: "clamp(36px, 4vw, 64px)" }}
        >
          <BrandBlock />
          <div
            className="grid grid-cols-2 md:grid-cols-3"
            style={{ gap: "clamp(24px, 3vw, 40px)" }}
          >
            {COLUMNS.map((col) => (
              <NavColumn key={col.title} column={col} />
            ))}
          </div>
        </div>

        {/* BOTTOM — divider + copyright */}
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: "var(--border-1)",
            margin: "clamp(40px, 5vw, 64px) 0 24px",
          }}
        />
        <div
          className="flex items-center justify-between flex-wrap"
          style={{ gap: 16 }}
        >
          <span
            className="t-mono"
            style={{ color: "var(--fg-4)" }}
          >
            © 2026 Wavloops · Built by{" "}
            <a
              href="https://vitruve.studio"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--fg-3)",
                textDecoration: "none",
                borderBottom: "1px solid color-mix(in oklch, var(--fg-3) 30%, transparent)",
              }}
            >
              Vitruve Studio
            </a>
          </span>
          <span
            className="t-mono"
            style={{ color: "var(--fg-4)" }}
          >
            Made in France · Powered by Stripe + Supabase
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Brand block — Logo + tagline + socials + status pill
   ============================================================ */

function BrandBlock() {
  return (
    <div className="flex flex-col" style={{ gap: 20, maxWidth: 360 }}>
      <Logo size={32} />
      <p
        className="t-body"
        style={{
          color: "var(--fg-3)",
          fontSize: 14,
          lineHeight: 1.55,
          maxWidth: 320,
        }}
      >
        One link for your beats. One catalog for your artists. One dashboard
        for everything that&apos;s working.
      </p>

      {/* Socials */}
      <div className="flex items-center" style={{ gap: 8 }}>
        <SocialIcon name="instagram" href="https://instagram.com/wavloops" label="Instagram" />
        <SocialIcon name="x-logo" href="https://x.com/wavloops" label="X / Twitter" />
        <SocialIcon name="youtube" href="https://youtube.com/@wavloops" label="YouTube" />
        <SocialIcon name="mail" href="mailto:contact@wavloops.co" label="Email" />
      </div>

      {/* Status pill */}
      <a
        href="https://status.wavloops.co"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
        style={{
          alignSelf: "flex-start",
          gap: 8,
          padding: "6px 12px",
          borderRadius: "var(--r-pill)",
          background: "var(--ok-surface)",
          border: "1px solid color-mix(in oklch, var(--ok) 25%, transparent)",
          color: "var(--ok)",
          textDecoration: "none",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "var(--r-pill)",
            background: "var(--ok)",
            ["--wl-pulse-color" as string]: "var(--ok)",
            animation: "wl-pulse-dot 1.6s ease-out infinite",
          }}
        />
        <span className="t-mono" style={{ fontSize: 10 }}>
          All systems operational
        </span>
      </a>
    </div>
  );
}

function SocialIcon({
  name,
  href,
  label,
}: {
  name: Parameters<typeof Icon>[0]["name"];
  href: string;
  label: string;
}) {
  const isMail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      aria-label={label}
      className="flex items-center justify-center transition-all"
      style={{
        width: 36,
        height: 36,
        borderRadius: "var(--r-md)",
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        color: "var(--fg-2)",
        textDecoration: "none",
        transitionDuration: "var(--dur)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <Icon name={name} size={16} />
    </a>
  );
}

/* ============================================================
   Nav column
   ============================================================ */

function NavColumn({ column }: { column: FooterColumn }) {
  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <span
        className="t-mono"
        style={{
          color: "var(--fg-4)",
          letterSpacing: "0.12em",
        }}
      >
        {column.title}
      </span>
      <ul
        className="flex flex-col"
        style={{ gap: 10, listStyle: "none", padding: 0, margin: 0 }}
      >
        {column.links.map((link) => {
          const isHash = link.href.startsWith("/#") || link.href.startsWith("#");
          const isMail = link.href.startsWith("mailto:");
          // Hash links and mailto stay as <a>; everything else
          // gets the Next <Link> for client-side nav.
          if (link.external || isMail || isHash) {
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="transition-colors"
                  style={{
                    color: "var(--fg-2)",
                    fontSize: 14,
                    fontFamily: "var(--font-body)",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </a>
              </li>
            );
          }
          return (
            <li key={link.label}>
              <Link
                href={link.href}
                className="transition-colors"
                style={{
                  color: "var(--fg-2)",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
