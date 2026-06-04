/**
 * FAQ — Section 08 of the Release OS landing
 *
 * Two-column layout:
 *   LEFT   : sticky header (eyebrow // 008 + H2 "Questions? Answered." + sub)
 *   RIGHT  : 6 collapsible Q&A items, single-open (opening one closes the others)
 *
 * The first question opens by default — a tiny attention nudge, plus it shows
 * how the accordion works at first glance.
 *
 * Open/close animation uses the modern `grid-template-rows: 0fr → 1fr` trick
 * for buttery height transitions without measuring scrollHeight in JS. The
 * plus icon rotates 45° on open to become an "×".
 *
 * Layout breakpoints:
 *   - default        : 2-col grid (0.7fr head / 1.3fr items), sticky head
 *   - max-[820px]    : single column, head not sticky, smaller answer padding
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`.
 */

"use client";

import { useState } from "react";
import { Icon } from "./Icon";

/* ================================================================== */
/* DATA                                                                */
/* ================================================================== */

interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const BOLD = "font-semibold text-text-1";

const FAQS: ReadonlyArray<FaqItem> = [
  {
    id: "daw",
    question: "Does it work with my DAW?",
    answer: (
      <>
        Yes. Wavloops works with <b className={BOLD}>any DAW</b> — FL Studio,
        Ableton, Logic, whatever you use. You just upload your exported beats,
        that&rsquo;s it.
      </>
    ),
  },
  {
    id: "safe",
    question: "Is my music safe?",
    answer: (
      <>
        <b className={BOLD}>100%.</b> Your beats stay yours. We never claim
        rights, never resell, never share your files. You stay in full control
        and approve everything before it goes out.
      </>
    ),
  },
  {
    id: "youtube",
    question: "Do I need a YouTube channel already?",
    answer: (
      <>
        Yep, you connect your own channel in <b className={BOLD}>one click</b>.
        Wavloops posts on your behalf, on your schedule — you keep full
        ownership of your channel and content.
      </>
    ),
  },
  {
    id: "edit",
    question: "Can I edit what Wavloops prepares?",
    answer: (
      <>
        <b className={BOLD}>Always.</b> Covers, titles, tags, descriptions —
        everything is auto-prepared, but you can tweak anything before
        it&rsquo;s live. Nothing goes out without your approval.
      </>
    ),
  },
  {
    id: "fees",
    question: "What about the Producer Wall fees?",
    answer: (
      <>
        <b className={BOLD}>Zero.</b> You keep 100% of your sales. No
        commission, ever.
      </>
    ),
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer: (
      <>
        Yes, <b className={BOLD}>no contract, no lock-in.</b> Cancel whenever
        you want.
      </>
    ),
  },
];

/* ================================================================== */
/* SUB-COMPONENT — single Q&A row                                       */
/* ================================================================== */

interface QAProps {
  item: FaqItem;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}

function QA({ item, isOpen, isLast, onToggle }: QAProps) {
  const panelId = `faq-panel-${item.id}`;
  const buttonId = `faq-button-${item.id}`;

  return (
    <div className={`border-t border-line ${isLast ? "border-b" : ""}`}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="group flex w-full cursor-pointer items-center gap-[18px] border-0 bg-transparent px-[4px] py-[22px] text-left text-text-1"
      >
        <span className="flex-1 text-balance font-display text-[clamp(16px,1.4vw,20px)] font-semibold tracking-[-0.02em]">
          {item.question}
        </span>
        <span
          className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border transition-[transform,border-color,color,background-color] duration-wav ease-wav ${
            isOpen
              ? "rotate-45 border-accent bg-accent text-white"
              : "border-line-strong text-text-2 group-hover:border-accent-line group-hover:text-text-1"
          }`}
        >
          <Icon name="plus" size={15} />
        </span>
      </button>

      {/* answer panel — animates via grid-template-rows 0fr ↔ 1fr */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="grid transition-[grid-template-rows] duration-wav ease-wav"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="m-0 text-pretty pb-[24px] pl-[4px] pr-[56px] text-[14.5px] leading-[1.62] text-text-2 max-[820px]:pr-[24px]">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* SECTION                                                             */
/* ================================================================== */

export function FAQ() {
  // First question opens by default — gives the user an instant "ah, that's how
  // it works" without forcing a click.
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  const toggle = (id: string) =>
    setOpenId((current) => (current === id ? null : id));

  return (
    <section
      id="faq"
      className="relative border-t border-line bg-bg py-[clamp(84px,11vw,132px)]"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-[0.7fr_1.3fr] items-start gap-[clamp(40px,5vw,80px)] px-5 sm:px-8 max-[820px]:grid-cols-1 max-[820px]:gap-[36px]">
        {/* ===== left: sticky header ===== */}
        <div className="sticky top-[96px] max-[820px]:static">
          <div className="wv-eyebrow">
            <span className="slash">//</span> 008 — faq
          </div>
          <h2 className="mt-[18px] max-w-[9ch] text-balance font-display text-[clamp(30px,3.6vw,50px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1 max-[820px]:max-w-none">
            Questions? Answered.
          </h2>
          <p className="m-0 mt-[20px] max-w-[30ch] text-[14px] leading-[1.6] text-text-2">
            Everything you need to know before you drop your first beat.
          </p>
        </div>

        {/* ===== right: Q&A list ===== */}
        <div className="flex flex-col">
          {FAQS.map((item, i) => (
            <QA
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              isLast={i === FAQS.length - 1}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
