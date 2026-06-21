/**
 * Landing — Header.
 *
 * Transparent and pinned over the hero by default. Picks up a
 * frosted backdrop + a hairline separator once the visitor scrolls
 * past the hero. That's how the hero gets its full-bleed cinematic
 * feel without losing the "navigation is always reachable" rule.
 *
 * Layout
 * ──────
 *   ┌──────────────────────────────────────────────────────┐
 *   │ LOGO                       PRICING        SIGN IN ▸ │
 *   └──────────────────────────────────────────────────────┘
 *
 * On mobile (<640px) the centre nav collapses; we keep the right-
 * side primary CTA visible because that's the conversion path.
 *
 * Right-side state
 * ────────────────
 *   - Anonymous visitor → "Sign in" ghost + "Get started" primary
 *   - Signed-in visitor → "Open app" primary (skips the auth dance)
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

interface LandingHeaderProps {
  /** True when a Supabase session was found on the server. The
   *  page resolves this once and forwards it down — no client-side
   *  auth check needed (we'd just be re-fetching what the SSR
   *  already knew). */
  isAuthed: boolean;
}

const SCROLLED_THRESHOLD_PX = 24;

export function LandingHeader({ isAuthed }: LandingHeaderProps) {
  // Frosted backdrop only kicks in after a tiny scroll — keeps the
  // hero clean when the page first loads, then the chrome appears
  // as the visitor moves down so the CTA stays legible over later
  // colored sections.
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLLED_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-50",
        "transition-[background-color,backdrop-filter,border-color] duration-200",
      ].join(" ")}
      style={{
        backgroundColor: scrolled ? "color-mix(in oklch, var(--bg-0) 72%, transparent)" : "transparent",
        backdropFilter: scrolled ? "saturate(140%) blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "saturate(140%) blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-1)" : "1px solid transparent",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{
          maxWidth: 1280,
          padding: "16px 24px",
        }}
      >
        {/* Left — logo links home so the visitor can always reset. */}
        <Link href="/" aria-label="Wavloops home" className="flex items-center">
          <Logo size={28} />
        </Link>

        {/* Centre — minimal nav. Pricing is the only public anchor
                worth surfacing on the landing chrome; everything else
                lives in the page sections themselves. Hidden on
                mobile to keep the bar uncluttered. */}
        <nav
          className="hidden md:flex items-center"
          style={{ gap: 28 }}
        >
          <Link
            href="#how-it-works"
            className="t-body transition-colors hover:!text-[var(--fg-1)]"
            style={{ color: "var(--fg-2)" }}
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="t-body transition-colors hover:!text-[var(--fg-1)]"
            style={{ color: "var(--fg-2)" }}
          >
            Pricing
          </Link>
        </nav>

        {/* Right — CTA. Single primary 'Create your first server'
                CTA in every state, so the wording across header
                + hero is consistent. Signed-in users land
                directly on the create-server form; anonymous
                visitors route through /auth?intent=signup → onboarding
                → create server, ending on the same screen. */}
        <div className="flex items-center" style={{ gap: 8 }}>
          {isAuthed ? (
            <Link href="/servers/new">
              <Button size="sm" iconRight="arrow-right">
                Create your first server
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth?intent=signup">
                <Button size="sm" iconRight="arrow-right">
                  Create your first server
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
