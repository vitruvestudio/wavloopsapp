/**
 * Service-role Supabase client.
 *
 * BYPASSES RLS — only import from server-only contexts that need
 * to read/write across users (cron jobs, webhooks, admin tooling).
 * NEVER import from a client component.
 *
 * The service role key is the most sensitive secret in the
 * project. Mishandling it (logging it, sending it to the browser)
 * gives the attacker full DB access. Keep this file's surface
 * area thin and auditable.
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

export function getAdminSupabase() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Admin Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  cached = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
