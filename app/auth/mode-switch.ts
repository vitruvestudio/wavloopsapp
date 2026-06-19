/**
 * Mode switch server actions.
 *
 * Used by AccountMenu items when a multi-role user clicks
 * "Switch to Artist view" / "Switch to Producer view". The
 * action:
 *   1. Confirms the requesting user actually has the destination
 *      role (producer profile or artist profile) — without this
 *      check, an artist-only user could POST the producer-switch
 *      endpoint, end up at /dashboard with no producer profile,
 *      and trip a 500 or land in an undefined state. Falls back
 *      to the existing role instead of erroring out.
 *   2. Sets the long-lived `wlp_last_mode` cookie so the next
 *      login lands on the same mode (via /auth/callback and the
 *      proxy's logged-in-on-/auth redirect).
 *   3. Calls redirect() to the target shell.
 *
 * Cookie scope:
 *   - Long-lived (1 year). Switching is a deliberate user
 *     action; persistence across the OS session is what makes
 *     it useful at all.
 *   - HttpOnly: true. The value is non-sensitive, but the cookie
 *     is read server-side only, so there's zero upside to
 *     leaving it scriptable. Closes the XSS-can-tamper-with-
 *     routing footgun.
 *   - SameSite: lax. Default safe behavior for navigation.
 *   - Path: /. Same on both shells.
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LAST_MODE_COOKIE, type LastMode } from "./mode-cookie";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

async function setLastMode(mode: LastMode) {
  const jar = await cookies();
  jar.set(LAST_MODE_COOKIE, mode, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    // `secure` flips on automatically when the request is
    // served over HTTPS — locally we want it off so the
    // cookie sticks on http://localhost.
    secure: process.env.NODE_ENV === "production",
  });
}

/** True iff the current session has a producer profile row that
 *  finished onboarding. */
async function hasProducerProfile(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle<{ onboarded_at: string | null }>();
  return Boolean(data?.onboarded_at);
}

/** True iff the current session has an artist profile row with a
 *  display name set (the minimal onboarding completion signal). */
async function hasArtistProfile(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("artist_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle<{ display_name: string | null }>();
  return Boolean(data?.display_name?.trim());
}

/** Send a multi-role user to the artist shell + remember the
 *  choice. Wired from the producer AccountMenu. */
export async function switchToArtistViewAction() {
  // If the user has no artist profile yet, refuse the switch
  // rather than parking them on a shell they can't act on.
  if (!(await hasArtistProfile())) {
    redirect("/dashboard");
  }
  await setLastMode("artist");
  revalidatePath("/", "layout");
  redirect("/listen");
}

/** Send a multi-role user to the producer shell + remember the
 *  choice. Wired from the artist AccountMenu. */
export async function switchToProducerViewAction() {
  if (!(await hasProducerProfile())) {
    redirect("/listen");
  }
  await setLastMode("producer");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
