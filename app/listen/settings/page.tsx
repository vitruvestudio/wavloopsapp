/**
 * Artist Settings — `/listen/settings`.
 *
 * Server-fetches the artist_profiles row (if any) so the form
 * lands pre-populated with whatever's already persisted. The
 * client component handles edits + the save action.
 *
 * Phase 3.7 wired: display_name + bio + socials + notif_prefs
 * round-trip through updateArtistProfileAction. Avatar upload
 * lands in a follow-up commit.
 */

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_NOTIF_PREFS } from "../_data";
import type { ArtistNotifPrefs } from "../_data";
import { ArtistSettingsPage } from "./ArtistSettingsPage";

export const metadata = {
  title: "Settings — Wavloops",
};

export default async function SettingsRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Proxy gates /listen/* but defense-in-depth — render an
    // empty form rather than crashing if the session lapses
    // between the gate and this fetch.
    return (
      <ArtistSettingsPage
        initial={{
          email: "",
          displayName: "",
          bio: "",
          socials: {},
          notifPrefs: DEFAULT_NOTIF_PREFS,
          avatarUrl: null,
        }}
      />
    );
  }

  const { data: profile } = await supabase
    .from("artist_profiles")
    .select("display_name, bio, socials, notif_prefs, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle<{
      display_name: string | null;
      bio: string | null;
      socials: Record<string, string> | null;
      notif_prefs: Partial<ArtistNotifPrefs> | null;
      avatar_url: string | null;
    }>();

  const handleFromEmail = (user.email ?? "user").split("@")[0];
  return (
    <ArtistSettingsPage
      initial={{
        email: user.email ?? "",
        displayName: profile?.display_name ?? handleFromEmail,
        bio: profile?.bio ?? "",
        socials: profile?.socials ?? {},
        notifPrefs: {
          ...DEFAULT_NOTIF_PREFS,
          ...(profile?.notif_prefs ?? {}),
        },
        avatarUrl: profile?.avatar_url ?? null,
      }}
    />
  );
}
