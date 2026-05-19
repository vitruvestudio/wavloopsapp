import { Atmosphere } from "@/components/landingPage/atmosphere";
import { BenefitCards } from "@/components/landingPage/benefitCards";
import { EarlyAccess } from "@/components/landingPage/earlyAccess";
import { FeatureSpotlight } from "@/components/landingPage/featureSpotlight";
import { Footer } from "@/components/landingPage/footer";
import { Header } from "@/components/landingPage/header";
import { Hero } from "@/components/landingPage/hero";
import { Problem } from "@/components/landingPage/problem";
import { Solution } from "@/components/landingPage/solution";
import { StickyBar } from "@/components/landingPage/stickyBar";
import { Topbar } from "@/components/landingPage/topbar";

export default function Home() {
  return (
    <div className="relative">
      <Atmosphere intensity="soft" />
      <div className="relative">
        <Topbar />
        <Header />
        <main>
          <Hero />
          <Problem />
          <Solution />
          <BenefitCards />
          <FeatureSpotlight />
          <EarlyAccess />
        </main>
        <Footer />
        <StickyBar />
      </div>
    </div>
  );
}
