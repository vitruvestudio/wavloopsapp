/**
 * GET /api/beats/[id]/download
 *
 * Signs a short-lived URL for the beat's audio file and 302s the
 * caller to it. Authorization shape (every check has to pass; any
 * fail returns 403 with no further information so an attacker
 * can't enumerate which gate they tripped):
 *
 *   1. Caller must be authenticated.
 *   2. The beat must belong to a server the caller has access to —
 *      either:
 *        a. Caller is the beat's producer (owns it directly), OR
 *        b. Caller's contact row has server_contacts.status='granted'
 *           against a server that contains this beat AND that
 *           server has downloads_allowed = true.
 *   3. The beat row carries an audio_url (storage path inside the
 *      'beat-audio' bucket).
 *
 * Why a route handler, not a direct public URL: the audio bucket
 * is PRIVATE (downloads_allowed is producer-side policy, not bucket
 * policy). Signing per-request keeps the URL useless to anyone the
 * route handler didn't authorize.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes — enough for one
// click → browser download to start. Bigger TTLs widen the window
// a shared link could be reused.

export async function GET(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { id: beatId } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Forbidden.", { status: 403 });
  }

  // Pull the beat + owner once. RLS lets the producer read their
  // own row directly. For granted artists we re-check membership
  // below via the service-role client (their RLS read path on
  // beats is intentionally narrow).
  const admin = getAdminSupabase();
  const { data: beat } = await admin
    .from("beats")
    .select("id, owner_id, audio_url, title")
    .eq("id", beatId)
    .maybeSingle<{
      id: string;
      owner_id: string;
      audio_url: string | null;
      title: string;
    }>();
  if (!beat || !beat.audio_url) {
    return new NextResponse("Forbidden.", { status: 403 });
  }

  // Resolve the caller's profile (producer side) + contact (artist
  // side). Either match is enough.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  const isOwner = profile?.id === beat.owner_id;

  if (!isOwner) {
    // Artist branch: does the caller's contact row have a granted
    // membership against ANY server that contains this beat AND has
    // downloads_allowed = true?
    const { data: contact } = await admin
      .from("contacts")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("owner_id", beat.owner_id)
      .maybeSingle<{ id: string }>();
    if (!contact) {
      return new NextResponse("Forbidden.", { status: 403 });
    }

    // Two-step check, both gates must pass.
    //
    // Step 1: which servers contain this beat AND have downloads
    // enabled?
    const { data: containingRows } = await admin
      .from("server_beats")
      .select("server_id, servers!inner(downloads_allowed)")
      .eq("beat_id", beatId)
      .returns<
        Array<{
          server_id: string;
          servers: { downloads_allowed: boolean };
        }>
      >();
    const eligibleServerIds = (containingRows ?? [])
      .filter((r) => r.servers?.downloads_allowed === true)
      .map((r) => r.server_id);
    if (eligibleServerIds.length === 0) {
      return new NextResponse("Forbidden.", { status: 403 });
    }

    // Step 2: is the caller's contact granted on any of those
    // servers?
    const { data: membership } = await admin
      .from("server_contacts")
      .select("server_id")
      .eq("contact_id", contact.id)
      .eq("status", "granted")
      .in("server_id", eligibleServerIds)
      .limit(1)
      .returns<Array<{ server_id: string }>>();
    if (!membership || membership.length === 0) {
      return new NextResponse("Forbidden.", { status: 403 });
    }

    // Log the download against the first matching server. We pick
    // the server we just verified membership against — that's the
    // server the artist is operating in for this download, so the
    // event attribution lines up with how listens / likes are
    // recorded. Failure here is non-fatal: the download still
    // succeeds, the counter just doesn't tick. Counters being a
    // little off is fine; blocking a legitimate download because
    // the analytics insert hiccupped is not.
    const downloadServerId = membership[0].server_id;
    // `downloads` table isn't in the hand-written database.types
    // Database generic yet — we cast through `as never` here the
    // same way other places in the codebase do for fresh tables
    // until the type generator catches up.
    const { error: downloadInsertErr } = await admin
      .from("downloads" as never)
      .insert({
        contact_id: contact.id,
        beat_id: beatId,
        server_id: downloadServerId,
      } as never);
    if (downloadInsertErr) {
      console.warn("[beat-download] log insert", downloadInsertErr);
    }
  }
  // Owner-side downloads (the producer downloading their own beat
  // — typically when testing their own server) are deliberately
  // NOT logged. They're not "engagement", and counting them would
  // inflate every downloads counter the second the producer
  // previews their own surface.

  // Sign the storage URL. The beat-audio bucket is private so a
  // raw object URL would 401 even if leaked.
  const { data: signed, error: signErr } = await admin.storage
    .from("beat-audio")
    .createSignedUrl(beat.audio_url, SIGNED_URL_TTL_SECONDS, {
      download: safeFilename(beat.title, beat.audio_url),
    });
  if (signErr || !signed?.signedUrl) {
    console.warn("[beat-download] sign", signErr);
    return new NextResponse("Could not prepare the download.", {
      status: 500,
    });
  }

  return NextResponse.redirect(signed.signedUrl, 302);
}

/** Build a filesystem-safe filename from the beat title + the
 *  storage extension. Strip slashes, collapse whitespace, cap at
 *  80 chars. Falls back to the storage basename if the title is
 *  unusable. */
function safeFilename(title: string, audioUrl: string): string {
  const ext =
    audioUrl
      .split("/")
      .pop()
      ?.match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp3";
  const cleaned = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${cleaned || "wavloops-beat"}${ext}`;
}
