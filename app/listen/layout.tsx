/**
 * Artist panel shell — sidebar + topbar around children.
 *
 * Separate from the producer-side `(app)` group so the artist UI
 * can have its own navigation (producer-grouped sidebar, account
 * topbar) and its own auth gate. Auth gating lives in proxy.ts;
 * this layout fetches the shell-level data and hands it down via
 * <ArtistContextProvider>.
 *
 * `loadArtistContext` returns null when there's no session — the
 * proxy already redirects unauthed visits to /auth/magic, so this
 * is defense-in-depth: we bounce back to /auth/magic instead of
 * rendering an empty shell.
 */

import { redirect } from "next/navigation";
import { loadArtistContext } from "./_data";
import { ArtistContextProvider } from "./_components/ArtistContext";
import { ArtistShell } from "./_components/ArtistShell";

export const metadata = { title: "Listen — Wavloops" };

export default async function ListenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadArtistContext();
  if (!ctx) redirect("/auth/magic?next=/listen");
  return (
    <ArtistContextProvider value={ctx}>
      <ArtistShell>{children}</ArtistShell>
    </ArtistContextProvider>
  );
}
