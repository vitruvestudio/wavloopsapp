/**
 * /beats/[id] — composition / loop detail page.
 *
 * Server component. Fetches in parallel:
 *   - the beat (from beats_with_stats — picks up plays / likes /
 *     in_servers counts in one query),
 *   - the servers this beat is shared in (server_beats × servers),
 *
 * If the beat doesn't exist or the producer doesn't own it the RLS
 * SELECT silently returns no rows → we 404.
 */

import { notFound } from "next/navigation";
import { PLAN_QUOTAS } from "@/lib/billing/plans";
import { getCurrentUserPlan } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProducerProfileId } from "@/lib/supabase/current";
import { BeatDetailPage } from "./BeatDetailPage";
import type {
  BeatWithStatsRow,
  ServerRow,
} from "@/lib/supabase/database.types";

/** Relative-time stringifier used to pre-render the feedback
 *  rows' timestamps server-side. Matches the format the mock
 *  feedback used ("YESTERDAY", "3 D AGO", "1 W AGO"). */
function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "JUST NOW";
  if (min < 60) return `${min} MIN AGO`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} H AGO`;
  const d = Math.round(h / 24);
  if (d === 1) return "YESTERDAY";
  if (d < 7) return `${d} D AGO`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w} W AGO`;
  const mo = Math.round(d / 30);
  return `${mo} MO AGO`;
}

interface BeatPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BeatPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.title ? `${data.title} — Wavloops` : "Beat — Wavloops",
  };
}

export default async function BeatPage({ params }: BeatPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Producer profile fence + cached resolver.
  const profileId = await getCurrentProducerProfileId();
  if (!profileId) notFound();

  const [
    beatRes,
    membershipRes,
    commentsRes,
    listensRes,
    likesRes,
    downloadsRes,
  ] = await Promise.all([
    supabase
      .from("beats_with_stats")
      .select("*")
      .eq("id", id)
      .eq("owner_id", profileId)
      .maybeSingle(),
    supabase
      .from("server_beats")
      .select("servers(*)")
      .eq("beat_id", id),
    // Shared-note feed for the Feedback tab. RLS via
    // beat_comments_producer_read scopes this to the owner's
    // beats only — the producer's session never sees other
    // producers' rows. Newest first; pagination ships later if
    // the volume grows.
    supabase
      .from("beat_comments")
      .select("id, user_id, body, created_at")
      .eq("beat_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    // Audience aggregates — every listen row keyed by contact.
    // Producer RLS on listens scopes to their own beats.
    supabase
      .from("listens")
      .select("contact_id, listened_at")
      .eq("beat_id", id),
    supabase
      .from("likes")
      .select("contact_id, liked_at")
      .eq("beat_id", id),
    // Same shape for downloads — one row per download event,
    // keyed by contact. Producer RLS via downloads_owner_select
    // (migration 20260628130000) scopes to their own beats.
    supabase
      .from("downloads")
      .select("contact_id, downloaded_at")
      .eq("beat_id", id),
  ]);

  const beat = beatRes.data as BeatWithStatsRow | null;
  if (!beat) notFound();

  const memberships = (membershipRes.data ?? []) as unknown as Array<{
    servers: ServerRow | null;
  }>;
  const servers = memberships
    .map((r) => r.servers)
    .filter((s): s is ServerRow => Boolean(s));

  // Resolve every comment author's display data. artist_profiles
  // may be null for first-sign-in artists; in that case we fall
  // back to a stable string so the row still renders. A proper
  // RPC that exposes auth.users.email-local-part ships in a later
  // commit — auth.users isn't queryable client-side without service
  // role and we don't want to plumb that through here.
  const rawComments = commentsRes.data ?? [];
  const userIds = Array.from(
    new Set(rawComments.map((c) => c.user_id as string)),
  );
  const { data: profilesData } = userIds.length
    ? await supabase
        .from("artist_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds)
    : { data: [] as Array<{ user_id: string; display_name: string | null; avatar_url: string | null }> };
  const profileByUser = new Map(
    (profilesData ?? []).map((p) => [
      p.user_id as string,
      p as { display_name: string | null; avatar_url: string | null },
    ]),
  );

  const feedback = rawComments.map((c) => {
    const profile = profileByUser.get(c.user_id as string);
    const displayName = profile?.display_name ?? "Listener";
    // Avatar seed is stable per user even without a display_name —
    // use the user id so two unprofiled listeners get distinct
    // initials gradients instead of colliding on "Listener".
    const seed = profile?.display_name ?? (c.user_id as string);
    return {
      id: c.id as string,
      artistName: displayName,
      artistHandle: displayName.toLowerCase().replace(/\s+/g, ""),
      artistSeed: seed,
      artistAvatarUrl: profile?.avatar_url ?? null,
      body: c.body as string,
      ago: fmtAgo(c.created_at as string),
    };
  });

  // ── Audience aggregation ──────────────────────────────
  // Group listens by contact, count per-contact plays, mark
  // who liked. Fetch the matching contacts in one IN() round-
  // trip so the table renders display info without per-row
  // lookups. Producer RLS on contacts limits the read to their
  // own address book — which is exactly the set we want.
  const listens = (listensRes.data ?? []) as Array<{
    contact_id: string;
    listened_at: string;
  }>;
  const likes = (likesRes.data ?? []) as Array<{
    contact_id: string;
    liked_at: string;
  }>;
  const downloads = (downloadsRes.data ?? []) as Array<{
    contact_id: string;
    downloaded_at: string;
  }>;
  const playsByContact = new Map<string, number>();
  for (const l of listens) {
    playsByContact.set(
      l.contact_id,
      (playsByContact.get(l.contact_id) ?? 0) + 1,
    );
  }
  const downloadsByContact = new Map<string, number>();
  for (const d of downloads) {
    downloadsByContact.set(
      d.contact_id,
      (downloadsByContact.get(d.contact_id) ?? 0) + 1,
    );
  }
  const likedByContact = new Set<string>(likes.map((l) => l.contact_id));
  const audienceContactIds = Array.from(
    new Set<string>([
      ...playsByContact.keys(),
      ...likedByContact,
      ...downloadsByContact.keys(),
    ]),
  );
  const { data: audienceContactRows } = audienceContactIds.length
    ? await supabase
        .from("contacts")
        .select("id, name, email, avatar_url")
        .in("id", audienceContactIds)
    : {
        data: [] as Array<{
          id: string;
          name: string | null;
          email: string;
          avatar_url: string | null;
        }>,
      };
  const contactById = new Map(
    (audienceContactRows ?? []).map((c) => [
      c.id as string,
      c as {
        id: string;
        name: string | null;
        email: string;
        avatar_url: string | null;
      },
    ]),
  );

  const audienceRows: AudienceRow[] = audienceContactIds
    .map((cid) => {
      const c = contactById.get(cid);
      if (!c) return null;
      const handle = (c.name ?? c.email.split("@")[0]).toLowerCase();
      return {
        contactId: c.id,
        handle: `@${handle}`,
        seed: c.name ?? c.email,
        email: c.email,
        avatarUrl: c.avatar_url,
        plays: playsByContact.get(cid) ?? 0,
        liked: likedByContact.has(cid),
        downloads: downloadsByContact.get(cid) ?? 0,
      };
    })
    .filter((r): r is AudienceRow => r !== null)
    .sort((a, b) => b.plays - a.plays); // top fan first

  const topFan = audienceRows.find((r) => r.plays > 0) ?? null;
  const audience: Audience = {
    uniqueListeners: playsByContact.size,
    uniqueDownloaders: downloadsByContact.size,
    totalDownloads: downloads.length,
    topFan,
    likedBy: audienceRows.filter((r) => r.liked),
    listeners: audienceRows.filter((r) => r.plays > 0),
    // Downloaders sorted by download count desc — same shape as
    // the listeners table so the WHO DOWNLOADED row primitive can
    // re-use the listener row exactly.
    downloaders: audienceRows
      .filter((r) => r.downloads > 0)
      .sort((a, b) => b.downloads - a.downloads),
  };

  // Plan-aware analytics gate — Free shows aggregated counts only;
  // Lifetime / Pro see the full per-artist breakdown (TopFan,
  // LikedBy, WhoListened table). 'frustration calibrée' from the
  // pricing doc.
  const plan = await getCurrentUserPlan();
  const hasFullTracking = PLAN_QUOTAS[plan].hasFullTracking;

  return (
    <BeatDetailPage
      beat={beat}
      servers={servers}
      feedback={feedback}
      audience={audience}
      hasFullTracking={hasFullTracking}
    />
  );
}

export interface AudienceRow {
  contactId: string;
  handle: string;
  seed: string;
  email: string;
  avatarUrl: string | null;
  plays: number;
  liked: boolean;
  /** Distinct download events from this contact for this beat.
   *  0 when the contact only streamed without grabbing the audio. */
  downloads: number;
}

export interface Audience {
  uniqueListeners: number;
  /** Distinct contacts that have downloaded this beat. Different
   *  from totalDownloads (event count) — surfaces the per-person
   *  spread of who actually grabbed it. */
  uniqueDownloaders: number;
  /** Every download event for this beat across all contacts.
   *  Drives the TOTAL DOWNLOADS stat tile. */
  totalDownloads: number;
  topFan: AudienceRow | null;
  likedBy: AudienceRow[];
  listeners: AudienceRow[];
  /** Same row shape as listeners, filtered to contacts with
   *  downloads > 0 and sorted by download count desc. */
  downloaders: AudienceRow[];
}
