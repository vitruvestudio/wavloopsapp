/**
 * Wavloops V3 — public landing.
 *
 * Server component. Composes the public surface:
 *   - Transparent header pinned over the hero (turns frosted on
 *     scroll), state-aware: "Sign in" / "Get started" for
 *     anonymous visitors, "Open app" for signed-in ones.
 *   - Hero — the value-prop pitch.
 *
 * Auth state is resolved once on the server with
 * `supabase.auth.getUser()` (verifies against Auth, not just the
 * cookie) and threaded down as a single `isAuthed` boolean — no
 * client-side auth check needed.
 *
 * Note on the previous behaviour
 * ──────────────────────────────
 * Until this commit `/` did `redirect(user ? "/dashboard" :
 * "/auth")` so anonymous traffic bounced straight to the auth
 * page. With a public landing we keep the door open: signed-in
 * users see "Open app" and can still browse the marketing surface
 * (handy for sharing the URL with peers without breaking out of
 * their session).
 */

import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "@/components/landing/Header";
import { LandingHero } from "@/components/landing/Hero";
import { LandingProblem } from "@/components/landing/Problem";
import { LandingHowItWorks } from "@/components/landing/HowItWorks";
import { LandingNeverAgain } from "@/components/landing/NeverAgain";
import { LandingGrowAudience } from "@/components/landing/GrowAudience";
import { LandingMetrics } from "@/components/landing/Metrics";
import { LandingCatalog } from "@/components/landing/Catalog";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  return (
    <main style={{ backgroundColor: "var(--bg-0)" }}>
      <LandingHeader isAuthed={isAuthed} />
      <LandingHero />
      <LandingProblem />
      <LandingHowItWorks />
      <LandingNeverAgain />
      <LandingGrowAudience />
      <LandingMetrics />
      <LandingCatalog />
      {/* Follow-on sections (Pricing, FAQ, CTA)
              will land here as separate components. */}
    </main>
  );
}
