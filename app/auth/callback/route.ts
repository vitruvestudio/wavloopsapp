/**
 * /auth/callback — Supabase magic-link exchange endpoint.
 *
 * Supabase embeds this URL in the email it sends from
 * signInWithOtp(). The user clicks the link, Supabase appends a
 * `?code=` parameter, and bounces them here. We exchange the code
 * for a real session cookie, then run bind_artist_contacts() so
 * the freshly-authed user immediately sees every producer that
 * already had them on file as a contact, then redirect.
 *
 * On failure (missing / invalid code), we bounce back to
 * /auth/magic with an inline error.
 *
 * Producers do NOT use this endpoint — they sign in with email +
 * password via signInAction.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/listen";

  if (!code) {
    const dest = new URL("/auth/magic", url.origin);
    dest.searchParams.set("error", "Missing auth code in callback URL.");
    return NextResponse.redirect(dest);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const dest = new URL("/auth/magic", url.origin);
    dest.searchParams.set("error", error.message);
    return NextResponse.redirect(dest);
  }

  // Best-effort: link existing contacts rows (created by producers
  // before this user authed) to the current auth user via the
  // SECURITY DEFINER RPC from migration #13. Silent on failure —
  // the sign-in itself is what matters; binding can be retried on
  // next sign-in if a transient failure happens here.
  try {
    await supabase.rpc("bind_artist_contacts");
  } catch (e) {
    console.warn("[auth/callback] bind_artist_contacts failed", e);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
