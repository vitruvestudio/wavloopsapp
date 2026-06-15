/**
 * (app) — route group layout for every producer-side screen.
 *
 * Architecture mirrors the prototype's `ProducerShell`:
 *
 *   ┌──────────────── outer flex column ────────────────┐
 *   │  ┌── inner flex row (flex-1 min-h-0 overflow-hidden)──┐
 *   │  │   Sidebar │ TopBar (full-width) ──────────────┐    │
 *   │  │           │ ┌──── constrained 1440px ────┐    │    │
 *   │  │           │ │  PageHeader + page content   │    │    │
 *   │  │           │ └──────────────────────────────┘    │    │
 *   │  └──────────────────────────────────────────────────┘
 *   │  PlayerDock — full-bleed across sidebar + content    │
 *   └──────────────────────────────────────────────────────┘
 *
 * Content width strategy: TopBar stretches edge-to-edge of the content
 * column for the "frosted toolbar" feel. Page content is constrained
 * to 1440px max and centred (`mx-auto`) so cards / grids / lists feel
 * intentional on ultra-wide displays instead of "filling space".
 * Matches the visual language of Linear, Spotify (web), Stripe
 * Dashboard, Splice — premium SaaS layout convention.
 *
 * The PlayerDock spans the FULL viewport width (not the constrained
 * content) — it's a screen-level fixture, not a content-level one.
 *
 * Responsive:
 *   - < lg : Sidebar slides over the content as a 280px overlay
 *   - lg+  : Sidebar in-flow (244/76 collapsible)
 */

"use client";

import * as React from "react";
import { Sidebar } from "@/components/app/Sidebar";
import { TopBar } from "@/components/app/TopBar";
import { PlayerDock } from "@/components/app/PlayerDock";
import { PlayerProvider } from "@/components/app/PlayerContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Lock body scroll while the mobile sidebar is open
  React.useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Close on Escape
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <PlayerProvider>
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-bg-0">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* Inner row: Sidebar + content column */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar onMenuClick={() => setMobileOpen(true)} />
            <main className="flex-1 overflow-y-auto">
              {/* Constrained 1440px column — centres page content on ultra-
                  wide displays. The PageHeader inside `children` is sticky
                  relative to <main>, so its frosted-glass background tracks
                  this column's width too (intentional — the "editorial"
                  feel). */}
              <div className="mx-auto w-full" style={{ maxWidth: 1440 }}>
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* PlayerDock — full-bleed across the whole viewport width */}
        <PlayerDock />
      </div>
    </PlayerProvider>
  );
}
