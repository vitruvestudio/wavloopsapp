/**
 * /s/[slug] — Artist-facing gate page.
 *
 * Public route (lives OUTSIDE the (app) group so the proxy doesn't
 * try to bounce anonymous visitors to /auth). Anyone with the slug
 * sees the gate: server identity + producer pitch + the form an
 * artist fills to request access.
 *
 * Data: one RPC call to `get_server_for_gate(p_slug)`. The function
 * runs SECURITY DEFINER so it can read past RLS, but only ever
 * returns ONE row for the supplied slug — anonymous visitors can't
 * enumerate every server in the database, only resolve a slug they
 * already have.
 *
 * 404 if the slug doesn't match any server.
 */

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArtistGatePage } from "./ArtistGatePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Shape returned by the get_server_for_gate RPC. */
export interface ArtistGateData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  style_text: string | null;
  artwork_mode: "auto" | "color" | "image";
  accent_hue: number | null;
  artwork_image_url: string | null;
  visibility: "public" | "private";
  beats_count: number;
  producer_handle: string | null;
  producer_name: string | null;
  producer_avatar_url: string | null;
  producer_bio: string | null;
  producer_socials: Record<string, string>;
  producer_certifications: string[];
  producer_placements: Array<{
    id: string;
    title: string;
    platform: "Spotify" | "YouTube";
    icon: string;
    url?: string;
  }>;
  beat_covers: Array<{ artwork_url: string | null; wave_seed: string }>;
}

export default async function ArtistGateRoute({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch gate data + current viewer in parallel. viewerEmail being
  // non-null switches the gate form into "already signed in" mode —
  // the email field is hidden and the action takes the in-line claim
  // branch instead of sending a magic-link.
  const [rpcRes, userRes] = await Promise.all([
    supabase.rpc("get_server_for_gate", { p_slug: slug }),
    supabase.auth.getUser(),
  ]);
  // Supabase's type inference for RPC returns is conservative — cast
  // through unknown because the function declares `returns table (...)`
  // which is genuinely a row set even when it only ever holds one row.
  const rows = (rpcRes.data ?? []) as unknown as ArtistGateData[];
  if (rpcRes.error || rows.length === 0) {
    // The slug didn't match any current server. Before 404'ing,
    // check the alias table: if the producer renamed the server,
    // the link the visitor followed may still be the OLD slug.
    // We redirect (308 permanent so search engines + link
    // checkers update their caches) to the current canonical slug.
    const { data: alias } = await supabase
      .from("server_slug_aliases")
      .select("servers(slug)")
      .eq("alias", slug)
      .maybeSingle<{ servers: { slug: string } | null }>();
    const canonical = alias?.servers?.slug;
    if (canonical && canonical !== slug) {
      redirect(`/s/${canonical}`);
    }
    notFound();
  }

  // Resolve the authed artist's membership status for this server.
  // RLS helper 3b (artist_can_read_server_contact) lets the user
  // read their own rows — pending or granted — so this query
  // returns null when no contact / no membership exists yet.
  let viewerMembershipStatus: "pending" | "granted" | null = null;
  if (userRes.data.user) {
    const { data: membership } = await supabase
      .from("server_contacts")
      .select("status")
      .eq("server_id", rows[0].id)
      .maybeSingle<{ status: "pending" | "granted" }>();
    viewerMembershipStatus = membership?.status ?? null;
  }

  return (
    <ArtistGatePage
      data={rows[0]}
      viewerEmail={userRes.data.user?.email ?? null}
      viewerMembershipStatus={viewerMembershipStatus}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  // We could do a server fetch to populate this with the real name +
  // og image, but that's a second round trip per crawler hit. At V1
  // a generic title is fine; SEO/OG tags land when the gate page
  // pattern is settled.
  return {
    title: `${slug} — Wavloops`,
  };
}
