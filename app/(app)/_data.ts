/**
 * Server-only data for the producer (app) layout.
 *
 * Two fetches:
 *   - loadProducerViewer  — topbar identity (avatar + display name).
 *   - loadProducerNotifications — bell payload, scoped to kinds the
 *     producer can act on (access_request, like, comment).
 *
 * Both are called from the route-group layout in parallel and
 * passed through ProducerContextProvider so client components
 * (AccountMenu, ProducerNotificationsMenu) can consume them
 * without prop drilling.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface ProducerViewer {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  /** First-letter fallback for the avatar when no upload exists.
   *  Pre-computed server-side so AccountMenu doesn't have to know
   *  the rules. */
  avatarLabel: string;
}

/* ============================================================
   Producer notifications — bell payload.

   Kind union limited to events the producer needs to act on:
     - 'access_request' (Phase 3.8.5+) — wire deeplink to
                                          /servers/<slug>?tab=requests
     - 'like'           (Phase 3.9.5+) — artist liked a beat
     - 'comment'        (Phase 3.9.5+) — artist sent shared feedback
   The shared notifications table also carries artist-side kinds
   for OTHER recipients; we don't filter those out here since the
   recipient_user_id WHERE clause already scopes the read.
   ============================================================ */

export type ProducerNotificationKind =
  | "access_request"
  | "like"
  | "comment";

export interface ProducerNotificationRow {
  id: string;
  kind: ProducerNotificationKind;
  actorName: string;
  actorSeed: string | null;
  body: string;
  serverId: string | null;
  /** Slug paired with serverId so we can build a deeplink without
   *  a second round-trip. Null when the server was deleted. */
  serverSlug: string | null;
  beatId: string | null;
  read: boolean;
  createdAt: string;
}

export interface ProducerNotifications {
  items: ProducerNotificationRow[];
  unreadCount: number;
}

export async function loadProducerViewer(): Promise<ProducerViewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle<{ name: string | null; avatar_url: string | null }>();

  const email = user.email ?? "";
  const localPart = email.split("@")[0] || "Producer";
  const displayName = profile?.name?.trim() || localPart;

  return {
    userId: user.id,
    email,
    displayName,
    avatarUrl: profile?.avatar_url ?? null,
    avatarLabel: initialsOf(displayName),
  };
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Loads the producer's notification dropdown payload. Filters to
 *  kinds the producer can act on; returns at most 30 newest rows.
 *  Unread count is the count of those without `read=true` — for the
 *  bell badge. Caller is the layout, so we don't throw on the no-
 *  session case (the proxy already gated that) — return empty
 *  instead. */
export async function loadProducerNotifications(): Promise<ProducerNotifications> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], unreadCount: 0 };

  const { data: rows } = await supabase
    .from("notifications")
    .select(
      "id, kind, actor_name, actor_seed, body, server_id, beat_id, read, created_at",
    )
    .eq("recipient_user_id", user.id)
    .in("kind", ["access_request", "like", "comment"])
    .order("created_at", { ascending: false })
    .limit(30);

  const raw = rows ?? [];

  // Resolve server slugs in one round-trip so each row carries the
  // deeplink-ready slug without a per-row fetch.
  const serverIds = Array.from(
    new Set(
      raw
        .map((n) => n.server_id as string | null)
        .filter((id): id is string => id !== null),
    ),
  );
  const slugByServer = new Map<string, string>();
  if (serverIds.length > 0) {
    const { data: servers } = await supabase
      .from("servers")
      .select("id, slug")
      .in("id", serverIds);
    for (const s of servers ?? []) {
      slugByServer.set(s.id as string, s.slug as string);
    }
  }

  const items: ProducerNotificationRow[] = raw.map((n) => ({
    id: n.id as string,
    kind: n.kind as ProducerNotificationKind,
    actorName: n.actor_name as string,
    actorSeed: (n.actor_seed as string | null) ?? null,
    body: n.body as string,
    serverId: (n.server_id as string | null) ?? null,
    serverSlug:
      slugByServer.get((n.server_id as string | null) ?? "") ?? null,
    beatId: (n.beat_id as string | null) ?? null,
    read: n.read as boolean,
    createdAt: n.created_at as string,
  }));

  return {
    items,
    unreadCount: items.filter((n) => !n.read).length,
  };
}
