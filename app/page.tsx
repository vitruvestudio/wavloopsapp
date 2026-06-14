/**
 * Wavloops V3 — root entry redirect.
 *
 * Sends every visitor to `/auth`. When Supabase auth is wired (next commit),
 * this will be replaced with a session-aware redirect:
 *   - has session  → /dashboard
 *   - no session   → /auth
 * For now, unauthenticated entry is the only state.
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/auth");
}
