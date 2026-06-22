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
import { getAdminSupabase } from "@/lib/supabase/admin";
import { LandingHeader } from "@/components/landing/Header";
import { LandingHero } from "@/components/landing/Hero";
import { LandingBanner } from "@/components/landing/Banner";
import { LandingProblem } from "@/components/landing/Problem";
import { LandingHowItWorks } from "@/components/landing/HowItWorks";
import { LandingNeverAgain } from "@/components/landing/NeverAgain";
import { LandingGrowAudience } from "@/components/landing/GrowAudience";
import { LandingMetrics } from "@/components/landing/Metrics";
import { LandingCatalog } from "@/components/landing/Catalog";
import { LandingTestimonials } from "@/components/landing/Testimonials";
import { LandingPricing } from "@/components/landing/Pricing";
import { LandingFAQ } from "@/components/landing/FAQ";
import { LandingFooter } from "@/components/landing/Footer";
import { LandingStructuredData } from "@/components/landing/StructuredData";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  // Promo banner — singleton row from /admin. Fetched server-
  // side on every request (no cache) so an admin save is live
  // on the next visitor refresh. Read goes through the admin
  // client because the banner table's RLS allows public reads
  // anyway but the admin client skips the policy check entirely
  // (slightly cheaper).
  const adminDb = getAdminSupabase();
  const { data: banner } = await adminDb
    .from("landing_banner")
    .select("is_active, message, cta_label, cta_href, variant")
    .eq("id", true)
    .maybeSingle<{
      is_active: boolean;
      message: string;
      cta_label: string | null;
      cta_href: string | null;
      variant: "info" | "promo" | "warning";
    }>();

  return (
    <main style={{ backgroundColor: "var(--bg-0)" }}>
      {banner && (
        <LandingBanner
          isActive={banner.is_active}
          message={banner.message}
          ctaLabel={banner.cta_label}
          ctaHref={banner.cta_href}
          variant={banner.variant}
        />
      )}
      <LandingHeader isAuthed={isAuthed} />
      <LandingHero />
      <LandingProblem />
      <LandingHowItWorks />
      <LandingNeverAgain />
      <LandingGrowAudience />
      <LandingMetrics />
      <LandingCatalog />
      <LandingTestimonials />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
      {/* SEO — invisible JSON-LD graph. SoftwareApplication +
              Organization + FAQPage in a single payload so Google
              parses everything in one pass. */}
      <LandingStructuredData />
    </main>
  );
}
