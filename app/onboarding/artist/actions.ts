/**
 * Artist onboarding server actions.
 *
 * The artist surface is intentionally lighter than the producer
 * one — artists land here either after signing up directly with
 * the Artist card on /auth, OR after a producer's gate flow
 * (in which case `bind_artist_contacts` already linked them to
 * one or more contact rows). Either way, all we need from the
 * artist is a display name + optional avatar before they can
 * comment, like, and leave notes — those are the only fields
 * surfaced on the producer's Feedback / Audience tabs.
 *
 * The richer "bio + socials + notif prefs" editing lives in
 * /listen/settings, not here. Onboarding is the bare minimum.
 *
 * `saveArtistProfileAction` is the only entry point. It:
 *   1. Uploads avatar (if any) to bucket `avatars/<user_id>/avatar.<ext>`
 *      — same bucket the producer onboarding uses, just under a
 *      different user prefix.
 *   2. Upserts `artist_profiles` with display_name (+ optional
 *      avatar_url).
 *   3. Redirects to /listen on success.
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ArtistOnboardingPayload {
  displayName: string;
  /** Base64 data URL from FileReader, or null when the artist
   *  skipped the avatar. */
  avatarDataUrl: string | null;
}

export interface ArtistOnboardingResult {
  error: string | null;
}

const DATA_URL = /^data:([^;]+);base64,(.+)$/;

export async function saveArtistProfileAction(
  payload: ArtistOnboardingPayload,
): Promise<ArtistOnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

  const displayName = payload.displayName.trim();
  if (!displayName) {
    return { error: "Display name is required." };
  }
  if (displayName.length > 60) {
    return { error: "Display name is too long (60 characters max)." };
  }

  let avatar_url: string | null = null;

  // Upload avatar if present — same bucket + path scheme as the
  // producer onboarding. Producers and artists never share a row
  // in `auth.users` -> `profiles`/`artist_profiles`, but they DO
  // share the storage namespace by user_id, so a future "I do
  // both" user gets one consistent avatar across modes.
  if (payload.avatarDataUrl) {
    const m = payload.avatarDataUrl.match(DATA_URL);
    if (!m) {
      return { error: "Avatar image is invalid." };
    }
    const mime = m[1];
    const ext = (mime.split("/")[1] ?? "png").replace(/[^a-z0-9]/gi, "");
    const buffer = Buffer.from(m[2], "base64");
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: mime,
        upsert: true,
      });
    if (uploadErr) {
      return { error: `Avatar upload failed: ${uploadErr.message}` };
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    avatar_url = data.publicUrl;
  }

  const { error: upsertErr } = await supabase.from("artist_profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName,
      ...(avatar_url ? { avatar_url } : {}),
    },
    { onConflict: "user_id" },
  );

  if (upsertErr) {
    return { error: upsertErr.message };
  }

  revalidatePath("/", "layout");
  redirect("/listen");
}

/** Skip variant — stamps a minimal artist_profiles row (display
 *  name derived from the email-local-part) so the artist isn't
 *  bounced back here on next sign-in. They can edit later from
 *  /listen/settings. */
export async function skipArtistOnboardingAction(): Promise<ArtistOnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

  // Derive a placeholder display name from the email — better than
  // an empty row which would force the producer's Feedback tab to
  // render a "Listener" fallback for every comment.
  const fallback =
    user.email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "") || "listener";

  const { error } = await supabase.from("artist_profiles").upsert(
    {
      user_id: user.id,
      display_name: fallback,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/listen");
}
