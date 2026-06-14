/**
 * Onboarding server actions.
 *
 * Single entry point: `saveProfileAction`. Called from OnboardingWizard
 * with the full wizard state in one payload. The action:
 *   1. Uploads the avatar (if present) to the `avatars` bucket under
 *      `<user_id>/avatar.<ext>`.
 *   2. Upserts the `profiles` row, stamping `onboarded_at = now()`.
 *   3. Redirects to /dashboard on success.
 *
 * On error returns `{ error: string }` so the wizard can surface it
 * inline above the Finish button.
 *
 * The avatar arrives as a base64 data URL (the wizard uses FileReader
 * for instant preview). Acceptable for V1 — typical profile photos are
 * 50-300 KB which inflates to ~400 KB base64. We re-decode to a Buffer
 * before upload so the bucket stores binary, not text.
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PlacementRecord } from "@/lib/supabase/database.types";

export interface OnboardingPayload {
  name: string;
  bio: string;
  socials: Record<string, string>;
  certifications: string[];
  placements: PlacementRecord[];
  /** Base64 data URL from FileReader, or null if no avatar set. */
  avatarDataUrl: string | null;
}

export interface SaveProfileResult {
  error: string | null;
}

const DATA_URL = /^data:([^;]+);base64,(.+)$/;

export async function saveProfileAction(
  payload: OnboardingPayload,
): Promise<SaveProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

  let avatar_url: string | null = null;

  // 1) Upload avatar if present
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

  // 2) Upsert profile
  const { error: upsertErr } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      name: payload.name || null,
      bio: payload.bio || null,
      socials: payload.socials,
      certifications: payload.certifications,
      placements: payload.placements,
      ...(avatar_url ? { avatar_url } : {}),
      onboarded_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertErr) {
    return { error: upsertErr.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Skip variant — stamps `onboarded_at` so the user isn't bounced back
 * here on next sign-in, but doesn't write any of the wizard's fields.
 * The user can complete their profile later from Settings.
 */
export async function skipOnboardingAction(): Promise<SaveProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You're not signed in. Refresh and try again." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      onboarded_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
