/**
 * Artist panel shell — sidebar + topbar around children.
 *
 * Separate from the producer-side `(app)` group so the artist UI
 * can have its own navigation (producer-grouped sidebar, account
 * topbar) and its own auth gate in Phase 2.
 */

import { ArtistShell } from "./_components/ArtistShell";

export const metadata = { title: "Listen — Wavloops" };

export default function ListenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArtistShell>{children}</ArtistShell>;
}
