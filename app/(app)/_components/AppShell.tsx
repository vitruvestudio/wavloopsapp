/**
 * AppShell — client body of the producer (app) layout.
 *
 * Split out from layout.tsx so the route-group layout can stay a
 * server component that fetches the viewer profile via
 * loadProducerViewer + ProducerContextProvider. Everything below
 * (mobile drawer state, sidebar / topbar / playerdock chrome) is
 * client-only, kept intact verbatim from the prior layout body.
 */

"use client";

import * as React from "react";
import { Sidebar } from "@/components/app/Sidebar";
import { TopBar } from "@/components/app/TopBar";
import { PlayerDock } from "@/components/app/PlayerDock";
import { PlayerProvider } from "@/components/app/PlayerContext";

export function AppShell({ children }: { children: React.ReactNode }) {
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
