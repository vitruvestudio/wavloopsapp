/**
 * Server-only data access for the artist /listen surface.
 *
 * Single entry point: loadArtistContext() — fetches everything the
 * artist shell (sidebar + topbar + account menu + notifications
 * dropdown) needs in one round of parallel queries, then reshapes
 * it into a shell-friendly tree:
 *
 *   ArtistContext {
 *     viewer:        ArtistViewer
 *     producers:     ArtistProducerLite[]   (with their servers)
 *     likedCount:    number
 *     notifications: { items, unreadCount }
 *   }
 *
 * Page-level routes (/listen/[slug], /listen/liked, /listen/settings)
 * fetch their own per-route slice and pass it to the client view.
 * Phase 3.3 ships those loaders.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface ArtistViewer {
  userId: string;
  email: string;
  /** Falls back to email-local-part when artist_profiles has no
   *  display_name yet (first sign-in case). */
  displayName: string;
  /** Same fallback — used by Avatar seeds + topbar @handle. */
  handle: string;
  avatarUrl: string | null;
  bio: string;
  socials: Record<string, string>;
  notifPrefs: ArtistNotifPrefs;
}

export interface ArtistNotifPrefs {
  new_beats: boolean;
  added_to_server: boolean;
  producer_reactions: boolean;
  email: boolean;
  push: boolean;
}

export const DEFAULT_NOTIF_PREFS: ArtistNotifPrefs = {
  new_beats: true,
  added_to_server: true,
  producer_reactions: false,
  email: true,
  push: false,
};

export interface ArtistProducerLite {
  /** profiles.id — used as the route + DAL key. */
  profileId: string;
  /** contacts.id for THIS artist x THIS producer — needed to scope
   *  likes / listens / server_contacts joins. */
  contactId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  socials: Record<string, string>;
  servers: ArtistServerLite[];
}

export interface ArtistServerLite {
  id: string;
  slug: string;
  name: string;
  styleText: string | null;
  artworkMode: "auto" | "color" | "image";
  accentHue: number | null;
  artworkImageUrl: string | null;
}

export interface ArtistNotificationRow {
  id: string;
  kind:
    | "upload"
    | "added_to_server"
    | "drop"
    | "comment_like"
    | "trending";
  actorName: string;
  actorSeed: string | null;
  body: string;
  serverId: string | null;
  beatId: string | null;
  read: boolean;
  createdAt: string;
}

export interface ArtistContext {
  viewer: ArtistViewer;
  producers: ArtistProducerLite[];
  likedCount: number;
  notifications: {
    items: ArtistNotificationRow[];
    unreadCount: number;
  };
}

/** Loads the full shell-level context for the authed artist.
 *  Returns null when there's no session — caller should redirect
 *  (the proxy already gates /listen/*, so this is a defense-in-
 *  depth fallback). */
export async function loadArtistContext(): Promise<ArtistContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fan out: profile, contacts (with producer + servers), liked
  // count, latest notifications.
  const [profileRes, contactsRes, likedRes, notifsRes] =
    await Promise.all([
      supabase
        .from("artist_profiles")
        .select(
          "display_name, avatar_url, bio, socials, notif_prefs",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("contacts")
        .select(
          `
          id,
          owner_id,
          owner:profiles!contacts_owner_id_fkey (
            id, handle, name, avatar_url, socials
          ),
          server_contacts (
            server:servers (
              id, slug, name, style_text,
              artwork_mode, accent_hue, artwork_image_url
            )
          )
        `,
        )
        .eq("auth_user_id", user.id),
      // count(*) of likes across every contact this artist owns.
      // Two-step: get contact ids, then count likes on them.
      // Inline here to keep loader self-contained.
      (async () => {
        const { data: cs } = await supabase
          .from("contacts")
          .select("id")
          .eq("auth_user_id", user.id);
        const ids = (cs ?? []).map((c) => c.id);
        if (ids.length === 0) return { count: 0 };
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("contact_id", ids);
        return { count: count ?? 0 };
      })(),
      supabase
        .from("notifications")
        .select(
          "id, kind, actor_name, actor_seed, body, server_id, beat_id, read, created_at",
        )
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  // ── Viewer ──────────────────────────────────────────────
  const handleFromEmail = (user.email ?? "user").split("@")[0];
  const profile = profileRes.data ?? null;
  const viewer: ArtistViewer = {
    userId: user.id,
    email: user.email ?? "",
    displayName:
      (profile?.display_name as string | null) ?? handleFromEmail,
    handle: handleFromEmail,
    avatarUrl: (profile?.avatar_url as string | null) ?? null,
    bio: (profile?.bio as string | null) ?? "",
    socials:
      (profile?.socials as Record<string, string> | null) ?? {},
    notifPrefs: mergeNotifPrefs(
      profile?.notif_prefs as Partial<ArtistNotifPrefs> | null,
    ),
  };

  // ── Producers (grouped from contacts) ───────────────────
  const producers: ArtistProducerLite[] = [];
  for (const c of contactsRes.data ?? []) {
    const owner = (c as { owner?: ProducerRow }).owner;
    if (!owner) continue;
    const servers: ArtistServerLite[] = [];
    for (const sc of (c as { server_contacts?: ServerJoinRow[] })
      .server_contacts ?? []) {
      const s = sc.server;
      if (!s) continue;
      servers.push({
        id: s.id,
        slug: s.slug,
        name: s.name,
        styleText: s.style_text,
        artworkMode: s.artwork_mode,
        accentHue: s.accent_hue,
        artworkImageUrl: s.artwork_image_url,
      });
    }
    producers.push({
      profileId: owner.id,
      contactId: c.id as string,
      handle: owner.handle ?? "producer",
      name: owner.name ?? owner.handle ?? "Producer",
      avatarUrl: owner.avatar_url,
      socials: owner.socials ?? {},
      servers,
    });
  }

  // ── Notifications ───────────────────────────────────────
  const notifRows = notifsRes.data ?? [];
  const notifications = {
    items: notifRows.map(
      (n): ArtistNotificationRow => ({
        id: n.id as string,
        kind: n.kind as ArtistNotificationRow["kind"],
        actorName: n.actor_name as string,
        actorSeed: (n.actor_seed as string | null) ?? null,
        body: n.body as string,
        serverId: (n.server_id as string | null) ?? null,
        beatId: (n.beat_id as string | null) ?? null,
        read: n.read as boolean,
        createdAt: n.created_at as string,
      }),
    ),
    unreadCount: notifRows.filter((n) => !n.read).length,
  };

  return {
    viewer,
    producers,
    likedCount: likedRes.count,
    notifications,
  };
}

/** Apply defaults for any pref the profile row hasn't set yet —
 *  keeps the toggles renderable even when the artist hasn't visited
 *  Settings since the column was added. */
function mergeNotifPrefs(
  partial: Partial<ArtistNotifPrefs> | null,
): ArtistNotifPrefs {
  return { ...DEFAULT_NOTIF_PREFS, ...(partial ?? {}) };
}

/* ============================================================
   Internal row shapes for the Supabase response — kept private
   so the public types stay clean.
   ============================================================ */

interface ProducerRow {
  id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  socials: Record<string, string> | null;
}

interface ServerJoinRow {
  server: {
    id: string;
    slug: string;
    name: string;
    style_text: string | null;
    artwork_mode: "auto" | "color" | "image";
    accent_hue: number | null;
    artwork_image_url: string | null;
  } | null;
}
