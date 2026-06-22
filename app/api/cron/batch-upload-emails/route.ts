/**
 * Upload-digest cron endpoint.
 *
 * Runs every minute (Vercel Cron in prod; manual trigger in dev)
 * and ships digest emails for upload notifications that have been
 * sitting unemailed for ≥10 minutes.
 *
 * Policy
 * ──────
 * Group rows by (recipient_user_id, server_id). For each group,
 * if the OLDEST pending row is ≥10 min old, include EVERY pending
 * row of that group in a single digest and stamp emailed_at on
 * all of them. So:
 *   - 5 beats uploaded within 10 min → 1 email listing all 5
 *   - 2 beats uploaded 15 min apart → 2 emails, one each
 *
 * Auth
 * ────
 * Requires `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron
 * adds this header automatically when configured in vercel.json
 * with a `secret`. Curl from local dev: pass the header by hand.
 *
 * RLS
 * ───
 * Uses the service-role client to bypass RLS — the cron has no
 * user session, and we need to read across all producers'
 * notifications + the contact emails of every artist. Mutations
 * are scoped to UPDATE emailed_at and SELECT — no broader writes.
 */

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendBeatsUploadedEmail } from "@/lib/resend/emails";

/** Constant-time string compare — avoids leaking the secret one
 *  byte at a time via response-timing. Length-guards first since
 *  timingSafeEqual throws on mismatched buffer lengths (and that
 *  throw would itself be a timing signal, hence the early bool). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

interface BatchRow {
  id: string;
  recipient_user_id: string;
  server_id: string;
  beat_id: string | null;
  body: string;
  created_at: string;
}

interface AggregatedBatch {
  recipientUserId: string;
  serverId: string;
  notifIds: string[];
  beatIds: string[];
}

export async function GET(req: NextRequest) {
  // 1. Auth gate.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const provided = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!provided || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminSupabase();

  // 2. Select all pending upload notifs older than 10 min. We
  // load EVERYTHING pending per recipient/server (not just rows
  // older than 10 min) so a single digest captures a burst
  // that started 12 min ago and finished 2 min ago. The 10-min
  // "graduation" check happens at the group level below.
  const cutoffIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: rawRows, error: pendingErr } = await admin
    .from("notifications")
    .select("id, recipient_user_id, server_id, beat_id, body, created_at")
    .eq("kind", "upload")
    .is("emailed_at", null)
    .order("created_at", { ascending: true })
    .returns<BatchRow[]>();
  if (pendingErr) {
    console.warn("[cron:batch-upload-emails] pending fetch", pendingErr);
    return NextResponse.json({ error: pendingErr.message }, { status: 500 });
  }
  const pending = rawRows ?? [];

  // 3. Group by (recipient, server). Only ship groups whose
  // OLDEST row is at the cutoff or older.
  const groups = new Map<string, AggregatedBatch>();
  for (const row of pending) {
    if (!row.server_id) continue;
    const key = `${row.recipient_user_id}|${row.server_id}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        recipientUserId: row.recipient_user_id,
        serverId: row.server_id,
        notifIds: [],
        beatIds: [],
      };
      groups.set(key, group);
    }
    group.notifIds.push(row.id);
    if (row.beat_id) group.beatIds.push(row.beat_id);
  }

  // Drop groups whose oldest row isn't yet ≥10 min old.
  const oldestByGroup = new Map<string, string>();
  for (const row of pending) {
    const key = `${row.recipient_user_id}|${row.server_id ?? ""}`;
    if (!oldestByGroup.has(key)) oldestByGroup.set(key, row.created_at);
  }
  const ripeGroups: AggregatedBatch[] = [];
  for (const [key, group] of groups) {
    const oldest = oldestByGroup.get(key);
    if (oldest && oldest <= cutoffIso) ripeGroups.push(group);
  }
  if (ripeGroups.length === 0) {
    return NextResponse.json({
      shipped: 0,
      ripeGroups: 0,
      pendingTotal: pending.length,
    });
  }

  // 4. Resolve recipient emails, server identity, producer
  // handle, beat titles — one round-trip per resource type.
  const recipientIds = Array.from(
    new Set(ripeGroups.map((g) => g.recipientUserId)),
  );
  const serverIds = Array.from(new Set(ripeGroups.map((g) => g.serverId)));
  const beatIds = Array.from(
    new Set(ripeGroups.flatMap((g) => g.beatIds)),
  );

  // Service-role can read auth.users via the admin auth API.
  const { data: usersRes } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const emailByUserId = new Map<string, string>();
  for (const u of usersRes?.users ?? []) {
    if (recipientIds.includes(u.id) && u.email) {
      emailByUserId.set(u.id, u.email);
    }
  }

  const { data: servers } = await admin
    .from("servers")
    .select("id, name, slug, owner_id")
    .in("id", serverIds)
    .returns<
      Array<{ id: string; name: string; slug: string; owner_id: string }>
    >();
  const serverById = new Map(
    (servers ?? []).map((s) => [s.id, s] as const),
  );

  const ownerIds = Array.from(
    new Set((servers ?? []).map((s) => s.owner_id)),
  );
  const { data: producers } = await admin
    .from("profiles")
    .select("id, handle, name, avatar_url")
    .in("id", ownerIds)
    .returns<
      Array<{
        id: string;
        handle: string | null;
        name: string | null;
        avatar_url: string | null;
      }>
    >();
  const producerHandleById = new Map<string, string>();
  const producerAvatarById = new Map<string, string | null>();
  for (const p of producers ?? []) {
    const raw = p.handle ?? p.name ?? "the producer";
    producerHandleById.set(p.id, raw.startsWith("@") ? raw : `@${raw}`);
    producerAvatarById.set(p.id, resolvePublicStorageUrl(p.avatar_url));
  }

  const { data: beats } = await admin
    .from("beats")
    .select("id, title, artwork_url")
    .in("id", beatIds)
    .returns<
      Array<{ id: string; title: string; artwork_url: string | null }>
    >();
  const beatById = new Map(
    (beats ?? []).map(
      (b) =>
        [
          b.id,
          {
            title: b.title,
            artworkUrl: resolvePublicStorageUrl(b.artwork_url, "beat-covers"),
          },
        ] as const,
    ),
  );

  // Phase 3.9.7.1: respect each artist's notif_prefs.email. We
  // still stamp emailed_at on opted-out groups so the cron
  // doesn't keep re-selecting them every minute — the in-app
  // notification row already landed (notif_prefs.new_beats is
  // honored upstream at the trigger layer).
  const { data: prefRows } = await admin
    .from("artist_profiles")
    .select("user_id, notif_prefs")
    .in("user_id", recipientIds)
    .returns<
      Array<{
        user_id: string;
        notif_prefs: Record<string, unknown> | null;
      }>
    >();
  const wantsEmailByUser = new Map<string, boolean>();
  for (const row of prefRows ?? []) {
    const raw = row.notif_prefs?.email;
    // Default true when the key isn't set or the row doesn't exist.
    wantsEmailByUser.set(row.user_id, raw !== false);
  }

  // 5. Ship each group's digest. Track outcomes so the response
  // body is useful for ops triage. Email failures still stamp
  // emailed_at — we don't want to retry forever on a bad address.
  let shipped = 0;
  let skipped = 0;
  let failed = 0;
  for (const group of ripeGroups) {
    const email = emailByUserId.get(group.recipientUserId);
    const server = serverById.get(group.serverId);
    if (!email || !server) {
      failed++;
      continue;
    }

    // Honor notif_prefs.email (default true). Opted-out artists
    // still get the in-app notif row from the trigger — we just
    // skip the email layer here.
    const wantsEmail = wantsEmailByUser.get(group.recipientUserId) ?? true;
    if (!wantsEmail) {
      skipped++;
      const stampedAt = new Date().toISOString();
      await admin
        .from("notifications")
        // Cast: the admin client isn't generated with Database
        // types, so the table-aware Update payload is inferred as
        // `never`. Casting the literal preserves runtime safety
        // (still the same JSON) without typing the whole admin.
        .update({ emailed_at: stampedAt } as never)
        .in("id", group.notifIds);
      continue;
    }

    const producerHandle =
      producerHandleById.get(server.owner_id) ?? "@producer";
    const producerAvatarUrl =
      producerAvatarById.get(server.owner_id) ?? null;
    const groupBeats = group.beatIds
      .map((bid) => beatById.get(bid))
      .filter(
        (b): b is { title: string; artworkUrl: string | null } => Boolean(b),
      );
    if (groupBeats.length === 0) continue;

    try {
      await sendBeatsUploadedEmail({
        artistEmail: email,
        producerHandle,
        producerAvatarUrl,
        serverName: server.name,
        serverSlug: server.slug,
        beats: groupBeats,
      });
      shipped++;
    } catch (e) {
      console.warn("[cron:batch-upload-emails] send", email, e);
      failed++;
    }

    // Stamp emailed_at unconditionally — bad-address retries
    // would just re-fail every minute and spam Resend.
    const stampedAt = new Date().toISOString();
    const { error: stampErr } = await admin
      .from("notifications")
      .update({ emailed_at: stampedAt } as never)
      .in("id", group.notifIds);
    if (stampErr) {
      console.warn("[cron:batch-upload-emails] stamp", stampErr);
    }
  }

  return NextResponse.json({
    shipped,
    skipped,
    failed,
    ripeGroups: ripeGroups.length,
    pendingTotal: pending.length,
  });
}

/**
 * Resolve a storage column value (avatar_url / artwork_url) into a
 * URL we can embed in an HTML email. Three input shapes seen in
 * production:
 *   - null → null (caller renders a fallback).
 *   - Already an absolute URL (https://…) → return as-is.
 *   - A bucket-relative path like 'user-uuid/cover.jpg' → resolve
 *     against the public Supabase URL.
 *
 * Both `avatars` and `beat-covers` buckets are public-read, so the
 * <project>/storage/v1/object/public/<bucket>/<path> URL works
 * indefinitely without signing — required for emails that may sit
 * in an inbox for days.
 *
 * Bucket inference: the column values stored in profiles.avatar_url
 * are uploaded to the `avatars` bucket, beats.artwork_url to
 * `beat-covers`. The helper takes a bucket name to handle both.
 */
function resolvePublicStorageUrl(
  value: string | null,
  // Default to the avatars bucket — most callers in this file pass
  // an avatar_url; the artwork branch overrides explicitly below.
  bucket: "avatars" | "beat-covers" = "avatars",
): string | null {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const clean = value.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}
