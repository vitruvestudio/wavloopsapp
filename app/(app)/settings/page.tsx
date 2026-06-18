/**
 * /settings — Producer's settings page.
 *
 * Server component. Fetches the producer's profile row (already
 * populated by the onboarding wizard) and hands it to the client
 * component. RLS scopes it to their own row via the public-select
 * policy + a user_id filter.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsPage } from "./SettingsPage";
import type { ProfileRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Settings" };

export default async function SettingsRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: artistRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle<ProfileRow>(),
    // Check whether the user also has an artist_profiles row — the
    // AccountTab uses this to decide whether to surface the
    // "Add Artist mode" CTA or a "You're also using Artist mode"
    // confirmation row.
    supabase
      .from("artist_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle<{ display_name: string | null }>(),
  ]);
  const hasArtistProfile = Boolean(
    artistRow?.display_name && artistRow.display_name.trim().length > 0,
  );

  // Identity provider(s) the user signed up with. Supabase exposes
  // these on the User object — we only need the provider name(s)
  // for the Account tab's "Connected — Google" / "Email & password"
  // line, not the full identity_data payload.
  const providers = (user.identities ?? []).map((i) => i.provider);

  return (
    <SettingsPage
      profile={profile}
      userEmail={user.email ?? ""}
      emailConfirmed={Boolean(user.email_confirmed_at)}
      providers={providers}
      hasArtistProfile={hasArtistProfile}
    />
  );
}
