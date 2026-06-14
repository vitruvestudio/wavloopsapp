/**
 * (app) — route group layout for every producer-side screen.
 *
 * Responsive strategy:
 *   - lg+ (1024px+) : Sidebar in-flow (244/76 collapsible), TopBar full
 *   - <  lg         : Sidebar slides over (fixed 280px overlay + backdrop),
 *                     hamburger button in the TopBar opens it
 *
 * Client component so we can own the mobile-sidebar open state here and
 * pass it into both <Sidebar /> and <TopBar />. Child pages stay
 * server-rendered (the children prop is opaque to this client boundary).
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

  // Close mobile sidebar on Escape
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
      <div className="flex h-[100dvh] w-full overflow-hidden bg-bg-0">
        {/* Mobile backdrop — fades + click-to-close */}
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          />
        )}

        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto">{children}</main>
          <PlayerDock />
        </div>
      </div>
    </PlayerProvider>
  );
}
