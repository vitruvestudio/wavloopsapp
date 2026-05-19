"use client";

import { CheckIcon } from "@/components/landingPage/icons";
import { useCountUp, useInView, useReducedMotion } from "@/components/landingPage/hooks";

/* ----------------- Shared atmosphere overlay ----------------- */

function VisualAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 60% at 0% 0%, rgba(43,37,255,0.08), transparent 70%)",
      }}
    />
  );
}

/* ----------------- VISUAL 1 — Email subscribers ----------------- */

const EMAIL_ENTRIES = [
  { masked: "chris***@hotmail.com", fresh: true },
  { masked: "samples***@proton.me", fresh: true },
  { masked: "t.morris***@gmail.com", fresh: false },
  { masked: "r***@icloud.com", fresh: false },
];

const EMAIL_TAGS = [
  { name: "Newsletter", count: "3,012" },
  { name: "VIP", count: "1,108" },
  { name: "Beat buyers", count: "1,287" },
];

export function EmailListVisual() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const count = useCountUp(5672, 1600, inView);

  return (
    <div ref={ref} className="relative flex h-full flex-col bg-bg-deep p-s-4 sm:p-s-5">
      <VisualAtmosphere />

      <div className="relative flex items-baseline justify-between gap-s-3">
        <div className="flex flex-col gap-[2px]">
          <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
            Email subscribers
          </span>
          <span className="inline-flex items-center gap-s-1 font-mono text-[9px] uppercase tracking-mono-eyebrow text-accent">
            <span aria-hidden>↑</span>
            +127 this week
          </span>
        </div>
        <span className="font-display text-[36px] font-extrabold uppercase leading-none tracking-[-0.045em] text-text-1 tabular-nums sm:text-[42px]">
          {count.toLocaleString()}
        </span>
      </div>

      <div className="relative mt-s-4 flex flex-col gap-s-1 rounded-r-1 border border-line bg-surface-1 p-s-3">
        {EMAIL_ENTRIES.map((email) => (
          <div key={email.masked} className="flex items-center gap-s-3">
            <span
              aria-hidden
              className={`h-[6px] w-[6px] flex-shrink-0 ${
                email.fresh ? "animate-pulse bg-accent" : "bg-line-strong"
              }`}
            />
            <span className="truncate font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-2">
              {email.masked}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-s-3 flex flex-wrap gap-s-2">
        {EMAIL_TAGS.map((t) => (
          <span
            key={t.name}
            className="inline-flex h-[22px] items-center gap-s-2 rounded-r-1 border border-line-strong px-s-2 font-mono text-[10px] uppercase tracking-mono-data text-text-2"
          >
            {t.name}
            <span className="text-text-1">{t.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------- VISUAL 2 — Audience insights ----------------- */

const COUNTRIES = [
  { code: "US", name: "United States", pct: 38 },
  { code: "UK", name: "United Kingdom", pct: 24 },
  { code: "DE", name: "Germany", pct: 15 },
];

const SOURCES = [
  { name: "Direct", pct: 42 },
  { name: "Youtube", pct: 29 },
  { name: "Instagram", pct: 16 },
];

function AnimatedBar({ pct, inView, delay = 0 }: { pct: number; inView: boolean; delay?: number }) {
  return (
    <div className="h-[3px] flex-1 overflow-hidden bg-line-strong">
      <div
        aria-hidden
        className="h-full bg-accent transition-all ease-out"
        style={{
          width: inView ? `${pct}%` : "0%",
          transitionDuration: "1000ms",
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

export function InsightsVisual() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const baseDelay = reduced ? 0 : 100;

  return (
    <div ref={ref} className="relative flex h-full flex-col bg-bg-deep p-s-4 sm:p-s-5">
      <VisualAtmosphere />

      <div className="relative flex items-center justify-between gap-s-2">
        <div className="flex items-center gap-s-2">
          <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-line-strong" />
          <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-line-strong" />
          <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-line-strong" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-mono-eyebrow text-text-3">
          Last 30 days
        </span>
      </div>

      <div className="relative mt-s-4">
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          Top countries
        </span>
        <div className="mt-s-2 flex flex-col gap-s-2">
          {COUNTRIES.map((c, i) => (
            <div key={c.code} className="flex items-center gap-s-3">
              <span className="flex h-[18px] w-[28px] flex-shrink-0 items-center justify-center rounded-r-1 border border-line-strong font-mono text-[9px] uppercase tracking-[0.1em] text-text-2">
                {c.code}
              </span>
              <div className="flex flex-1 items-center gap-s-3">
                <AnimatedBar pct={c.pct} inView={inView} delay={i * baseDelay} />
                <span className="w-[30px] flex-shrink-0 text-right font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-1 tabular-nums">
                  {c.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-s-4">
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          Top sources
        </span>
        <div className="mt-s-2 flex flex-col gap-s-2">
          {SOURCES.map((s, i) => (
            <div key={s.name} className="flex items-center gap-s-3">
              <span className="w-[72px] flex-shrink-0 truncate font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-2">
                {s.name}
              </span>
              <div className="flex flex-1 items-center gap-s-3">
                <AnimatedBar
                  pct={s.pct}
                  inView={inView}
                  delay={(i + 3) * baseDelay}
                />
                <span className="w-[30px] flex-shrink-0 text-right font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-1 tabular-nums">
                  {s.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------- VISUAL 3 — Future buyers / post-download ----------------- */

const POST_OPTIONS: { label: string; primary?: boolean }[] = [
  { label: "Get the full kit", primary: true },
  { label: "Join VIP list" },
  { label: "Watch Youtube tutorial" },
];

const POST_STATS = [
  { value: 47, label: "Paid offer" },
  { value: 22, label: "VIP list" },
  { value: 11, label: "Discord" },
];

export function FutureBuyersVisual() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const v0 = useCountUp(POST_STATS[0].value, 1200, inView);
  const v1 = useCountUp(POST_STATS[1].value, 1400, inView);
  const v2 = useCountUp(POST_STATS[2].value, 1600, inView);
  const stats = [v0, v1, v2];

  return (
    <div ref={ref} className="relative flex h-full flex-col bg-bg-deep p-s-4 sm:p-s-5">
      <VisualAtmosphere />

      <div className="relative flex items-center justify-between gap-s-2">
        <div className="flex items-center gap-s-2">
          <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-r-1 bg-accent text-accent-ink">
            <CheckIcon />
          </div>
          <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-1">
            Download unlocked
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-mono-eyebrow text-text-3">
          2 min ago
        </span>
      </div>

      <div className="relative mt-s-3">
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          Next step
        </span>
        <p className="mt-[2px] text-[12px] leading-[1.5] text-text-2">
          Choose what happens after the download.
        </p>
      </div>

      <div className="relative mt-s-3 flex flex-col gap-s-2">
        {POST_OPTIONS.map((opt) => (
          <div
            key={opt.label}
            className={`group/opt flex items-center justify-between gap-s-2 rounded-r-1 border px-s-3 py-s-2 transition-colors duration-wav ease-wav ${
              opt.primary
                ? "border-accent bg-accent text-accent-ink"
                : "border-line bg-surface-1 text-text-1"
            }`}
          >
            <span className="truncate text-[11px] font-semibold uppercase tracking-button">
              {opt.label}
            </span>
            <span
              aria-hidden
              className={`flex-shrink-0 text-[12px] ${
                opt.primary && !reduced ? "animate-pulse" : ""
              }`}
            >
              →
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-s-3 border-t border-line pt-s-3">
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          Post-download clicks
        </span>
        <div className="mt-s-2 grid grid-cols-3 gap-s-2">
          {stats.map((value, i) => (
            <div key={POST_STATS[i].label} className="flex flex-col gap-[2px]">
              <span className="font-display text-[24px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1 tabular-nums sm:text-[28px]">
                {value}
              </span>
              <span className="truncate font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-2">
                {POST_STATS[i].label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
