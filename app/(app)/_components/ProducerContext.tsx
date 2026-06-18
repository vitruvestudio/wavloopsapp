/**
 * ProducerContextProvider — shell-level viewer + notifications for
 * every producer-side client component (AccountMenu,
 * ProducerNotificationsMenu), populated once by the server layout
 * and made available without prop drilling.
 *
 * Mirrors the artist-side ArtistContextProvider on purpose so the
 * two surfaces share the same pattern.
 */

"use client";

import * as React from "react";
import type {
  ProducerNotifications,
  ProducerViewer,
} from "../_data";

export interface ProducerShellContext {
  viewer: ProducerViewer | null;
  notifications: ProducerNotifications;
}

const EMPTY_NOTIFS: ProducerNotifications = {
  items: [],
  unreadCount: 0,
};

const Ctx = React.createContext<ProducerShellContext>({
  viewer: null,
  notifications: EMPTY_NOTIFS,
});

export function ProducerContextProvider({
  value,
  children,
}: {
  value: ProducerShellContext;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns the current producer viewer, or null when the layout
 *  failed to load it (proxy should have already redirected an
 *  unauth user to /auth, but the fallback keeps the type honest). */
export function useProducerViewer(): ProducerViewer | null {
  return React.useContext(Ctx).viewer;
}

/** Returns the producer's notification dropdown payload. */
export function useProducerNotifications(): ProducerNotifications {
  return React.useContext(Ctx).notifications;
}
