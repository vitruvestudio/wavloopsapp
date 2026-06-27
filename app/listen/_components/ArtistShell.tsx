/**
 * ArtistShell — client wrapper that holds the mobile-drawer state.
 *
 * The layout itself is a server component; everything that needs
 * client state (the sidebar's open/closed drawer mode, the topbar's
 * hamburger button) lives here.
 *
 * Desktop (lg+): sidebar is sticky on the left, drawer state is
 * ignored. Mobile: hamburger in the topbar opens the sidebar as a
 * left-anchored drawer with backdrop.
 *
 * Layout matches the producer (app)/layout.tsx outer chrome so the
 * PlayerDock can pin to the bottom across the full viewport while
 * the content column scrolls independently above it:
 *
 *   <div h-[100dvh] flex-col>          ← outer, viewport tall, no scroll
 *     <div flex-1 min-h-0>             ← inner row: sidebar + content
 *       <ArtistSidebar />
 *       <div flex-1 flex-col>          ← content column
 *         <ArtistTopbar />
 *         <div flex-1 overflow-y-auto> ← scroll surface
 *           {children}                 ← page lives here
 *         </div>
 *       </div>
 *     </div>
 *     <PlayerDock />                   ← full-bleed bottom, only when current
 *   </div>
 */

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { PlayerProvider } from "@/components/app/PlayerContext";
import { PlayerDock } from "@/components/app/PlayerDock";
import { ArtistSidebar } from "./ArtistSidebar";
import { ArtistTopbar } from "./ArtistTopbar";
import { WavloopsExplainerBar } from "./WavloopsExplainerBar";

export function ArtistShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (i.e. user picked a
  // server inside the drawer) — feels natural and avoids a leftover
  // overlay covering the new page.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open on mobile.
  React.useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <PlayerProvider>
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
        {/* Sidebar + content row */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ArtistSidebar
            drawerOpen={drawerOpen}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
          {/* `overflow-x-hidden` lets pages full-bleed inside this
              column (via the `margin-left: calc(50% - 50vw)` trick)
              without spawning a horizontal scrollbar. */}
          <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
            {/* Educational top bar — sits ABOVE the artist topbar so
                it's the very first cue a producer-listener sees when
                they land via a shared server link. Self-dismisses
                via cookie so it only shows once per browser per
                week. */}
            <WavloopsExplainerBar />
            <ArtistTopbar onOpenDrawer={() => setDrawerOpen(true)} />
            {/* Independent scroll surface so the PlayerDock can pin
                to the bottom of the viewport while pages scroll. */}
            <div className="flex-1 overflow-y-auto">
              {/* Same 1440px content cap as the producer shell
                  (app/(app)/layout.tsx) — keeps the editorial feel
                  consistent on ultra-wide displays. */}
              <div className="mx-auto w-full" style={{ maxWidth: 1440 }}>
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Full-bleed bottom dock — only renders when a beat is
            playing (usePlayer().current is non-null). */}
        <PlayerDock />
      </div>
    </PlayerProvider>
  );
}
