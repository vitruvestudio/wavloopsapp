/**
 * Server actions for the /admin/nurture-status panel.
 *
 * Trigger-cron action: fires the producer-nurture cron route
 * with the CRON_SECRET so the founder can force a tick without
 * touching curl. The cron does its own auth check on the same
 * header so this action is just a thin shim.
 *
 * Both actions assert the caller is in the admin allow-list.
 * They run as the user-scoped Supabase client only long enough
 * to verify identity; the cron call below uses the service-role
 * key implicitly via the bearer header.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";

interface TriggerResult {
  ok: boolean;
  payload?: unknown;
  error?: string;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000"
  );
}

export async function triggerNurtureCronAction(): Promise<TriggerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Unauthorized" };
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, error: "CRON_SECRET not configured" };
  }

  const base = siteUrl();
  const url = base.startsWith("http") ? base : `https://${base}`;

  try {
    const res = await fetch(
      `${url}/api/cron/producer-nurture-sequence`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        // Disable caching so each trigger hits the route fresh.
        cache: "no-store",
      },
    );
    const payload = await res.json();
    revalidatePath("/admin/nurture-status");
    return { ok: res.ok, payload };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
