/**
 * /auth/magic — legacy alias.
 *
 * V1 had a dedicated passwordless page for artists at /auth/magic
 * alongside a producer /auth (email+password). V2 unified both
 * surfaces on /auth with explicit role selection, so anything
 * that used to land here just forwards on to /auth with
 * `?as=artist` preserved + any other query params (sent, email,
 * next, error, requested).
 *
 * Kept as a redirect rather than deleted because:
 *   - the artist sign-out flow used to bounce here
 *   - any stale browser tab or bookmark keeps working
 *   - old magic-link emails sitting in inboxes still resolve
 */

import { redirect } from "next/navigation";

export default async function MagicLinkRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  // Anyone who lands here was using the artist surface — preserve
  // that intent so the unified /auth doesn't bounce them back to
  // the choose-role step.
  qs.set("as", "artist");
  for (const [k, v] of Object.entries(params)) {
    if (k === "as") continue;
    const str = Array.isArray(v) ? v[0] : v;
    if (typeof str === "string" && str.length > 0) qs.set(k, str);
  }
  redirect(`/auth?${qs.toString()}`);
}
