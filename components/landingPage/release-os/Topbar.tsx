/**
 * Topbar — Wavloops Release OS landing
 *
 * Floating nav that sits over the Hero. Two visual states:
 *   - At rest (scrollY ≤ 8)  → fully transparent: hero glow & grid bleed
 *                              through cleanly
 *   - On scroll               → translucent dark + backdrop blur (glassy),
 *                              matching the legacy `/` header treatment
 *
 * Positioning is `fixed` (not `sticky`) so the topbar lives OUTSIDE the
 * document flow. That lets the Hero start at y=0, so its background layers
 * (glow + grid) extend up behind the topbar instead of being cut off.
 *
 * Layout:
 *   - Brand: logo mark + "WAVLOOPS™" wordmark (™ as accent-blue superscript)
 *   - Nav: How it works / Producer Wall / Pricing / FAQ → anchor links (md+)
 *   - Right actions: "20 founding spots" scarcity badge + "Get early access"
 *     primary pill (both visible md+; pill stays visible on mobile)
 *   - Burger appears < md
 *
 * Concierge MVP wiring: the CTA routes to /onboarding_early (waitlist flow).
 * "Sign in" was removed because there's no real login yet — surfacing it
 * would lie about the product state.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/** Default nav for the root `/` landing (auto-workflow angle). */
const DEFAULT_NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: "#how", label: "How it works" },
  { href: "#wall", label: "Producer Wall" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

interface TopbarProps {
  /** Optional nav override — used by variant landings (e.g. `/organized`)
   *  to swap "Producer Wall" for the section that actually exists there. */
  navItems?: ReadonlyArray<{ href: string; label: string }>;
  /** Optional CTA destination override — variant landings point to their
   *  own angle-specific onboarding flow (e.g. /onboarding_organized). */
  ctaHref?: string;
}

export function Topbar({
  navItems = DEFAULT_NAV,
  ctaHref = "/onboarding_early",
}: TopbarProps = {}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-[36px] z-50 transition-[background-color,backdrop-filter,border-color] duration-200 ease-wav ${
        scrolled
          ? "border-b border-line bg-bg/60 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-[28px] px-5 sm:px-8">
        {/* brand */}
        <Link
          href="/"
          aria-label="Wavloops home"
          className="flex shrink-0 items-center gap-[10px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Photos/wavloops-icon.png"
            alt=""
            className="block h-[24px] w-auto"
          />
          <span className="font-display text-[18px] font-bold tracking-[-0.01em] text-text-1">
            WAVLOOPS
            <span className="ml-px align-super text-[9px] text-accent">
              &trade;
            </span>
          </span>
        </Link>

        {/* nav (hidden < md) */}
        <nav className="mx-auto hidden items-center gap-[6px] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-pill px-[14px] py-[8px] text-[13.5px] font-medium text-text-2 transition-colors duration-wav ease-wav hover:bg-surface-2 hover:text-text-1"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-[10px] md:ml-0">
          {/* Scarcity / live-state badge — replaces the old "Sign in" link.
              Accent-bordered pill with a tiny pulsing-ring dot signals
              "this is active and limited". Hidden under md so the topbar
              right side stays compact on phones. */}
          <span className="hidden items-center gap-[7px] rounded-pill border border-accent-line bg-accent-soft px-[10px] py-[5px] font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#cfd0ff] md:inline-flex">
            <span
              aria-hidden
              className="h-[5px] w-[5px] rounded-full bg-accent"
              style={{ boxShadow: "0 0 0 3px var(--accent-soft)" }}
            />
            20 founding spots
          </span>
          <Link href={ctaHref} className="wv-btn wv-btn-primary">
            Get early access
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-[40px] w-[40px] items-center justify-center rounded-pill border border-line-strong bg-transparent text-text-1 md:hidden"
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
