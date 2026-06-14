/**
 * Server-side Supabase client.
 *
 * Bound to the current request's cookies. Use this in:
 *   - React Server Components (page.tsx / layout.tsx)
 *   - Server Actions (`"use server"` files)
 *   - Route Handlers (app/.../route.ts)
 *
 * Next.js 16 made `cookies()` async, so this factory is async too.
 * Always `await createClient()` then use the returned client.
 *
 * IMPORTANT: never use this to make authorization decisions based on
 * `supabase.auth.getSession()`. Use `getUser()` (verified by the Auth
 * server) or `getClaims()` (verified locally via JWKS) instead — the
 * session cookie can be spoofed.
 *
 * The previous service-role helper was removed (unused). When we need
 * RLS-bypassing admin operations (webhooks, scheduled jobs), we'll
 * reintroduce it as `lib/supabase/admin.ts` with the service-role key.
 */

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies at render time.
            // That's fine — the proxy refreshes the session on every
            // navigation, so this is only ever called outside RSC.
          }
        },
      },
    },
  );
}
