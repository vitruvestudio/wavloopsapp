/**
 * HowItWorks — Section 03 of the Release OS landing
 *
 * Three identically-sized step cards laid out in a row on desktop,
 * stacking vertically below 1040px. Between each pair, a small accent-blue
 * chevron animates toward the next step (rotating 90° on stack to point down).
 *
 *   01  You         → Drop your beats        (dropzone visual)
 *   02  Automatic   → Wavloops prepares it   (cover + 5-item checklist)
 *   03  Automatic   → It goes live           (3 destinations w/ status dots)
 *
 * Layout breakpoints:
 *   - default      : flex row, equal-width cards, horizontal chevrons
 *   - max-[1040px] : flex column, full-width cards, chevrons rotate to point down
 *   - max-[560px]  : the dropzone filechip stacks vertically (avoids cramping)
 *
 * The flow chevron animation respects `prefers-reduced-motion`
 * (see `.wv-anim-flow-arrow` in globals.css).
 *
 * Cover assets: /Photos/release-os/cover-1.jpg used in the auto-prepare visual.
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`.
 */

import { Icon } from "./Icon";

/* ------------------------------------------------------------------ */
/* Per-step visuals — each is the inner content of the .step-vis box. */
/* Kept inline here so the section file reads top-to-bottom like the   */
/* HTML reference; they're not reused anywhere else.                   */
/* ------------------------------------------------------------------ */

/** 01 — Dropzone: dashed area with a draggable file chip on top of a stacked shadow. */
function DropzoneVisual() {
  // Tiny accent-blue waveform inside the filechip (13 bars).
  const bars = Array.from({ length: 13 }, (_, i) => 4 + Math.abs(Math.sin(i * 0.8)) * 12);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[14px] rounded-[10px] border border-dashed border-line-strong p-[14px]">
      {/* file chip with a faint stacked outline behind */}
      <div
        className="relative isolate flex items-center gap-[10px] rounded-[10px] border border-line-strong bg-surface-2 px-[12px] py-[8px]"
        style={{ boxShadow: "0 14px 28px -12px rgba(0,0,0,0.85)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 translate-x-[7px] translate-y-[7px] rounded-[10px] border border-line opacity-[0.55]"
        />
        <span className="flex h-[16px] items-center gap-[2px]">
          {bars.map((h, i) => (
            <i
              key={i}
              className="w-[2.5px] shrink-0 rounded-[2px] bg-accent"
              style={{ height: `${h}px` }}
            />
          ))}
        </span>
        <span className="flex flex-col gap-[2px] font-mono text-[10px] leading-[1.2] tracking-[0.03em] text-text-1">
          rio-nights.wav
          <small className="text-[8px] tracking-[0.06em] text-text-3">
            WAV · 3.2 MB
          </small>
        </span>
      </div>

      <div className="flex items-center gap-[7px] font-mono text-[9px] uppercase tracking-[0.12em] text-text-3">
        <Icon name="upload" size={12} />
        drag, drop, done
      </div>
    </div>
  );
}

/** 02 — Auto-prepare: a cover + a 5-item checklist all ticked. */
function AutoPrepareVisual() {
  const checklist = ["Cover", "Title", "Description", "Tags", "Video"];

  return (
    <div className="flex flex-1 items-center gap-[14px]">
      <span className="block h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[10px] border border-line-strong">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Photos/release-os/cover-1.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
      <div className="flex flex-col gap-[9px]">
        {checklist.map((item) => (
          <span
            key={item}
            className="flex items-center gap-[9px] text-[12.5px] text-text-1"
          >
            <span className="inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-accent text-white">
              <Icon name="check" size={10} />
            </span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 03 — Goes live: 3 destinations with status dots. */
function GoesLiveVisual() {
  const destinations: ReadonlyArray<{
    icon: "youtube" | "globe" | "send";
    name: string;
    status: string;
  }> = [
    { icon: "youtube", name: "YouTube", status: "Scheduled · Tue 6 PM" },
    { icon: "globe", name: "Producer Wall", status: "Live · direct sales" },
    { icon: "send", name: "Contacts", status: "Sent · 1,240" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-[7px]">
      {destinations.map((d) => (
        <div
          key={d.name}
          className="flex min-w-0 items-center gap-[9px] rounded-[9px] border border-line bg-surface-1 px-[10px] py-[7px]"
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border border-line-strong text-text-2">
            <Icon name={d.icon} size={13} />
          </span>
          <span className="shrink-0 whitespace-nowrap text-[12px] font-semibold text-text-1">
            {d.name}
          </span>
          <span className="ml-auto flex min-w-0 items-center gap-[6px] overflow-hidden whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.06em] text-text-3">
            <span
              aria-hidden
              className="h-[5px] w-[5px] shrink-0 rounded-full bg-accent"
              style={{ boxShadow: "0 0 0 3px var(--accent-soft)" }}
            />
            <span className="truncate">{d.status}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step + flow primitives                                              */
/* ------------------------------------------------------------------ */

interface StepProps {
  num: string;
  role: { label: string; auto: boolean };
  visLabel: string;
  visual: React.ReactNode;
  title: string;
  desc: string;
}

function StepCard({ num, role, visLabel, visual, title, desc }: StepProps) {
  return (
    <article className="flex min-w-0 flex-1 flex-col rounded-card border border-line bg-surface-1 px-[22px] pb-[24px] pt-[22px] transition-[transform,border-color] duration-wav ease-wav hover:-translate-y-[3px] hover:border-accent-line">
      {/* num + role */}
      <header className="mb-[18px] flex items-center justify-between">
        <span className="font-display text-[34px] font-bold leading-none tracking-[-0.04em] text-accent">
          {num}
        </span>
        <span
          className={`inline-flex items-center gap-[5px] rounded-pill px-[10px] py-[5px] font-mono text-[8.5px] uppercase tracking-[0.13em] ${
            role.auto
              ? "border border-accent-line bg-accent-soft text-[#cfd0ff]"
              : "border border-line-strong text-text-2"
          }`}
        >
          {role.auto && (
            <Icon name="bolt" size={11} className="text-accent" />
          )}
          {role.label}
        </span>
      </header>

      {/* visual box */}
      <div className="mb-[18px] flex min-h-[172px] flex-col gap-[11px] rounded-[12px] border border-line bg-bg-deep p-[16px] max-[1040px]:min-h-0">
        <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-text-3">
          <span className="text-accent">//</span> {visLabel}
        </div>
        {visual}
      </div>

      {/* body — pinned to bottom of card */}
      <div className="mt-auto">
        <h3 className="m-0 mb-[8px] font-display text-[16px] font-semibold uppercase tracking-[-0.02em] text-text-1">
          {title}
        </h3>
        <p className="m-0 text-pretty text-[13.5px] leading-[1.55] text-text-2">
          {desc}
        </p>
      </div>
    </article>
  );
}

function FlowArrow() {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center text-accent max-[1040px]:h-[38px] max-[1040px]:w-auto max-[1040px]:rotate-90"
      style={{ width: "clamp(30px, 3.6vw, 58px)" }}
    >
      <Icon name="chev" size={22} className="wv-anim-flow-arrow" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const STEPS: ReadonlyArray<StepProps> = [
  {
    num: "01",
    role: { label: "You", auto: false },
    visLabel: "drop your beats",
    visual: <DropzoneVisual />,
    title: "Drop your beats",
    desc: "Upload your tracks once. Drag, drop, done.",
  },
  {
    num: "02",
    role: { label: "Automatic", auto: true },
    visLabel: "matched to your style",
    visual: <AutoPrepareVisual />,
    title: "Wavloops prepares everything",
    desc: "Cover, title, description, tags, video — auto-prepared in your style. Set your vibe once, it matches every time.",
  },
  {
    num: "03",
    role: { label: "Automatic", auto: true },
    visLabel: "going live, everywhere",
    visual: <GoesLiveVisual />,
    title: "It goes live, everywhere",
    desc: "Auto-posts to YouTube on your schedule, lands on your Producer Wall for direct sales, and reaches your contacts. You just approve.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative overflow-hidden bg-bg py-[clamp(84px,11vw,132px)]"
    >
      {/* top-centered blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-130px] z-0 h-[540px] w-[920px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(43,37,255,0.15), transparent 64%)",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* heading */}
        <header className="mx-auto mb-[clamp(46px,6vw,72px)] max-w-[760px] text-center">
          <div className="wv-eyebrow">
            <span className="slash">//</span> 003 — how it works
          </div>
          <h2 className="mt-[18px] text-balance font-display text-[clamp(32px,4.6vw,62px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1">
            Three steps to release.{" "}
            <span className="wv-kw">Only one is yours.</span>
          </h2>
        </header>

        {/* steps + flow arrows */}
        <div className="flex items-stretch max-[1040px]:flex-col">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="contents max-[1040px]:flex max-[1040px]:flex-col"
            >
              <StepCard {...step} />
              {i < STEPS.length - 1 && <FlowArrow />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
