/**
 * Browser-side Supabase client.
 *
 * Use this in `"use client"` components when you need realtime, listen to
 * auth events, or trigger client-only operations. Reads `NEXT_PUBLIC_*`
 * env vars so it works inline in the bundle.
 *
 * For server components / server actions / proxy.ts, import from
 * `@/lib/supabase/server` instead — that variant binds to the request's
 * cookies and is the only safe place to do authorization decisions.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
