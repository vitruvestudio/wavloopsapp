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
 */

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ArtistSidebar } from "./ArtistSidebar";
import { ArtistTopbar } from "./ArtistTopbar";

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
    <div className="flex" style={{ minHeight: "100vh" }}>
      <ArtistSidebar
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />
      {/* `overflow-x-hidden` lets pages full-bleed inside this
          column (via the `margin-left: calc(50% - 50vw)` trick)
          without spawning a horizontal scrollbar. */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <ArtistTopbar onOpenDrawer={() => setDrawerOpen(true)} />
        {/* Same 1440px content cap as the producer shell
            (app/(app)/layout.tsx) — keeps the editorial feel
            consistent on ultra-wide displays. */}
        <div className="mx-auto w-full" style={{ maxWidth: 1440 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
