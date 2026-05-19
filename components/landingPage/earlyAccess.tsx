import Link from "next/link";
import { Atmosphere } from "@/components/landingPage/atmosphere";

const BULLETS = [
  "Early access before public launch",
  "Locked founding price for the first 20 producers",
  "Help setting up your first gated kit page",
  "Priority influence on the product roadmap",
  "No credit card required",
];

export function EarlyAccess() {
  return (
    <section id="waitlist" className="relative overflow-hidden bg-bg">
      <Atmosphere intensity="strong" />

      <div className="relative mx-auto max-w-7xl px-s-4 py-s-9 sm:px-s-5">
        {/* Section header */}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-s-5 text-center sm:gap-s-6">
          <span className="inline-flex h-[22px] items-center gap-s-2 rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
            <span aria-hidden className="animate-pulse">●</span>
            Early Access
          </span>
          <h2 className="font-display text-[32px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-text-1 sm:text-[44px] md:text-[52px] lg:text-[60px] lg:leading-[0.88] lg:tracking-[-0.045em]">
            Join the first 20 producers building with Wavloops.
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.55] text-text-2 sm:text-lead">
            Wavloops is launching privately on June 20. Claim one of the
            first 20 producer spots, lock your founding price, and turn your
            next free kit into a gated growth page.
          </p>
        </div>

        {/* Single flat offer card */}
        <div className="mx-auto mt-s-8 max-w-lg sm:mt-s-9">
          <div className="relative overflow-hidden rounded-r-3 border border-line-strong bg-surface-1">
            {/* Subtle accent halo at top */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[180px]"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(43,37,255,0.16), transparent 70%)",
              }}
            />

            <div className="relative p-s-5 sm:p-s-6">
              {/* Price */}
              <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                Founding price
              </span>
              <div className="mt-s-2 flex flex-wrap items-baseline gap-s-2 sm:gap-s-3">
                <span className="font-display text-[44px] font-extrabold uppercase leading-none tracking-[-0.045em] text-text-1 sm:text-[56px]">
                  $4.99
                </span>
                <span className="font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-2">
                  /mo
                </span>
                <span className="inline-flex h-[20px] items-center rounded-r-1 bg-accent px-s-2 font-mono text-[10px] uppercase tracking-mono-eyebrow text-accent-ink">
                  Save 74%
                </span>
              </div>
              <p className="mt-s-2 text-[13px] leading-snug text-text-2">
                instead of{" "}
                <span className="text-text-3 line-through">$19/mo</span> at
                public launch
              </p>

              {/* Bullets */}
              <ul className="mt-s-5 flex flex-col gap-s-3">
                {BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-s-3">
                    <span
                      aria-hidden
                      className="mt-[5px] block h-[12px] w-[2px] flex-shrink-0 bg-accent"
                    />
                    <span className="text-[14px] leading-snug text-text-1">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/onboarding_early"
                className="group mt-s-6 inline-flex w-full items-center justify-center gap-s-3 rounded-r-1 bg-accent px-[28px] py-[18px] text-[15px] font-semibold uppercase leading-none tracking-button text-accent-ink transition-colors duration-wav ease-wav hover:bg-accent-hover active:translate-y-px"
              >
                Claim Early Access
                <span
                  aria-hidden
                  className="transition-transform duration-wav ease-wav group-hover:translate-x-[2px]"
                >
                  →
                </span>
              </Link>

              {/* Microcopy */}
              <p className="mt-s-4 text-center font-mono text-mono-caption uppercase tracking-mono-eyebrow text-text-3">
                <span className="text-text-1">
                  13 of 20 founding spots remaining
                </span>{" "}
                <span aria-hidden className="mx-s-1 text-line-strong">·</span>{" "}
                Private launch June 20
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
