/**
 * Maps a MockBeat (artist mock shape) onto the player's Beat
 * contract so views can hand a row straight to `usePlayer().toggle`
 * without each one duplicating the field-by-field copy.
 *
 * Phase 3 keeps this same shape — the real beat row coming off
 * `beats_with_stats` already has the same fields under different
 * names; this mapper just disappears or moves into the query layer.
 */

import type { Beat as PlayerBeat } from "@/components/app/PlayerContext";
import type { MockBeat } from "../_mock";

export function toPlayerBeat(b: MockBeat): PlayerBeat {
  return {
    id: b.id,
    title: b.title,
    bpm: b.bpm,
    key: b.key,
    dur: b.duration,
    img: b.coverUrl ?? null,
    wave: b.artSeed,
    mood: b.mood,
    audioUrl: b.audioUrl ?? null,
  };
}
