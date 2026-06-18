/**
 * Settings server actions.
 *
 * `updateProfileAction` — same data shape as the onboarding
 * `saveProfileAction`, minus the redirect at the end. Used by
 * the Settings → Profile tab. Re-uses the avatars bucket path
 * (`<user_id>/avatar.<ext>`) so the producer's existing photo is
 * overwritten cleanly on change.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PlacementRecord } from "@/lib/supabase/database.types";

export interface UpdateProfilePayload {
  name: string;
  bio: string;
  socials: Record<string, string>;
  certifications: string[];
  placements: PlacementRecord[];
  /** New avatar as a base64 data URL, OR null to keep the current
   *  one. To clear the photo entirely, pass clearAvatar: true. */
  avatarDataUrl: string | null;
  clearAvatar?: boolean;
}

export interface UpdateProfileResult {
  error: string | null;
}

const DATA_URL = /^data:([^;]+);base64,(.+)$/;

export async function updateProfileAction(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

  // 1) Avatar handling
  // - new image given            → upload, get the public URL
  // - clearAvatar=true given     → write null
  // - neither (default)          → don't touch the field at all
  let avatarUpdate: { avatar_url: string | null } | null = null;
  if (payload.avatarDataUrl) {
    const m = payload.avatarDataUrl.match(DATA_URL);
    if (!m) return { error: "Avatar image is invalid." };
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
    avatarUpdate = { avatar_url: data.publicUrl };
  } else if (payload.clearAvatar) {
    avatarUpdate = { avatar_url: null };
  }

  // 2) UPDATE the profile in place. RLS via the profiles_update_own
  // policy gates ownership.
  // UPSERT (not UPDATE) so a user who skipped the onboarding wizard
  // and landed straight on /settings still gets a profile row on
  // their first save. UPDATE on zero rows is silent success in
  // Postgres, which used to make the form look like it "saved
  // nothing": action returned ok, UI flashed Saved, refresh fetched
  // profile = null, form re-rendered empty.
  // onConflict on user_id matches saveProfileAction (onboarding).
  // profiles_insert_own + profiles_update_own RLS gate ownership
  // on both branches.
  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        name: payload.name.trim() || null,
        bio: payload.bio.trim() || null,
        socials: payload.socials,
        certifications: payload.certifications,
        placements: payload.placements,
        ...(avatarUpdate ?? {}),
      },
      { onConflict: "user_id" },
    );

  if (upsertErr) {
    return { error: upsertErr.message };
  }

  revalidatePath("/settings", "page");
  revalidatePath("/", "layout");
  return { error: null };
}

/* ============================================================
   Phase 3.9.7.2 — producer notification preferences.
   Persisted to profiles.notif_prefs (JSONB). Senders and DB
   triggers read this column to gate in-app rows + emails.
   ============================================================ */

export interface ProducerNotifPrefs {
  access_request: boolean;
  likes: boolean;
  comments: boolean;
  email: boolean;
  push: boolean;
}

export interface UpdateNotifPrefsResult {
  error: string | null;
}

export async function updateProducerNotifPrefsAction(
  prefs: ProducerNotifPrefs,
): Promise<UpdateNotifPrefsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

  // Coerce to a clean payload — silently drop unexpected keys so a
  // tampered client can't sneak arbitrary JSON into the column.
  const payload = {
    access_request: !!prefs.access_request,
    likes: !!prefs.likes,
    comments: !!prefs.comments,
    email: !!prefs.email,
    push: !!prefs.push,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ notif_prefs: payload })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings", "page");
  return { error: null };
}
