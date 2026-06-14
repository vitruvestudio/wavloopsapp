/**
 * Deterministic seeded helpers — port of the prototype's `hashSeed`
 * and `genBars` (components.jsx).
 *
 * Shared by Waveform, CoverArt, and anywhere we need a stable
 * pseudo-random value from a string identifier (a beat id, a server
 * slug, etc.). Pure functions, no React.
 */

/** FNV-1a 32-bit hash. Stable across runs, identical to the proto. */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Hue 0-359 derived from a seed. Used for generative covers + avatars. */
export function hueFromSeed(seed: string): number {
  return hashSeed(seed) % 360;
}

/**
 * Linear-congruential PRNG bar generator for the Waveform component.
 * Matches the proto's `genBars`: gentle envelope + two summed randoms,
 * floor at 0.16, ceiling at 1.
 */
export function genBars(seed: string, n: number): number[] {
  let s = hashSeed(seed) || 1;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / n) * Math.PI) * 0.5 + 0.5;
    const v = 0.16 + (rnd() * 0.7 + rnd() * 0.3) * env;
    out.push(Math.min(1, v));
  }
  return out;
}
