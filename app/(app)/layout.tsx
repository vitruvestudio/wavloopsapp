/**
 * (app) — route group layout for every producer-side screen.
 *
 * Wraps children in the producer chrome:
 *   Sidebar (left, collapsible)
 *   ───────────────────────────
 *   TopBar (sticky, blur)
 *   <page content scrolls>
 *   PlayerDock (bottom, only when something is playing)
 *
 * The route group `(app)` is invisible in URLs — `/dashboard`,
 * `/library`, etc. all sit under it but their paths stay flat.
 *
 * Auth gating is wired in a later commit. For now any visitor can
 * see /dashboard etc. — the smoke test page validates the chrome.
 */

import { Sidebar } from "@/components/app/Sidebar";
import { TopBar } from "@/components/app/TopBar";
import { PlayerDock } from "@/components/app/PlayerDock";
import { PlayerProvider } from "@/components/app/PlayerContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlayerProvider>
      <div className="flex h-screen w-full overflow-hidden bg-bg-0">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
          <PlayerDock />
        </div>
      </div>
    </PlayerProvider>
  );
}
