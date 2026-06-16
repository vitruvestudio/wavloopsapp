/**
 * Artist Settings — `/listen/settings`.
 *
 * Linked from the account-chip dropdown's "Edit profile" item.
 * Mirrors the producer-side Settings page (app/(app)/settings/)
 * in design code: same SectionCard chrome, same SettingsNav rail,
 * same Toggle, same social-links row pattern. Different shape from
 * the producer's Settings: only two tabs (Edit profile /
 * Notifications) plus a Log out item, and a custom top header
 * with a back arrow + "Save changes" action instead of PageHeader.
 *
 * Phase 1 state lives in local React state — Phase 3 swaps for a
 * real `artist_profiles` row scoped to the artist's auth user id.
 */

import { ArtistSettingsPage } from "./ArtistSettingsPage";

export const metadata = {
  title: "Settings — Wavloops",
};

export default function SettingsRoute() {
  return <ArtistSettingsPage />;
}
