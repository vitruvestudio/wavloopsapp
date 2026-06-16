/**
 * ArtistContextProvider — make the shell-level data tree loaded by
 * loadArtistContext() available to every client component inside
 * /listen/* without prop-drilling through ArtistShell.
 *
 * Source: the server-side layout fetches once per request, hands
 * the result here, and the shell components (sidebar, topbar,
 * account menu, notifications dropdown) read what they need.
 *
 * Pages that need their own per-route data (server detail, liked
 * songs, settings) fetch separately in their server page.tsx and
 * pass to their client view via props.
 */

"use client";

import * as React from "react";
import type { ArtistContext as ArtistContextValue } from "../_data";

const Ctx = React.createContext<ArtistContextValue | null>(null);

export function ArtistContextProvider({
  value,
  children,
}: {
  value: ArtistContextValue;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useArtistContext(): ArtistContextValue {
  const ctx = React.useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useArtistContext must be used inside <ArtistContextProvider />",
    );
  return ctx;
}
