/**
 * Artist panel shell — sidebar + topbar around children.
 *
 * Separate from the producer-side `(app)` group so the artist UI
 * can have its own navigation (producer-grouped sidebar, account
 * topbar) and its own auth gate in Phase 2.
 */

import { ArtistSidebar } from "./_components/ArtistSidebar";
import { ArtistTopbar } from "./_components/ArtistTopbar";

export const metadata = { title: "Listen — Wavloops" };

export default function ListenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex" style={{ minHeight: "100vh" }}>
      <ArtistSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <ArtistTopbar />
        {children}
      </div>
    </div>
  );
}
