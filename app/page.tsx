/**
 * Wavloops Release OS — root landing at `/`.
 *
 * Assembles the AnnouncementBar (founding-access strip), the floating
 * transparent Topbar, the 8 release-os sections, and the legacy Footer.
 *
 * Page-level metadata is inherited from `app/layout.tsx`. Override here
 * only if a per-page SEO tweak (OG image, twitter card, etc.) is needed.
 */

import { Footer } from "@/components/landingPage/footer";
import { AnnouncementBar } from "@/components/landingPage/release-os/AnnouncementBar";
import { BoringPart } from "@/components/landingPage/release-os/BoringPart";
import { FAQ } from "@/components/landingPage/release-os/FAQ";
import { FinalCTA } from "@/components/landingPage/release-os/FinalCTA";
import { Hero } from "@/components/landingPage/release-os/Hero";
import { HowItWorks } from "@/components/landingPage/release-os/HowItWorks";
import { Pricing } from "@/components/landingPage/release-os/Pricing";
import { ProducerWall } from "@/components/landingPage/release-os/ProducerWall";
import { Topbar } from "@/components/landingPage/release-os/Topbar";
import { WhatYouGet } from "@/components/landingPage/release-os/WhatYouGet";

export default function Home() {
  return (
    <div className="relative">
      {/* Thin opaque founding-access announcement strip (36px) pinned above
          the Topbar. The Topbar in turn sits at top-[36px] and stays
          transparent so the Hero glow + grid still bleed through underneath. */}
      <AnnouncementBar />
      <Topbar />
      <main>
        <Hero />
        <BoringPart />
        <HowItWorks />
        <WhatYouGet />
        <ProducerWall />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
