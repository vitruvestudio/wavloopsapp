/**
 * FinalCTA — Section 09 of the Release OS landing (closing manifesto)
 *
 * Closing CTA that sits between FAQ and footer. Last chance to convert.
 *
 * Layout:
 *   - OUTER wrapper: dark bg (continues from FAQ) with vertical padding
 *   - INNER card: contained accent-blue panel (max-w-[1080px], rounded-card),
 *     with a subtle accent glow underneath to suggest float
 *   - Faint white grid pattern overlay on the card → echoes the Hero grid
 *     (inverted), ties the page's bookends together
 *
 * CTAs are deliberately INVERTED for the accent bg — `.wv-btn-primary`
 * (accent/white) would disappear into the surface.
 *   - primary  : white pill + accent-coloured text (hover: lift + shadow)
 *   - secondary: outlined white pill + small play icon (hover: faint wash)
 */

import Link from "next/link";
import { Icon } from "./Icon";

interface FinalCTAProps {
  /** Optional CTA destination override — variant landings point to their
   *  own angle-specific onboarding flow. */
  ctaHref?: string;
}

export function FinalCTA({
  ctaHref = "/onboarding_early",
}: FinalCTAProps = {}) {
  return (
    <section
      id="your-move"
      className="relative bg-bg py-[clamp(56px,7vw,96px)]"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div
          className="relative overflow-hidden rounded-card bg-accent px-5 py-[clamp(64px,9vw,120px)] text-center sm:px-12"
          style={{
            boxShadow: "0 40px 80px -30px rgba(43,37,255,0.5)",
          }}
        >
          {/* faint white grid pattern (echoes the Hero grid, inverted) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              backgroundPosition: "center top",
            }}
          />

          <div className="relative z-[2] mx-auto max-w-[860px]">
            {/* eyebrow */}
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/[0.65]">
              <span className="text-white">//</span> 009 — your move
            </div>

            {/* H2 — manifesto */}
            <h2 className="mx-auto mt-[24px] max-w-[18ch] text-balance font-display text-[clamp(32px,5vw,64px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-white">
              Stop sitting on beats. Start releasing.
            </h2>

            {/* sub */}
            <p className="mx-auto mt-[24px] max-w-[60ch] text-pretty text-[clamp(15px,1.3vw,18px)] leading-[1.55] text-white/[0.85]">
              Set it up once. Drop your next beat and watch Wavloops build the
              rest — cover, page, video, schedule.
            </p>

            {/* CTAs — inverted for accent bg */}
            <div className="mt-[40px] flex flex-wrap items-center justify-center gap-[13px]">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-white px-[28px] py-[15px] font-body text-[15px] font-semibold text-accent transition-[transform,background-color,box-shadow] duration-wav ease-wav hover:-translate-y-[1px] hover:bg-white/[0.94] hover:shadow-[0_14px_30px_-12px_rgba(0,0,0,0.45)] active:translate-y-0"
              >
                Get early access
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-[10px] whitespace-nowrap rounded-pill border border-white/[0.4] bg-transparent px-[28px] py-[15px] font-body text-[15px] font-semibold text-white transition-colors duration-wav ease-wav hover:border-white hover:bg-white/[0.08]"
              >
                <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full border border-white/[0.4] bg-white/[0.08] text-white">
                  <Icon name="play" size={12} />
                </span>
                Watch 90-sec demo
              </a>
            </div>

            {/* trust row */}
            <ul className="m-0 mt-[28px] flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[10px] p-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-white/[0.65]">
              <li>0% Wavloops fees</li>
              <li
                aria-hidden
                className="h-[3px] w-[3px] rounded-full bg-white/[0.4]"
              />
              <li>No credit card</li>
              <li
                aria-hidden
                className="h-[3px] w-[3px] rounded-full bg-white/[0.4]"
              />
              <li>Cancel anytime</li>
            </ul>
          </div>
          {/* /max-w-[860px] content */}
        </div>
        {/* /accent card */}
      </div>
      {/* /max-w-[1200px] outer */}
    </section>
  );
}
