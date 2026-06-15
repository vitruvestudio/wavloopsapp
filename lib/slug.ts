/**
 * Slug utilities — turn "Atlanta Nights" into "atlanta-nights" and
 * preview the public URL `wavloops.co/s/<slug>` while the producer
 * types.
 *
 * `slugify` is unicode-aware: strips diacritics, lowercases, swaps
 * non-alphanumeric runs for a single hyphen, and trims leading /
 * trailing hyphens. Empty input → empty string — the caller decides
 * how to handle that (server action falls back to a random suffix).
 */

const DIACRITICS = /[̀-ͯ]/g;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
