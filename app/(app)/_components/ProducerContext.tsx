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
import type { PlanKey } from "@/lib/billing/plans";
import type {
  ProducerNotifications,
  ProducerViewer,
} from "../_data";

export interface ProducerShellContext {
  viewer: ProducerViewer | null;
  notifications: ProducerNotifications;
  /** Billing plan resolved by the layout via get_user_plan(). The
   *  TopBar PlanBadge consumes this — defaults to 'free' when no
   *  session, matching the server-side fallback. */
  plan: PlanKey;
}

const EMPTY_NOTIFS: ProducerNotifications = {
  items: [],
  unreadCount: 0,
};

const Ctx = React.createContext<ProducerShellContext>({
  viewer: null,
  notifications: EMPTY_NOTIFS,
  plan: "free",
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

/** Returns the current billing plan ('free' | 'lifetime' | 'pro').
 *  Sourced from get_user_plan() at the layout level, so consumers
 *  inside the (app) tree get it without re-querying. */
export function useProducerPlan(): PlanKey {
  return React.useContext(Ctx).plan;
}
