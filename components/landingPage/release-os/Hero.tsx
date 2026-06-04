/**
 * Hero — Wavloops Release OS landing
 *
 * Copy-only Hero (announcement, eyebrow, H1, sub, CTAs, trust).
 * The big app screenshot mockup that sits below is a separate component
 * (`HeroAppMockup`) so this file stays focused on the brand message.
 *
 * Visuals:
 *   - radial blue glow + faint grid pattern with radial mask (decorative bg)
 *   - announcement pill linking to the future demo anchor
 *   - H1 with an accent-blue highlighted span on "the boring part."
 *   - primary CTA → /onboarding_early (existing waitlist flow)
 *   - secondary CTA → "#demo" anchor (scrolls to mockup below)
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`
 */

import Link from "next/link";
import { HeroAppMockup } from "./HeroAppMockup";
import { Icon } from "./Icon";

export function Hero() {
  return (
    // Padding-top accounts for the fixed AnnouncementBar (36px) + Topbar (68px)
    // overlapping the Hero — the section box starts at y=0 so glow + grid
    // extend up behind both.
    <section className="relative overflow-hidden pt-[160px] text-center sm:pt-[188px]">
      {/* radial blue glow above the fold */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-160px] z-0 h-[680px] w-[1100px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(56% 60% at 50% 0%, rgba(43,37,255,.34), rgba(43,37,255,.07) 45%, transparent 70%)",
        }}
      />

      {/* faint grid with radial mask */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          backgroundPosition: "center top",
          WebkitMaskImage:
            "radial-gradient(70% 70% at 50% 20%, #000 25%, transparent 72%)",
          maskImage:
            "radial-gradient(70% 70% at 50% 20%, #000 25%, transparent 72%)",
        }}
      />

      <div className="relative z-[2] mx-auto flex max-w-[1200px] flex-col items-center px-5 sm:px-8">
        {/* "Powered by Claude AI" badge — official Claude symbol PNG
            (`/Photos/Claude_Symbol_1.png`) is rendered raw, no wrapper,
            so Anthropic's brand mark stays untinted and on-spec. */}
        <span className="mb-[34px] inline-flex items-center gap-[10px] rounded-pill border border-line-strong bg-white/[0.03] py-[6px] pl-[10px] pr-[16px] text-[13px] text-text-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Photos/Claude_Symbol_1.png"
            alt="Claude"
            className="h-[18px] w-[18px] shrink-0"
          />
          <span>
            Powered by{" "}
            <b className="font-semibold text-text-1">Claude AI</b>
          </span>
        </span>

        {/* eyebrow */}
        <div className="wv-eyebrow mb-[22px]">
          <span className="slash">//</span> 001 — for beatmakers who&apos;d
          rather make beats
        </div>

        {/* H1 — accent span uses .wv-hl-accent helper to keep the highlight
            rect tight to the cap-height and sat z-index -1 BEHIND the text,
            so it never bleeds into the line above. */}
        <h1 className="m-0 max-w-[19ch] text-balance font-display text-[clamp(38px,6vw,82px)] font-bold uppercase leading-[0.96] tracking-[-0.05em] text-text-1">
          Focus on making beats. Let Wavloops handle{" "}
          <span className="wv-hl-accent">the boring part.</span>
        </h1>

        {/* sub */}
        <p className="mx-auto mt-[26px] max-w-[60ch] text-pretty font-body text-[clamp(16px,1.5vw,20px)] leading-[1.55] text-text-2">
          Upload your beats <b className="font-semibold text-text-1">once</b>.
          Wavloops prepares the cover, sales link, YouTube title, description,
          tags, video and schedule{" "}
          <b className="font-semibold text-text-1">automatically</b>.
        </p>

        {/* Founding Access price card — sits between the sub copy and the
            CTA row. Locks the entry tier price for life as the early-access
            offer. Mirrors the legacy V1 card pattern, ported to the Release
            OS DS (rounded-card, wv-eyebrow palette, no fake discount badge). */}
        <div className="mt-[28px] w-full max-w-[640px] overflow-hidden rounded-card border border-line-strong bg-surface-1 text-left">
          {/* header bar */}
          <div className="flex items-center justify-between gap-[12px] border-b border-line bg-bg-deep px-[18px] py-[10px]">
            <div className="flex items-center gap-[8px]">
              <span
                aria-hidden
                className="h-[5px] w-[5px] rounded-full bg-accent"
                style={{ boxShadow: "0 0 0 3px var(--accent-soft)" }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent">
                Founding Access
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
              <span className="sm:hidden">20 spots left</span>
              <span className="hidden sm:inline">
                20 founding spots remaining
              </span>
            </span>
          </div>

          {/* body — single col on mobile, price | benefits split on sm+ */}
          <div className="grid grid-cols-1 gap-[20px] p-[20px] sm:grid-cols-[auto_1fr] sm:gap-[28px] sm:p-[24px]">
            {/* price column — founding price + strikethrough regular + savings badge */}
            <div className="flex flex-col items-start gap-[6px]">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-text-3">
                Founding price
              </span>
              <div className="flex items-baseline gap-[6px]">
                <span className="font-display text-[42px] font-bold leading-none tracking-[-0.04em] text-text-1">
                  $4.99
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2">
                  /mo
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-3 line-through">
                $14.99/mo regular
              </span>
              <span className="mt-[4px] inline-flex items-center rounded-pill bg-accent px-[10px] py-[3px] font-mono text-[9px] uppercase tracking-[0.13em] text-white">
                Save 67%
              </span>
            </div>

            {/* benefits column — border-top on mobile, border-left on sm+ */}
            <div className="flex flex-col gap-[12px] border-t border-line pt-[20px] sm:border-l sm:border-t-0 sm:pl-[24px] sm:pt-0">
              <p className="m-0 text-[14px] font-semibold leading-snug text-text-1">
                Lock your founding price before launch.
              </p>
              <ul className="m-0 flex list-none flex-col gap-[8px] p-0 text-[13px] leading-[1.45] text-text-2">
                <li className="flex items-start gap-[8px]">
                  <span
                    aria-hidden
                    className="mt-[8px] block h-px w-[12px] flex-none bg-accent"
                  />
                  <span>Same price forever — no escalation post-launch</span>
                </li>
                <li className="flex items-start gap-[8px]">
                  <span
                    aria-hidden
                    className="mt-[8px] block h-px w-[12px] flex-none bg-accent"
                  />
                  <span>Priority onboarding · we wire your first drop</span>
                </li>
                <li className="flex items-start gap-[8px]">
                  <span
                    aria-hidden
                    className="mt-[8px] block h-px w-[12px] flex-none bg-accent"
                  />
                  <span>Cancel anytime · no card required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-[38px] flex flex-wrap items-center justify-center gap-[13px]">
          <Link
            href="/onboarding_early"
            className="wv-btn wv-btn-primary wv-btn-lg"
          >
            Get early access
          </Link>
          <a
            href="#demo"
            className="wv-btn wv-btn-ghost wv-btn-lg inline-flex items-center gap-[10px]"
          >
            <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full border border-line-strong bg-white/[0.06] text-text-1">
              <Icon name="play" size={12} />
            </span>
            Watch 90-sec demo
          </a>
        </div>

        {/* trust row */}
        <ul className="m-0 mt-[26px] flex list-none flex-wrap items-center justify-center gap-x-[18px] gap-y-[10px] p-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-3">
          <li className="inline-flex items-center gap-[7px]">
            <Icon name="check" size={13} className="text-accent" />
            0% Wavloops fees
          </li>
          <li
            aria-hidden
            className="h-[3px] w-[3px] rounded-full bg-line-strong"
          />
          <li className="inline-flex items-center gap-[7px]">
            <Icon name="check" size={13} className="text-accent" />
            No credit card
          </li>
          <li
            aria-hidden
            className="h-[3px] w-[3px] rounded-full bg-line-strong"
          />
          <li className="inline-flex items-center gap-[7px]">
            <Icon name="check" size={13} className="text-accent" />
            Connect YouTube in one click
          </li>
        </ul>

        {/* App screenshot mockup with play overlay — full hero section */}
        <HeroAppMockup />
      </div>
    </section>
  );
}
