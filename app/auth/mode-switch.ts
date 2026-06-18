/**
 * Mode switch server actions.
 *
 * Used by AccountMenu items when a multi-role user clicks
 * "Switch to Artist view" / "Switch to Producer view". The
 * action:
 *   1. Sets a long-lived `wlp_last_mode` cookie so the next
 *      login lands on the same mode (via /auth/callback and
 *      the proxy's logged-in-on-/auth redirect).
 *   2. Calls redirect() to the target shell.
 *
 * Cookie scope:
 *   - Long-lived (1 year). Switching is a deliberate user
 *     action; persistence across the OS session is what makes
 *     it useful at all.
 *   - HttpOnly: false. The cookie is read server-side only,
 *     but we don't actively want it to be JS-inaccessible —
 *     future client components may want to peek the current
 *     mode without a round-trip. No sensitive data lives in
 *     it; the value is one of two enum strings.
 *   - SameSite: lax. Default safe behavior for navigation.
 *   - Path: /. Same on both shells.
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LAST_MODE_COOKIE, type LastMode } from "./mode-cookie";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

async function setLastMode(mode: LastMode) {
  const jar = await cookies();
  jar.set(LAST_MODE_COOKIE, mode, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: false,
    sameSite: "lax",
    // `secure` flips on automatically when the request is
    // served over HTTPS — locally we want it off so the
    // cookie sticks on http://localhost.
    secure: process.env.NODE_ENV === "production",
  });
}

/** Send a multi-role user to the artist shell + remember the
 *  choice. Wired from the producer AccountMenu. */
export async function switchToArtistViewAction() {
  await setLastMode("artist");
  revalidatePath("/", "layout");
  redirect("/listen");
}

/** Send a multi-role user to the producer shell + remember the
 *  choice. Wired from the artist AccountMenu. */
export async function switchToProducerViewAction() {
  await setLastMode("producer");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
