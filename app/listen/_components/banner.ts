/**
 * Shared banner-backdrop helpers for the artist panel.
 *
 * Used by ServerView (`/listen/[slug]`) and LikedSongsView
 * (`/listen/liked`) so every banner on the artist surface reads
 * the same: single-hue OKLCH mesh, soft fade into the page bg.
 *
 * Kept side-effect-free (pure CSS strings) so both server and
 * client components can import without dragging a dependency.
 */

/** Single-hue glow that anchors the banner — one dominant colour,
 *  with small adjacent-hue variants for depth. Chroma stays moderate
 *  (0.10-0.14) so the result feels premium rather than saturated. */
export function bannerGradient(baseHue: number): string {
  // Adjacent hues, ±20° max from the base, for tonal variation
  // without colour clashes.
  const h2 = (baseHue + 15) % 360;
  const h3 = (baseHue - 25 + 360) % 360;
  return [
    // Main glow — large, centred toward the upper half, this is
    // the dominant colour signature.
    `radial-gradient(ellipse 80% 70% at 50% 20%, oklch(0.42 0.14 ${baseHue}) 0%, transparent 70%)`,
    // Subtle wash on the right edge, slightly warmer.
    `radial-gradient(ellipse 50% 60% at 95% 30%, oklch(0.38 0.13 ${h2}) 0%, transparent 60%)`,
    // Cooler shoulder on the left, anchors the composition.
    `radial-gradient(ellipse 45% 55% at 5% 35%, oklch(0.28 0.10 ${h3}) 0%, transparent 55%)`,
  ].join(", ");
}

/** Mask that fades the gradient out at the bottom 35% so it bleeds
 *  into the page background instead of stopping with a hard line. */
export const BANNER_FADE_MASK =
  "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)";

/** Upper-centre radial mask used by the photo-backed banner modes
 *  (AUTO / IMAGE in ServerView) so they converge on the same
 *  silhouette as the hue mesh — premium cloud, not full-bleed photo. */
export const BANNER_GLOW_MASK =
  "radial-gradient(ellipse 90% 80% at 50% 20%, black 0%, black 45%, transparent 90%)";
