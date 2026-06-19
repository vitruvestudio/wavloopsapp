/**
 * Billing — single source of truth for plan quotas + Stripe lookups.
 *
 * Pure constants module. No runtime side effects, no I/O, importable
 * from anywhere (server, client, edge, tests). Any code that needs
 * to gate a feature, render a quota, or resolve a Stripe price MUST
 * read from here — never duplicate the numbers inline. Bumping
 * tier limits later is then a one-file change.
 *
 * Sources:
 *   - Wavloops-Grille-Tarifaire-billing.md (2026-06-19)
 *   - Stripe live + test products (same lookup_keys in both)
 *
 * `null` quotas mean unlimited at the schema level — the Pro fair-use
 * caps below ARE finite numbers because business policy is to email
 * the producer for outreach past those thresholds, not to hard-block.
 */

export type PlanKey = "free" | "lifetime" | "pro";

export interface PlanQuotas {
  /** Max number of servers the producer can create. null = unlimited. */
  servers: number | null;
  /** Max number of beats stored. null = unlimited. */
  beats: number | null;
  /** Max number of contacts (artists) attached. null = unlimited. */
  artists: number | null;
  /** Monthly listens egress guard. null = unlimited. */
  listensPerMonth: number | null;
  /** Lower-case file extensions accepted by the upload pipeline. */
  allowedAudioExtensions: readonly string[];
  /** Whether the producer surface reveals per-artist tracking
   *  (who-listened-to-what). false = aggregated counts only,
   *  the Free-plan teaser. */
  hasFullTracking: boolean;
}

/** SSOT for plan quotas. */
export const PLAN_QUOTAS: Record<PlanKey, PlanQuotas> = {
  free: {
    servers: 1,
    beats: 15,
    artists: 25,
    listensPerMonth: 500,
    allowedAudioExtensions: ["mp3"],
    hasFullTracking: false,
  },
  lifetime: {
    servers: 3,
    beats: 150,
    artists: 500,
    listensPerMonth: 10_000,
    allowedAudioExtensions: ["mp3"],
    hasFullTracking: true,
  },
  pro: {
    servers: null,
    beats: null,
    // Fair-use caps — not hard blocks. The Phase 4 enforcement
    // will email + alert at 80 % and at 100 % instead of breaking
    // the producer's flow mid-upload.
    artists: 1000,
    listensPerMonth: 100_000,
    allowedAudioExtensions: [
      "mp3",
      "wav",
      "wave",
      "flac",
      "aiff",
      "aif",
      "m4a",
      "aac",
      "ogg",
      "opus",
    ],
    hasFullTracking: true,
  },
};

/** Stripe lookup keys — IDENTICAL in TEST + LIVE. The code resolves
 *  prices via these strings, never hardcodes a `price_id`. Switch a
 *  tarif by editing the underlying Stripe Price object directly. */
export const STRIPE_LOOKUP_KEYS = {
  lifetime: "wavloops_lifetime",
  proMonthly: "wavloops_pro_monthly",
  proYearly: "wavloops_pro_yearly",
} as const;

export type StripeLookupKey =
  (typeof STRIPE_LOOKUP_KEYS)[keyof typeof STRIPE_LOOKUP_KEYS];

/** All lookup keys, for batched price fetches at checkout time. */
export const ALL_LOOKUP_KEYS: readonly StripeLookupKey[] = [
  STRIPE_LOOKUP_KEYS.lifetime,
  STRIPE_LOOKUP_KEYS.proMonthly,
  STRIPE_LOOKUP_KEYS.proYearly,
];

/* ============================================================
   Convenience predicates — keep them here so callers don't
   re-implement the same checks.
   ============================================================ */

/** True iff `ext` (case-insensitive, no leading dot) is an audio
 *  format the given plan is allowed to upload. */
export function isAudioExtAllowed(plan: PlanKey, ext: string): boolean {
  const clean = ext.replace(/^\./, "").toLowerCase();
  return PLAN_QUOTAS[plan].allowedAudioExtensions.includes(clean);
}

/** Compare a current count against a quota. Returns true when the
 *  next addition would exceed the cap. `null` quotas (unlimited)
 *  always return false. */
export function isOverQuota(
  current: number,
  quota: number | null,
): boolean {
  return quota !== null && current >= quota;
}
