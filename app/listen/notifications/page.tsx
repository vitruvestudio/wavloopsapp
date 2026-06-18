/**
 * /listen/notifications — full activity history for the artist.
 *
 * The topbar bell dropdown only surfaces unread items so MARK ALL
 * READ can clear it. This page is the long-form companion: every
 * notification row this artist has ever received, newest first,
 * read + unread, paginated when the volume grows.
 *
 * Server component. Reads via the same shell loader the topbar
 * uses (loadArtistContext) so the chrome view + this page are
 * always in sync.
 */

import { notFound } from "next/navigation";
import { loadArtistContext } from "../_data";
import { ArtistNotificationsHistory } from "./ArtistNotificationsHistory";

export const metadata = { title: "Notifications — Wavloops" };

export default async function ArtistNotificationsPage() {
  const ctx = await loadArtistContext();
  if (!ctx) notFound();

  return (
    <ArtistNotificationsHistory items={ctx.notifications.items} />
  );
}
