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

import { notFound } from "next/navigation";
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
  beat_covers: Array<{ artwork_url: string | null; wave_seed: string }>;
}

export default async function ArtistGateRoute({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const rpcRes = await supabase.rpc("get_server_for_gate", {
    p_slug: slug,
  });
  // Supabase's type inference for RPC returns is conservative — cast
  // through unknown because the function declares `returns table (...)`
  // which is genuinely a row set even when it only ever holds one row.
  const rows = (rpcRes.data ?? []) as unknown as ArtistGateData[];
  if (rpcRes.error || rows.length === 0) {
    notFound();
  }

  return <ArtistGatePage data={rows[0]} />;
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
