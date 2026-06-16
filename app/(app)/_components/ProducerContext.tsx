/**
 * ProducerContextProvider — shell-level viewer data for every
 * producer-side client component (AccountMenu, etc.), populated
 * once by the server layout and made available without prop
 * drilling.
 *
 * Mirrors the artist-side ArtistContextProvider on purpose so the
 * two surfaces share the same pattern.
 */

"use client";

import * as React from "react";
import type { ProducerViewer } from "../_data";

const Ctx = React.createContext<ProducerViewer | null>(null);

export function ProducerContextProvider({
  value,
  children,
}: {
  value: ProducerViewer | null;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns the current producer viewer, or null when the layout
 *  failed to load it (proxy should have already redirected an
 *  unauth user to /auth, but the fallback keeps the type honest). */
export function useProducerViewer(): ProducerViewer | null {
  return React.useContext(Ctx);
}
