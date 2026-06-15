/**
 * Browser-side audio helpers — used by the Upload Beat flow.
 *
 * `decodeFilenameTitle` parses producer-style filenames into a
 * presentable title:
 *   "midnight_drive_142bpm.wav"  → "Midnight Drive 142bpm"
 *   "Cold-Water - FINAL v2.mp3"  → "Cold Water Final V2"
 *
 * `getAudioDurationSeconds` returns the duration of an audio file in
 * seconds (rounded). Uses HTMLAudioElement instead of decodeAudioData
 * — much cheaper for large WAVs (no full PCM decode needed, just the
 * metadata pass).
 *
 * Pure-ish — `getAudioDurationSeconds` touches `URL.createObjectURL`
 * which is browser-only; this module should only be imported from
 * `"use client"` components.
 */

/** Strip extension, normalise separators, Title Case. */
export function decodeFilenameTitle(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, "");
  return stem
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length === 0 ? "" : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Wait for loadedmetadata, resolve with `Math.round(duration)`. */
export function getAudioDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";

    const cleanup = () => URL.revokeObjectURL(url);

    audio.addEventListener("loadedmetadata", () => {
      const d = Math.round(audio.duration);
      cleanup();
      resolve(Number.isFinite(d) ? d : 0);
    });

    audio.addEventListener("error", () => {
      cleanup();
      reject(new Error("Could not read audio metadata"));
    });

    audio.src = url;
  });
}

/** Full chromatic × major/minor list — 24 entries. Matches proto
 *  notation (flats over sharps for the black keys). */
export const KEY_OPTIONS: ReadonlyArray<string> = [
  "C MAJ", "C MIN",
  "C# MAJ", "C# MIN",
  "D MAJ", "D MIN",
  "EB MAJ", "EB MIN",
  "E MAJ", "E MIN",
  "F MAJ", "F MIN",
  "F# MAJ", "F# MIN",
  "G MAJ", "G MIN",
  "AB MAJ", "AB MIN",
  "A MAJ", "A MIN",
  "BB MAJ", "BB MIN",
  "B MAJ", "B MIN",
];

/** Suggestion lists ported from the prototype upload screen. */
export const MOOD_SUGGEST: ReadonlyArray<string> = [
  "Dark",
  "Trap",
  "R&B",
  "Soul",
  "Drill",
  "Lo-Fi",
  "Ambient",
  "Melodic",
  "Aggressive",
];

export const ARTIST_TYPE_SUGGEST: ReadonlyArray<string> = [
  "Drake",
  "Travis Scott",
  "Metro Boomin",
  "The Weeknd",
  "Future",
  "Brent Faiyaz",
  "Central Cee",
  "Lil Baby",
];

export const COPRODUCER_SUGGEST: ReadonlyArray<string> = [
  "Metro",
  "Wheezy",
  "TM88",
  "Cardo",
  "Nik D",
  "Pyrex",
];

/** Suggestions for a contact's professional role. Used by the Add
 *  Contact modal's TYPE field. Distinct from ARTIST_TYPE_SUGGEST
 *  (celebrity targets a SERVER is for) — these describe what the
 *  CONTACT does for a living. */
export const CONTACT_ROLE_SUGGEST: ReadonlyArray<string> = [
  "Producer",
  "Beatmaker",
  "Artist",
  "Rapper",
  "Singer",
  "Songwriter",
  "Engineer",
  "A&R",
  "Manager",
  "Label",
];
