import type { ReactNode } from "react";
import {
  EmailListVisual,
  FutureBuyersVisual,
  InsightsVisual,
} from "@/components/landingPage/benefitVisuals";

type BenefitCardProps = {
  step: string;
  badge: string;
  title: string;
  description: string;
  visual: ReactNode;
};

function BenefitCard({ step, badge, title, description, visual }: BenefitCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-r-2 border border-line-strong bg-surface-1 transition-all duration-wav ease-wav hover:-translate-y-[2px] hover:border-text-1">
      <div className="border-b border-line">{visual}</div>
      <div className="flex flex-col gap-s-3 p-s-5 sm:p-s-6">
        <span className="inline-flex h-[22px] items-center gap-s-2 self-start rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
          <span aria-hidden className="text-text-3">{step}</span>
          <span aria-hidden className="text-line-strong">·</span>
          {badge}
        </span>
        <h3 className="text-[20px] font-semibold leading-tight text-text-1 sm:text-[22px]">
          {title}
        </h3>
        <p className="text-[14px] leading-[1.55] text-text-2">{description}</p>
      </div>
    </div>
  );
}

export function BenefitCards() {
  return (
    <section id="benefits" className="relative overflow-hidden bg-bg-deep">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(43,37,255,0.10), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-s-4 py-s-8 sm:px-s-5 sm:py-s-9">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-s-5 text-center sm:gap-s-6">
          <span className="inline-flex h-[22px] items-center gap-s-2 rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
            <span aria-hidden>●</span>
            What You Build
          </span>
          <h2 className="font-display text-[32px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-text-1 sm:text-[44px] md:text-[52px] lg:text-[60px] lg:leading-[0.88] lg:tracking-[-0.045em]">
            Build more than downloads.
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.55] text-text-2 sm:text-lead">
            Every gate helps you capture audience, understand performance, and
            create a path to future sales.
          </p>
        </div>

        <div className="mt-s-8 grid gap-s-5 sm:mt-s-9 lg:grid-cols-3 lg:gap-s-5">
          <BenefitCard
            step="01"
            badge="Email Capturing"
            title="Build an audience you own"
            description="Collect emails during unlock and keep your best fans in one place. Segment lists by campaign and reach them when your next drop is ready."
            visual={<EmailListVisual />}
          />
          <BenefitCard
            step="02"
            badge="Audience Insights"
            title="See what is working"
            description="Track views, unlocks and conversion rate in real time. Double down on the links and channels that actually grow your audience."
            visual={<InsightsVisual />}
          />
          <BenefitCard
            step="03"
            badge="Future Buyers"
            title="Create a path to your next sale"
            description="After the download, guide people toward your paid kit, Discord, newsletter or next release instead of letting them disappear."
            visual={<FutureBuyersVisual />}
          />
        </div>

        <div className="mt-s-8 border-t border-line-strong pt-s-5 sm:mt-s-9 sm:pt-s-6">
          <div className="flex flex-col gap-s-4 sm:flex-row sm:items-end sm:justify-between sm:gap-s-6">
            <div className="flex flex-col gap-s-2">
              <div className="flex items-center gap-s-2">
                <span aria-hidden className="h-[12px] w-[3px] bg-accent" />
                <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-3">
                  Reframe
                </span>
              </div>
              <p className="text-[18px] font-semibold leading-snug text-text-1 sm:text-[20px] md:text-title md:font-medium">
                Downloads are not the asset.{" "}
                <span className="text-accent">
                  The audience you build from them is.
                </span>
              </p>
            </div>
            <a
              href="#waitlist"
              className="group inline-flex items-center gap-s-2 self-start whitespace-nowrap font-mono text-mono-eyebrow uppercase tracking-mono-button text-text-2 transition-colors duration-wav ease-wav hover:text-text-1 sm:self-end"
            >
              Claim early access
              <span
                aria-hidden
                className="transition-transform duration-wav ease-wav group-hover:translate-x-[2px]"
              >
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
