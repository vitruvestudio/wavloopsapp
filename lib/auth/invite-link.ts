/**
 * generateInviteMagicLink — produces a one-click sign-in URL we can
 * embed in transactional emails ('added to server', 'access
 * granted'). Click → Supabase verifies token → /auth/callback
 * creates the session → next=/listen/<slug> → artist lands listening,
 * no gate, no form, no second email.
 *
 * Why admin generateLink instead of signInWithOtp:
 * signInWithOtp triggers Supabase's own email send. We already
 * compose our own branded email; we just need the URL. generateLink
 * (service-role only) returns the action_link without sending.
 *
 * Behaviour for the two contact shapes:
 *   - Authed contact (auth.user exists) → type='magiclink' works.
 *   - Cold contact (no auth.user yet)   → type='magiclink' fails 422
 *     'User not found'. Fall through to type='invite' which creates
 *     the auth.user on the fly and still returns an action_link.
 *
 * Caller must be prepared for a null return — every Supabase call
 * here can fail (rate-limit, project paused, network). The email
 * fan-out falls back to the public /s/<slug> URL when this returns
 * null, so the producer's add-artist flow never breaks on a Supabase
 * hiccup.
 */

import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export interface InviteLinkInput {
  email: string;
  /** Server slug — used to build the post-auth redirect target. */
  serverSlug: string;
}

/**
 * Returns an admin-generated magic-link URL. The user clicks it,
 * Supabase exchanges the token, and our /auth/callback redirects
 * to /listen/<slug>. Returns null if every attempt fails — the
 * caller is responsible for falling back to a non-auth URL.
 */
export async function generateInviteMagicLink(
  input: InviteLinkInput,
): Promise<string | null> {
  const { email, serverSlug } = input;
  const next = `/listen/${serverSlug}`;
  const redirectTo = `${siteOrigin()}/auth/callback?next=${encodeURIComponent(
    next,
  )}&as=artist`;

  const admin = getAdminSupabase();

  // First pass — magic-link for an existing auth.user. Cheap and
  // matches the artist's normal sign-in flow.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const magicRes: any = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  const magicUrl = magicRes?.data?.properties?.action_link as
    | string
    | undefined;
  if (magicUrl) return magicUrl;

  // Fallback — cold contact, no auth.user. type='invite' creates
  // one + returns the action_link in the same shape. Producers who
  // hand-typed an artist email belong on this branch.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inviteRes: any = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  const inviteUrl = inviteRes?.data?.properties?.action_link as
    | string
    | undefined;
  if (inviteUrl) return inviteUrl;

  console.warn(
    "[invite-link] both magiclink + invite returned no action_link for",
    email,
    magicRes?.error?.message,
    inviteRes?.error?.message,
  );
  return null;
}
