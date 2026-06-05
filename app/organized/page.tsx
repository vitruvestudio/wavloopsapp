/**
 * Wavloops "Command Center" variant landing — at `/organized`.
 *
 * Same Wavloops product, different door in. Where `/` opens with the
 * auto-publishing promise, this variant opens with the organization angle —
 * your music career, finally organized.
 *
 * Built for A/B testing: send producers who feel SCATTERED here, and
 * producers who feel TIME-PRESSED to `/`. Same founding mechanic, same
 * price, same onboarding flow — different framing of the same product.
 *
 * Reuses from `/`:
 *   - AnnouncementBar  (same founding-access scarcity strip)
 *   - Topbar           (with `navItems` override for organize-specific anchors)
 *   - Pricing          (same plans, same founding founding discount)
 *   - FAQ              (same product, same answers)
 *   - FinalCTA         (same closing manifesto)
 *   - Footer           (legacy)
 *
 * New for this variant:
 *   - Hero       (// 002 — "Your music career, finally organized.")
 *   - HeroMockup (CRM contacts board instead of publishing queue)
 *   - Chaos      (// 003 — scattered DMs / lost replies pile)
 *   - HowItWorks (// 004 — Import → Organize → Send)
 *   - Features   (// 005 — Database / Library / Matching / Tracking)
 */

import type { Metadata } from "next";
import { Footer } from "@/components/landingPage/footer";
import { AnnouncementBar } from "@/components/landingPage/release-os/AnnouncementBar";
import { FAQ } from "@/components/landingPage/release-os/FAQ";
import { FinalCTA } from "@/components/landingPage/release-os/FinalCTA";
import { Chaos } from "@/components/landingPage/release-os/organized/Chaos";
import { Features } from "@/components/landingPage/release-os/organized/Features";
import { Hero } from "@/components/landingPage/release-os/organized/Hero";
import { HowItWorks } from "@/components/landingPage/release-os/organized/HowItWorks";
import { Pricing } from "@/components/landingPage/release-os/Pricing";
import { Topbar } from "@/components/landingPage/release-os/Topbar";

export const metadata: Metadata = {
  title: "Wavloops — Your music career, finally organized.",
  description:
    "Wavloops turns your scattered DMs into a clean artist database, matches your beats to the right people by mood and genre, and helps you send the right beat to the right ears. Founding access $4.99/mo — locked for life.",
};

/** Nav swap for the organized variant — drops "Producer Wall" (not surfaced
 *  here) in favour of the section that actually exists on this page. */
const ORGANIZED_NAV = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

/** Angle-specific onboarding for the organize variant. Distinct from the
 *  root /onboarding_early so we can tell where the lead came from and
 *  collect organize-shaped pain points. */
const ORGANIZED_CTA = "/onboarding_organized";

export default function OrganizedLanding() {
  return (
    <div className="relative">
      <AnnouncementBar />
      <Topbar navItems={ORGANIZED_NAV} ctaHref={ORGANIZED_CTA} />
      <main>
        <Hero />
        <Chaos />
        <HowItWorks />
        <Features />
        <Pricing ctaHref={ORGANIZED_CTA} />
        <FAQ />
        <FinalCTA ctaHref={ORGANIZED_CTA} />
      </main>
      <Footer />
    </div>
  );
}
