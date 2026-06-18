/**
 * /onboarding/artist — minimal artist setup, post-signup.
 *
 * Sibling of /onboarding (producer 5-step wizard) and /auth. Inherits
 * only the root layout — no producer App shell, no artist shell.
 *
 * Server-side gating (defence in depth on top of the proxy):
 *   - No user                                        → /auth?as=artist
 *   - Artist already has a display_name on file      → /listen
 *
 * If the artist arrived via a producer's gate flow, `bind_artist_contacts`
 * has already linked them to the producer's contact rows but did NOT
 * create an `artist_profiles` row. The wizard here is what stamps that
 * row, so the producer's Feedback / Audience tabs can render real
 * display names instead of "Listener" placeholders.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArtistOnboardingScreen } from "./ArtistOnboardingScreen";

export const metadata: Metadata = {
  title: "Set up your artist profile — Wavloops",
};

export default async function ArtistOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?as=artist");

  const { data: profile } = await supabase
    .from("artist_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle<{ display_name: string | null }>();

  // A non-empty display_name is our "onboarded" signal — once it's
  // set, the artist has been through here (or imported it via
  // Settings) and shouldn't see this screen again.
  if (profile?.display_name && profile.display_name.trim().length > 0) {
    redirect("/listen");
  }

  // Prefill display name suggestion from the email-local-part so
  // the artist doesn't face an empty field on a fresh signup.
  const suggested =
    user.email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "") || "";

  return <ArtistOnboardingScreen suggestedDisplayName={suggested} />;
}
