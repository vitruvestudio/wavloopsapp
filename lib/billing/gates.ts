/**
 * Billing — quota gates.
 *
 * Server-only helpers that say "can this user do X right now,
 * given their plan + current usage?". Called at the top of every
 * mutating server action that touches a quota'd resource.
 *
 * Design
 * ──────
 * Each gate returns a discriminated union: `{ ok: true }` on pass,
 * `{ ok: false, reason, plan, quotaUsed, quotaMax }` on block. The
 * action surfaces `reason` to the form's error slot — no toast or
 * modal logic here, those belong on the client.
 *
 * All gates lean on getCurrentPlanContext() which is cache()'d
 * per-render, so calling multiple gates in one request hits the
 * DB once total.
 */

import "server-only";

import { isAudioExtAllowed, isOverQuota } from "./plans";
import type { PlanKey } from "./plans";
import { getCurrentPlanContext } from "./server";

export type GateResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
      plan: PlanKey;
      quotaUsed: number;
      quotaMax: number | null;
    };

/** True if the user can create one more server, false otherwise. */
export async function checkServerQuota(): Promise<GateResult> {
  const ctx = await getCurrentPlanContext();
  if (!isOverQuota(ctx.usage.servers, ctx.quotas.servers)) return { ok: true };
  return {
    ok: false,
    reason:
      ctx.quotas.servers === 1
        ? "Your Free plan includes 1 server. Upgrade to Lifetime or Pro to create more."
        : `Your ${humanPlan(ctx.plan)} plan includes ${ctx.quotas.servers} servers. Upgrade to Pro for unlimited.`,
    plan: ctx.plan,
    quotaUsed: ctx.usage.servers,
    quotaMax: ctx.quotas.servers,
  };
}

/** True if the user can store one more beat. */
export async function checkBeatQuota(): Promise<GateResult> {
  const ctx = await getCurrentPlanContext();
  if (!isOverQuota(ctx.usage.beats, ctx.quotas.beats)) return { ok: true };
  return {
    ok: false,
    reason: `Your ${humanPlan(ctx.plan)} plan stores up to ${ctx.quotas.beats} beats — you're at ${ctx.usage.beats}. Upgrade to add more.`,
    plan: ctx.plan,
    quotaUsed: ctx.usage.beats,
    quotaMax: ctx.quotas.beats,
  };
}

/** True if the user can add `adding` more artists (default 1).
 *  Pass the actual count when bulk-attaching to a server so the
 *  gate doesn't let through a 50-row import that would push us
 *  47 over the cap. */
export async function checkArtistQuota(adding = 1): Promise<GateResult> {
  const ctx = await getCurrentPlanContext();
  if (ctx.quotas.artists === null) return { ok: true };
  const after = ctx.usage.artists + adding;
  if (after <= ctx.quotas.artists) return { ok: true };
  return {
    ok: false,
    reason:
      adding === 1
        ? `Your ${humanPlan(ctx.plan)} plan allows ${ctx.quotas.artists} artists — you're at ${ctx.usage.artists}. Upgrade to add more.`
        : `Your ${humanPlan(ctx.plan)} plan allows ${ctx.quotas.artists} artists. Adding ${adding} would bring you to ${after} (current: ${ctx.usage.artists}). Upgrade to add more.`,
    plan: ctx.plan,
    quotaUsed: ctx.usage.artists,
    quotaMax: ctx.quotas.artists,
  };
}

/** True if the user's plan allows uploading the given file
 *  extension (no leading dot, case-insensitive). */
export async function checkAudioFormat(ext: string): Promise<GateResult> {
  const ctx = await getCurrentPlanContext();
  if (isAudioExtAllowed(ctx.plan, ext)) return { ok: true };
  const allowed = ctx.quotas.allowedAudioExtensions.map((e) => e.toUpperCase()).join(", ");
  return {
    ok: false,
    reason: `Your ${humanPlan(ctx.plan)} plan supports ${allowed} only. Upgrade to Pro for WAV / FLAC / AIFF / M4A / AAC / OGG / OPUS.`,
    plan: ctx.plan,
    quotaUsed: 0,
    quotaMax: 0,
  };
}

function humanPlan(p: PlanKey): string {
  if (p === "lifetime") return "Lifetime";
  if (p === "pro") return "Pro";
  return "Free";
}
