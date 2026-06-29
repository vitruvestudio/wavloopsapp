/**
 * Cron — Producer-nurture email sequence.
 *
 * Runs daily (see vercel.json). Walks every contact who joined a
 * producer-audience server and ships the next due step of the
 * 4-email educational sequence.
 *
 * Pipeline per contact:
 *   1. Filter pool — must have joined a server with audience_type
 *      = 'producers' AND status = 'granted' (no pending requests
 *      get sequenced).
 *   2. Dedup by person — auth_user_id when known, email otherwise.
 *      A given person receives the sequence ONCE in their life,
 *      regardless of how many producer servers they later join.
 *   3. Skip on conversion — if the contact's auth_user_id is now
 *      tied to a profiles row with onboarded_at set, they became a
 *      producer-user. Mark sequence 'converted' and stop sending.
 *      Same check fires at every step boundary so we never send a
 *      step to a contact that converted between two ticks.
 *   4. Skip on unsub — if status = 'unsubscribed' we never read
 *      the row again because the query filters status = 'pending'.
 *   5. Step timing — NURTURE_STEP_DELAYS_MS dictates how long
 *      after first_seen_at each step is due. The cron sends the
 *      next step IF the elapsed delay > the step's threshold AND
 *      the step hasn't already been sent.
 *
 * Auth: same CRON_SECRET header check as the other cron routes.
 */

import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  NURTURE_STEP_DELAYS_MS,
  sendNurtureStep1,
  sendNurtureStep2,
  sendNurtureStep3,
  sendNurtureStep4,
} from "@/lib/resend/emails";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — safe for a few hundred sends.

const STEP_SENDERS = [
  sendNurtureStep1,
  sendNurtureStep2,
  sendNurtureStep3,
  sendNurtureStep4,
] as const;

interface EligibleContact {
  contact_id: string;
  email: string;
  auth_user_id: string | null;
  first_seen_at: string;
}

interface SequenceRow {
  id: string;
  contact_id: string;
  current_step: number | null;
  status: string;
  last_sent_at: string | null;
}

export async function GET(req: Request): Promise<NextResponse> {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getAdminSupabase();

  // ── 1. Pool of producer-audience contacts ────────────────
  //
  // We pick every contact who has a granted server_contacts row
  // on a server with audience_type = 'producers'. The producer
  // RLS we wrote earlier doesn't apply because we run as
  // service-role. The join unrolls one row per (contact ×
  // server) — dedup happens in JS via the by-person key below.
  const { data: poolRaw, error: poolErr } = await admin
    .from("server_contacts")
    .select(
      "contact_id, contacts!inner(id, email, auth_user_id, first_seen_at), servers!inner(audience_type)",
    )
    .eq("status", "granted")
    .eq("servers.audience_type", "producers");
  if (poolErr) {
    return NextResponse.json(
      { error: poolErr.message, stage: "pool-fetch" },
      { status: 500 },
    );
  }

  type PoolRow = {
    contact_id: string;
    contacts: {
      id: string;
      email: string;
      auth_user_id: string | null;
      first_seen_at: string;
    } | null;
    servers: { audience_type: string } | null;
  };
  // Dedup by auth_user_id when known, otherwise by email-lowercased.
  // Same key the sequence table's unique indexes use so the upsert
  // below stays consistent.
  const byPerson = new Map<string, EligibleContact>();
  for (const r of (poolRaw ?? []) as unknown as PoolRow[]) {
    const c = r.contacts;
    if (!c) continue;
    const key = c.auth_user_id ?? `email:${c.email.toLowerCase()}`;
    if (!byPerson.has(key)) {
      byPerson.set(key, {
        contact_id: c.id,
        email: c.email,
        auth_user_id: c.auth_user_id,
        first_seen_at: c.first_seen_at,
      });
    }
  }
  const pool = Array.from(byPerson.values());

  // ── 2. Resolve which contacts are ALREADY producers ──────
  //
  // We need to skip anyone whose auth_user_id maps to a profiles
  // row with onboarded_at set. One IN() lookup keyed on the
  // distinct auth_user_ids we see in the pool.
  const knownAuthUserIds = pool
    .map((p) => p.auth_user_id)
    .filter((v): v is string => Boolean(v));
  const onboardedSet = new Set<string>();
  if (knownAuthUserIds.length > 0) {
    const { data: profileRows } = await admin
      .from("profiles")
      .select("user_id, onboarded_at")
      .in("user_id", knownAuthUserIds);
    for (const r of (profileRows ?? []) as Array<{
      user_id: string;
      onboarded_at: string | null;
    }>) {
      if (r.onboarded_at) onboardedSet.add(r.user_id);
    }
  }

  // ── 3. Existing sequence rows ────────────────────────────
  //
  // Fetch every sequence row whose contact_id appears in the pool
  // so we can decide step vs status vs first-time-insert.
  const poolContactIds = pool.map((p) => p.contact_id);
  let existingByContactId = new Map<string, SequenceRow>();
  if (poolContactIds.length > 0) {
    const { data: seqRows } = await admin
      .from("contact_nurture_sequence" as never)
      .select("id, contact_id, current_step, status, last_sent_at")
      .in("contact_id", poolContactIds);
    existingByContactId = new Map(
      ((seqRows ?? []) as unknown as SequenceRow[]).map((s) => [
        s.contact_id,
        s,
      ]),
    );
  }

  // ── 4. Walk the pool, decide an action per contact ───────
  const now = Date.now();
  const log = {
    pool_size: pool.length,
    sends: 0,
    converted: 0,
    skipped_unsubbed: 0,
    skipped_completed: 0,
    skipped_too_early: 0,
    errors: [] as string[],
  };

  for (const p of pool) {
    const existing = existingByContactId.get(p.contact_id);

    // (a) Conversion check — this person already onboarded. If
    //     the sequence row exists, flip it; otherwise insert a
    //     'converted' row so we never start the funnel.
    if (p.auth_user_id && onboardedSet.has(p.auth_user_id)) {
      if (existing && existing.status === "pending") {
        await admin
          .from("contact_nurture_sequence" as never)
          .update({
            status: "converted",
            completed_at: new Date().toISOString(),
            completion_reason: "already_onboarded_as_producer",
          } as never)
          .eq("id", existing.id);
        log.converted++;
      } else if (!existing) {
        await admin
          .from("contact_nurture_sequence" as never)
          .insert({
            contact_id: p.contact_id,
            auth_user_id: p.auth_user_id,
            email: p.email,
            current_step: 0,
            status: "converted",
            completed_at: new Date().toISOString(),
            completion_reason: "already_onboarded_at_first_run",
          } as never);
      }
      continue;
    }

    // (b) Existing non-pending row — leave it alone.
    if (existing && existing.status !== "pending") {
      log.skipped_completed++;
      continue;
    }

    // (c) Determine next step from current_step + delays.
    const currentStep = existing?.current_step ?? 0;
    const nextStep = currentStep + 1; // 1-indexed for clarity
    if (nextStep > NURTURE_STEP_DELAYS_MS.length) {
      // Sequence already complete.
      if (existing) {
        await admin
          .from("contact_nurture_sequence" as never)
          .update({
            status: "completed_normal",
            completed_at: new Date().toISOString(),
            completion_reason: "all_steps_sent",
          } as never)
          .eq("id", existing.id);
      }
      continue;
    }

    // (d) Step timing — has enough time elapsed since the
    //     contact first arrived?
    const elapsed = now - new Date(p.first_seen_at).getTime();
    const threshold = NURTURE_STEP_DELAYS_MS[nextStep - 1];
    if (elapsed < threshold) {
      log.skipped_too_early++;
      continue;
    }

    // (e) Send the email.
    const sender = STEP_SENDERS[nextStep - 1];
    const result = await sender(p.email, p.contact_id);
    if (!result.ok) {
      log.errors.push(
        `step ${nextStep} -> ${p.email}: ${result.error ?? "unknown"}`,
      );
      continue;
    }

    // (f) Upsert the sequence row to record the send. The unique
    //     index on auth_user_id / email-lower handles the global
    //     dedup-by-person constraint at the DB layer too.
    const nowIso = new Date().toISOString();
    if (existing) {
      await admin
        .from("contact_nurture_sequence" as never)
        .update({
          current_step: nextStep,
          last_sent_at: nowIso,
          // Backfill auth_user_id once the contact signs in — the
          // unique partial index will pick the row up from the
          // 'email' dedup branch into the 'auth_user_id' branch
          // automatically once this column flips from null.
          ...(p.auth_user_id ? { auth_user_id: p.auth_user_id } : {}),
          status: nextStep === NURTURE_STEP_DELAYS_MS.length
            ? "completed_normal"
            : "pending",
          completed_at:
            nextStep === NURTURE_STEP_DELAYS_MS.length ? nowIso : null,
          completion_reason:
            nextStep === NURTURE_STEP_DELAYS_MS.length
              ? "all_steps_sent"
              : null,
        } as never)
        .eq("id", existing.id);
    } else {
      await admin
        .from("contact_nurture_sequence" as never)
        .insert({
          contact_id: p.contact_id,
          auth_user_id: p.auth_user_id,
          email: p.email,
          current_step: nextStep,
          status: nextStep === NURTURE_STEP_DELAYS_MS.length
            ? "completed_normal"
            : "pending",
          last_sent_at: nowIso,
          completed_at:
            nextStep === NURTURE_STEP_DELAYS_MS.length ? nowIso : null,
          completion_reason:
            nextStep === NURTURE_STEP_DELAYS_MS.length
              ? "all_steps_sent"
              : null,
        } as never);
    }
    log.sends++;

    // Resend free tier: 10 req/sec. Trivial pause so we don't
    // burst on bigger pools.
    await new Promise((r) => setTimeout(r, 110));
  }

  return NextResponse.json(log);
}
