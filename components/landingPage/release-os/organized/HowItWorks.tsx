/**
 * HowItWorks — Section 04 of the /organized variant landing.
 *
 * Three step cards laid out in a row on desktop, stacking vertically below
 * 1040px. Same chevron + animation pattern as the root landing.
 *
 *   01  You         → Import (Instagram export + beats library)
 *   02  Automatic   → Organize (sorted table + tag chips)
 *   03  You+tracked → Send (beat → matched artists with fit % + send btn)
 */

import { Icon } from "../Icon";

/* ============ per-step visuals ============ */

function ImportVisual() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[14px] rounded-[10px] border border-dashed border-line-strong p-[14px]">
      <div
        className="relative isolate flex items-center gap-[10px] rounded-[10px] border border-line-strong bg-surface-2 px-[12px] py-[8px]"
        style={{ boxShadow: "0 14px 28px -12px rgba(0,0,0,0.85)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 translate-x-[7px] translate-y-[7px] rounded-[10px] border border-line opacity-[0.55]"
        />
        <span className="flex h-[20px] w-[20px] items-center justify-center rounded-[5px] bg-accent text-white">
          <Icon name="send" size={11} />
        </span>
        <span className="flex flex-col gap-[2px] font-mono text-[10px] leading-[1.2] tracking-[0.03em] text-text-1">
          instagram-export.csv
          <small className="text-[8px] tracking-[0.06em] text-text-3">
            312 contacts · 11.4 MB
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

function OrganizeVisual() {
  // 5 tag chips + a small contacts table preview
  const TAGS = ["R&B", "Trap", "Dark", "L.A.", "London"];
  const PREVIEW: ReadonlyArray<{ initials: string; name: string; meta: string }> =
    [
      { initials: "AK", name: "Ari Kova", meta: "R&B · LA" },
      { initials: "DJ", name: "Dae Jones", meta: "Singer · ATL" },
      { initials: "NV", name: "Nova V.", meta: "Alt-R&B · LDN" },
    ];

  return (
    <div className="flex flex-1 flex-col gap-[10px]">
      <div className="flex flex-wrap gap-[5px]">
        {TAGS.map((tag, i) => (
          <span
            key={tag}
            className={`inline-flex items-center rounded-pill px-[8px] py-[3px] font-mono text-[8.5px] uppercase tracking-[0.1em] ${
              i === 0
                ? "border border-accent-line bg-accent-soft text-[#cfd0ff]"
                : "border border-line-strong text-text-2"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-[5px]">
        {PREVIEW.map((row) => (
          <div
            key={row.name}
            className="flex items-center gap-[9px] rounded-[8px] border border-line bg-surface-1 px-[9px] py-[6px]"
          >
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 font-mono text-[9px] text-text-2">
              {row.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-text-1">
                {row.name}
              </div>
              <div className="truncate font-mono text-[7.5px] uppercase tracking-[0.05em] text-text-3">
                {row.meta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SendVisual() {
  // Source beat + 2 matched artists with fit %
  const matches: ReadonlyArray<{ initials: string; name: string; fit: number }> =
    [
      { initials: "AK", name: "Ari Kova", fit: 94 },
      { initials: "DJ", name: "Dae Jones", fit: 88 },
    ];

  return (
    <div className="flex flex-1 flex-col gap-[7px]">
      {/* source beat */}
      <div className="flex items-center gap-[10px] rounded-[9px] border border-accent-line bg-accent-soft px-[10px] py-[7px]">
        <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[5px] bg-accent text-white">
          <Icon name="play" size={11} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11.5px] font-semibold text-white">
            Rio Nights
          </div>
          <div className="font-mono text-[7.5px] uppercase tracking-[0.05em] text-[#cfd0ff]">
            R&B · 88 BPM
          </div>
        </div>
      </div>

      {/* match arrows */}
      {matches.map((m) => (
        <div
          key={m.name}
          className="flex items-center gap-[10px] rounded-[9px] border border-line bg-surface-1 px-[10px] py-[7px]"
        >
          <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 font-mono text-[9.5px] text-text-2">
            {m.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11.5px] font-semibold text-text-1">
              {m.name}
            </div>
          </div>
          <span className="font-mono text-[9px] text-text-2">{m.fit}%</span>
          <span className="rounded-pill bg-accent px-[8px] py-[3px] font-mono text-[8px] uppercase tracking-[0.08em] text-white">
            Send
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============ atoms ============ */

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
          {role.auto && <Icon name="bolt" size={11} className="text-accent" />}
          {role.label}
        </span>
      </header>

      <div className="mb-[18px] flex min-h-[172px] flex-col gap-[11px] rounded-[12px] border border-line bg-bg-deep p-[16px] max-[1040px]:min-h-0">
        <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-text-3">
          <span className="text-accent">//</span> {visLabel}
        </div>
        {visual}
      </div>

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

/* ============ section ============ */

const STEPS: ReadonlyArray<StepProps> = [
  {
    num: "01",
    role: { label: "You", auto: false },
    visLabel: "drop your contacts",
    visual: <ImportVisual />,
    title: "Import everything you've got",
    desc: "Drag your Instagram export, your beats, your existing list. We parse it all in one pass.",
  },
  {
    num: "02",
    role: { label: "Automatic", auto: true },
    visLabel: "sorted by mood + genre + location",
    visual: <OrganizeVisual />,
    title: "Wavloops organizes it",
    desc: "Genre, mood, artist type, location, last contact — searchable, filterable, sortable. No spreadsheet.",
  },
  {
    num: "03",
    role: { label: "You + tracked", auto: false },
    visLabel: "matched and sent",
    visual: <SendVisual />,
    title: "Send to the right ears",
    desc: "Pick a beat, see who it fits, send. Every reach-out tracked — who got what, when, who replied.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative overflow-hidden bg-bg py-[clamp(84px,11vw,132px)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-130px] z-0 h-[540px] w-[920px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(43,37,255,0.15), transparent 64%)",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-[1200px] px-5 sm:px-8">
        <header className="mx-auto mb-[clamp(46px,6vw,72px)] max-w-[760px] text-center">
          <div className="wv-eyebrow">
            <span className="slash">//</span> 004 — how it works
          </div>
          <h2 className="mt-[18px] text-balance font-display text-[clamp(32px,4.6vw,62px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1">
            Three steps. <span className="wv-kw">From mess to mailbox.</span>
          </h2>
        </header>

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
