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

/** True when the current session can act as an artist on the
 *  platform. Two paths qualify:
 *    1. An artist_profiles row with a display name set — the
 *       standard signal that the user went through /onboarding/
 *       artist.
 *    2. At least one contacts row linked to this auth user — the
 *       gate-page flow (/s/[slug]) creates contact rows without
 *       provisioning artist_profiles, but the user is still an
 *       artist on the platform (they have /listen access via the
 *       servers they joined).
 *
 *  Without (2) the switcher disappeared for gate-joined users
 *  the moment they flipped to producer mode and got stuck on
 *  /dashboard with no way back. */
async function hasArtistProfile(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const [artistRes, contactsRes] = await Promise.all([
    supabase
      .from("artist_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle<{ display_name: string | null }>(),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", user.id),
  ]);
  return (
    Boolean(artistRes.data?.display_name?.trim()) ||
    (contactsRes.count ?? 0) > 0
  );
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

/** True when the current user is "pure-invited-artist locked":
 *  at least one granted server_contacts membership lives on an
 *  audience='artists' server (= they were added as a rapper
 *  consumer of beats). The lock only matters when the user has
 *  no producer profile yet — an existing producer profile is
 *  the explicit "I'm a producer too" signal that always wins.
 *
 *  Mirrors the data-loader logic in app/listen/_data.ts so the
 *  action and the UI agree about who can flip. */
async function isLockedAsArtist(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { count } = await supabase
    .from("server_contacts")
    .select(
      "id, contact:contacts!inner(auth_user_id), server:servers!inner(audience_type)",
      { count: "exact", head: true },
    )
    .eq("status", "granted")
    .eq("contact.auth_user_id", user.id)
    .eq("server.audience_type", "artists");
  return (count ?? 0) > 0;
}

/** Send the user to the producer shell. Three branches:
 *    1. Already has a producer profile → flip the cookie and
 *       land on /dashboard.
 *    2. No producer profile, not locked as artist → route to
 *       /onboarding so they create one. The cookie still flips
 *       to "producer" so post-onboarding they land on /dashboard
 *       cleanly.
 *    3. No producer profile, locked as artist → silently stay
 *       on /listen. This shouldn't be reachable in normal UI
 *       (the producer-switch surface is hidden in case 3) but
 *       the action enforces it as a defence-in-depth check —
 *       otherwise a hand-crafted POST could let a locked artist
 *       slip into an onboarding flow they shouldn't see. */
export async function switchToProducerViewAction() {
  if (await hasProducerProfile()) {
    await setLastMode("producer");
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  if (await isLockedAsArtist()) {
    redirect("/listen");
  }
  await setLastMode("producer");
  revalidatePath("/", "layout");
  redirect("/onboarding");
}
