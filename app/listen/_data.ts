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

/* ============================================================
   Per-route DAL — server detail view for /listen/[slug].
   ============================================================ */

export interface ArtistServerViewBeat {
  id: string;
  title: string;
  type: "comp" | "loop";
  bpm: number;
  key: string;
  mood: string[];
  /** Formatted "M:SS". */
  duration: string;
  /** Relative time label e.g. "YESTERDAY", "3D AGO". */
  addedAt: string;
  addedAtIso: string;
  liked: boolean;
  listened: boolean;
  /** Saved private note body, "" if none. */
  noteBody: string;
  /** Latest shared comment body, "" if none. */
  latestCommentBody: string;
  artSeed: string;
  coverUrl: string | null;
  /** Signed URL into beat-audio (1h TTL). Null if no upload. */
  audioUrl: string | null;
  isNew: boolean;
  position: number;
}

export interface ArtistServerViewProducer {
  profileId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  socials: Record<string, string>;
}

export interface ArtistServerView {
  viewer: { userId: string; contactId: string | null };
  producer: ArtistServerViewProducer;
  server: {
    id: string;
    slug: string;
    name: string;
    styleText: string;
    artworkMode: "auto" | "color" | "image";
    accentHue: number | null;
    artworkImageUrl: string | null;
  };
  beats: ArtistServerViewBeat[];
}

/** Server detail + beats + viewer-scoped state. Returns null when
 *  the slug doesn't exist or the authed user isn't a contact on it
 *  (RLS filters that out transparently). */
export async function loadServerView(
  slug: string,
): Promise<ArtistServerView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("[loadServerView] slug=", slug, "user=", user?.id ?? "null");
  if (!user) return null;

  // Two-step instead of an embedded FK join — the embedded form
  // requires the constraint name (`servers_owner_id_fkey`) and
  // silently fails to null if PostgREST's schema introspection
  // hasn't picked it up. The extra round-trip is negligible.
  const serverRes = await supabase
    .from("servers")
    .select(
      `
      id, slug, name, style_text,
      artwork_mode, accent_hue, artwork_image_url,
      owner_id
    `,
    )
    .eq("slug", slug)
    .maybeSingle();
  console.log(
    "[loadServerView] server",
    serverRes.data ? "FOUND" : "null",
    "error=",
    serverRes.error,
  );
  if (!serverRes.data) return null;
  const serverRow = serverRes.data;

  const ownerRes = await supabase
    .from("profiles")
    .select("id, handle, name, avatar_url, socials")
    .eq("id", serverRow.owner_id as string)
    .maybeSingle<ProducerRow>();
  console.log(
    "[loadServerView] owner",
    ownerRes.data ? "FOUND" : "null",
    "error=",
    ownerRes.error,
  );
  if (!ownerRes.data) return null;
  const owner = ownerRes.data;

  const { data: myContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("owner_id", serverRow.owner_id as string)
    .maybeSingle<{ id: string }>();
  const contactId = myContact?.id ?? null;

  // Same two-step pattern: pivot rows first (RLS scoped to artist),
  // then resolve beat rows in one IN() round-trip.
  const { data: pivotRows } = await supabase
    .from("server_beats")
    .select("position, added_at, beat_id")
    .eq("server_id", serverRow.id as string)
    .order("position", { ascending: true });

  const beatIdsOrdered = (pivotRows ?? []).map(
    (p) => p.beat_id as string,
  );
  const addedAtByBeat = new Map(
    (pivotRows ?? []).map((p) => [
      p.beat_id as string,
      p.added_at as string,
    ]),
  );

  const { data: beatTable } = beatIdsOrdered.length
    ? await supabase
        .from("beats")
        .select(
          "id, title, type, bpm, key, mood, duration_seconds, audio_url, artwork_url, wave_seed, created_at",
        )
        .in("id", beatIdsOrdered)
    : { data: [] as BeatTableRow[] };

  // Preserve the pivot's `position` ordering — IN() doesn't.
  const beatById = new Map(
    (beatTable ?? []).map((b) => [b.id as string, b as BeatTableRow]),
  );
  const beatRows = beatIdsOrdered
    .map((id) => {
      const b = beatById.get(id);
      if (!b) return null;
      return {
        ...b,
        addedAtIso: addedAtByBeat.get(id) ?? new Date(0).toISOString(),
      };
    })
    .filter(
      (x): x is BeatTableRow & { addedAtIso: string } => x !== null,
    );

  const beatIds = beatRows.map((b) => b.id);

  const [likesRes, listensRes, notesRes, commentsRes, signedAudio] =
    await Promise.all([
      contactId && beatIds.length
        ? supabase
            .from("likes")
            .select("beat_id")
            .eq("contact_id", contactId)
            .in("beat_id", beatIds)
        : Promise.resolve({ data: [] as Array<{ beat_id: string }> }),
      contactId && beatIds.length
        ? supabase
            .from("listens")
            .select("beat_id")
            .eq("contact_id", contactId)
            .in("beat_id", beatIds)
        : Promise.resolve({ data: [] as Array<{ beat_id: string }> }),
      beatIds.length
        ? supabase
            .from("beat_notes")
            .select("beat_id, body")
            .eq("user_id", user.id)
            .in("beat_id", beatIds)
        : Promise.resolve({
            data: [] as Array<{ beat_id: string; body: string }>,
          }),
      beatIds.length
        ? supabase
            .from("beat_comments")
            .select("beat_id, body, created_at")
            .eq("user_id", user.id)
            .in("beat_id", beatIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({
            data: [] as Array<{
              beat_id: string;
              body: string;
              created_at: string;
            }>,
          }),
      beatIds.length
        ? supabase.storage
            .from("beat-audio")
            .createSignedUrls(
              beatRows
                .map((b) => b.audio_url)
                .filter((p): p is string => !!p),
              3600,
            )
        : Promise.resolve({
            data: [] as Array<{ path: string; signedUrl: string }>,
          }),
    ]);

  const likedIds = new Set(
    (likesRes.data ?? []).map((r) => r.beat_id as string),
  );
  const listenedIds = new Set(
    (listensRes.data ?? []).map((r) => r.beat_id as string),
  );
  const noteByBeat = new Map(
    (notesRes.data ?? []).map((r) => [
      r.beat_id as string,
      r.body as string,
    ]),
  );
  const latestCommentByBeat = new Map<string, string>();
  for (const c of commentsRes.data ?? []) {
    const id = c.beat_id as string;
    if (!latestCommentByBeat.has(id))
      latestCommentByBeat.set(id, c.body as string);
  }
  const signedByPath = new Map(
    (signedAudio.data ?? []).map((r) => [r.path, r.signedUrl]),
  );

  return {
    viewer: { userId: user.id, contactId },
    producer: {
      profileId: owner.id,
      handle: owner.handle ?? "producer",
      name: owner.name ?? owner.handle ?? "Producer",
      avatarUrl: owner.avatar_url,
      socials: owner.socials ?? {},
    },
    server: {
      id: serverRow.id as string,
      slug: serverRow.slug as string,
      name: serverRow.name as string,
      styleText: (serverRow.style_text as string | null) ?? "",
      artworkMode: serverRow.artwork_mode as
        | "auto"
        | "color"
        | "image",
      accentHue: (serverRow.accent_hue as number | null) ?? null,
      artworkImageUrl:
        (serverRow.artwork_image_url as string | null) ?? null,
    },
    beats: beatRows.map((b, i) => ({
      id: b.id,
      title: b.title,
      type: (b.type ?? "comp") as "comp" | "loop",
      bpm: b.bpm ?? 0,
      key: b.key ?? "",
      mood: b.mood ?? [],
      duration: fmtSeconds(b.duration_seconds ?? 0),
      addedAt: fmtAgo(b.addedAtIso),
      addedAtIso: b.addedAtIso,
      liked: likedIds.has(b.id),
      listened: listenedIds.has(b.id),
      noteBody: noteByBeat.get(b.id) ?? "",
      latestCommentBody: latestCommentByBeat.get(b.id) ?? "",
      artSeed: b.wave_seed,
      coverUrl: b.artwork_url ?? null,
      audioUrl: b.audio_url
        ? (signedByPath.get(b.audio_url) ?? null)
        : null,
      isNew: isWithin7d(b.addedAtIso),
      position: i,
    })),
  };
}

interface BeatTableRow {
  id: string;
  title: string;
  type: "comp" | "loop" | null;
  bpm: number | null;
  key: string | null;
  mood: string[] | null;
  duration_seconds: number | null;
  audio_url: string | null;
  artwork_url: string | null;
  wave_seed: string;
  created_at: string;
}

function fmtSeconds(s: number): string {
  if (!s || !Number.isFinite(s)) return "—";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "TODAY";
  if (d === 1) return "YESTERDAY";
  if (d < 7) return `${d}D AGO`;
  if (d < 30) return `${Math.round(d / 7)}W AGO`;
  if (d < 365) return `${Math.round(d / 30)}MO AGO`;
  return `${Math.round(d / 365)}Y AGO`;
}

function isWithin7d(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 7 * 86400000;
}
