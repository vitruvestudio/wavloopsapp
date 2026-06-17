/**
 * Liked Songs — `/listen/liked`.
 *
 * Aggregates every beat the artist has liked across every producer
 * they follow. Server fetches via loadLikedBeats; the view component
 * is just a renderer + a few interactions (unlike, play, open note).
 */

import { LikedSongsView } from "../_components/LikedSongsView";
import { loadLikedBeats } from "../_data";

export const metadata = {
  title: "Liked Songs — Wavloops",
};

export default async function LikedPage() {
  const entries = await loadLikedBeats();
  return <LikedSongsView entries={entries} />;
}
