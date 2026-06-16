/**
 * Liked Songs — `/listen/liked`.
 *
 * Aggregates every beat the artist has liked across every producer
 * they follow. Different shape from /listen/[slug]:
 *   - cross-producer (not scoped to one server)
 *   - table layout (# / BEAT / FROM SERVER / TIME) — matches the
 *     screenshot Theo signed off on
 *   - the cover is a fixed accent-gradient heart card, not a beat
 *     mosaic
 *
 * Phase 3 swaps `likedBeats()` for a real query on
 * `likes ⨝ beats_with_stats ⨝ server_beats ⨝ servers ⨝ profiles`
 * scoped to the artist's contact ids.
 */

import { LikedSongsView } from "../_components/LikedSongsView";

export const metadata = {
  title: "Liked Songs — Wavloops",
};

export default function LikedPage() {
  return <LikedSongsView />;
}
