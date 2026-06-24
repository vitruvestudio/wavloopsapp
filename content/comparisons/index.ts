/**
 * Comparison registry.
 *
 * Each entry is a static-imported Comparison object — no lazy
 * loading needed because the data payload is small (<5 KB each)
 * and we want the /compare index to scan all of them to render
 * the grid of competitors at the top of the hub.
 *
 * Adding a comparison:
 *   1. Drop content/comparisons/<slug>.ts that default-exports a
 *      Comparison.
 *   2. Import + push into COMPARISONS below.
 *   3. The route `/compare/<slug>` and the index page pick it up
 *      automatically; sitemap.ts also reads this registry.
 */

import beatstars from "./beatstars";
import sendbeatsto from "./sendbeatsto";
import soundee from "./soundee";
import wetransfer from "./wetransfer";
import type { Comparison } from "./types";

// Ordering matters for the /compare index page — keep the
// editorially most important comparison first (the direct
// functional competitor most likely to convert searchers).
export const COMPARISONS: Comparison[] = [
  sendbeatsto,
  beatstars,
  soundee,
  wetransfer,
];

/** Lookup by slug — narrows the registry for the dynamic route.
 *  Returns undefined when the slug doesn't exist so the route can
 *  call notFound(). */
export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
