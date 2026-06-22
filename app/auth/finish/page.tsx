/**
 * /auth/finish — implicit-flow callback for invite magic-links.
 *
 * Why this isn't /auth/callback
 * ─────────────────────────────
 * Our normal magic-link flow uses PKCE: the artist hits /auth,
 * submits the form, Supabase emails them a link with ?code=...
 * The /auth/callback route handler reads `code` server-side and
 * calls exchangeCodeForSession.
 *
 * Admin-generated magic-links (lib/auth/invite-link.ts → supabase
 * admin.generateLink({ type: 'magiclink' | 'invite' })) follow
 * the implicit flow instead. Supabase verifies the OTP and bounces
 * to redirect_to with the session tokens in the URL FRAGMENT:
 *
 *   https://wavloops.co/auth/finish?next=/listen/dish&as=artist
 *     #access_token=...&refresh_token=...&expires_in=...
 *
 * The fragment is never sent to the server. A route handler can't
 * see it. So we render a client page that reads window.location.hash,
 * calls supabase.auth.setSession({ access_token, refresh_token }),
 * mirrors /auth/callback's side effects (bind_artist_contacts), and
 * navigates to `next`.
 *
 * The client logic lives in FinishClient.tsx — Next.js 16 blocks
 * the build if useSearchParams() is called outside a Suspense
 * boundary on a prerendered page, so this server component is
 * responsible for the boundary.
 */

import { Suspense } from "react";
import { FinishClient } from "./FinishClient";

export const dynamic = "force-dynamic";

export default function AuthFinishPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "var(--bg-0)",
          }}
        />
      }
    >
      <FinishClient />
    </Suspense>
  );
}
