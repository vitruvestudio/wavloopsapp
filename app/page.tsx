/**
 * Wavloops V3 — root entry, session-aware redirect.
 *
 * The proxy.ts file at the project root also handles the auth/no-auth
 * branching for `/dashboard`, `/auth`, etc. This page is the explicit
 * fallback for visitors landing on `/`:
 *
 *   has session    → /dashboard
 *   no session     → /auth
 *
 * We call `supabase.auth.getUser()` (not `getSession()`) because the
 * session cookie can be spoofed; `getUser` verifies with the Auth
 * server before returning.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/auth");
}
