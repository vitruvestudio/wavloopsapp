/**
 * OnboardingFlow — Release OS edition
 *
 * Multi-step waitlist intake at /onboarding_early. 4 questions, no Q5
 * (interest level was dropped — every new applicant is by definition early
 * access).
 *
 * Flow:
 *   intro → Q1 producer name → Q2 email → Q3 work URL
 *         → Q4 pain points (multi-select) → submit → final
 *
 * Visual language is aligned with the Release OS landing:
 *   - Same glow + grid bg pattern as the Hero
 *   - Stripped Topbar (logo + back link only — no nav, no CTA)
 *   - All buttons via `.wv-btn-primary` / `.wv-btn-ghost`
 *   - Eyebrows via `.wv-eyebrow`
 *   - rounded-pill for inputs/chips/buttons, rounded-card for cover artefacts
 *   - Honeypot + transition gating preserved from V1
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/landingPage/release-os/Icon";
import { submitOnboarding } from "./actions";

const TOTAL_QUESTIONS = 4;
const TRANSITION_MS = 700;

const PAIN_POINTS = [
  "Making thumbnails",
  "Writing titles & tags",
  "Uploading to YouTube",
  "Sending beats to artists",
  "Setting up sales pages",
  "Staying consistent",
  "Not sure yet",
] as const;

type StepId = "intro" | 1 | 2 | 3 | 4 | "final";

type Answers = {
  producerName: string;
  email: string;
  workUrl: string;
  painPoints: string[];
};

const INITIAL_ANSWERS: Answers = {
  producerName: "",
  email: "",
  workUrl: "",
  painPoints: [],
};

/* ================================================================== */
/* ATOMS — all migrated to Release OS DS tokens                        */
/* ================================================================== */

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="wv-btn wv-btn-primary wv-btn-lg group w-full justify-center disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[220px]"
    >
      {children}
      <span
        aria-hidden
        className="transition-transform duration-wav ease-wav group-hover:translate-x-[2px]"
      >
        →
      </span>
    </button>
  );
}

function QuestionEyebrow({ number }: { number: number }) {
  return (
    <div className="wv-eyebrow">
      <span className="slash">//</span> Question {number} of {TOTAL_QUESTIONS}
    </div>
  );
}

function QuestionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[clamp(28px,4vw,48px)] font-bold uppercase leading-[0.96] tracking-[-0.045em] text-text-1 text-balance">
      {children}
    </h2>
  );
}

function TextField({
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  required,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "url";
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      required={required}
      autoFocus
      className="h-[56px] w-full rounded-pill border border-line-strong bg-surface-1/40 px-[22px] text-[16px] text-text-1 placeholder:text-text-3 transition-colors duration-wav ease-wav focus:border-accent focus:outline-none"
    />
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-[40px] items-center gap-[8px] rounded-pill border px-[16px] font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors duration-wav ease-wav ${
        selected
          ? "border-accent bg-accent text-white"
          : "border-line-strong text-text-2 hover:border-text-3 hover:text-text-1"
      }`}
    >
      {selected && <Icon name="check" size={12} />}
      {label}
    </button>
  );
}

/* ================================================================== */
/* STATES                                                              */
/* ================================================================== */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-[16px] py-[48px]">
      <div className="flex items-center gap-[8px]">
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="h-[10px] w-[10px] rounded-full bg-accent motion-safe:animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.13em] text-text-2">
        Saving your answer
      </p>
    </div>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-[24px] text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:gap-[28px]">
      <span className="inline-flex items-center gap-[7px] rounded-pill border border-accent-line bg-accent-soft px-[10px] py-[5px] font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#cfd0ff]">
        <span
          aria-hidden
          className="h-[5px] w-[5px] rounded-full bg-accent"
          style={{ boxShadow: "0 0 0 3px var(--accent-soft)" }}
        />
        20 founding spots
      </span>
      <h1 className="max-w-[18ch] text-balance font-display text-[clamp(32px,5vw,56px)] font-bold uppercase leading-[0.95] tracking-[-0.045em] text-text-1">
        Claim your{" "}
        <span className="wv-kw">early-access</span> spot.
      </h1>
      <p className="max-w-[44ch] text-pretty text-[clamp(15px,1.3vw,17px)] leading-[1.55] text-text-2">
        Four quick questions so we can understand what part of the workflow
        Wavloops should handle for you first.
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
        <span className="text-text-1">No credit card required</span>{" "}
        <span aria-hidden className="mx-[6px] text-line-strong">
          ·
        </span>{" "}
        Takes under 1 minute
      </p>
      <div className="mt-[8px]">
        <PrimaryButton onClick={onStart}>Start</PrimaryButton>
      </div>
    </div>
  );
}

function FinalScreen() {
  return (
    <div className="flex flex-col items-center gap-[24px] text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:gap-[28px]">
      <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-accent text-white">
        <Icon name="check" size={32} />
      </span>
      <h1 className="max-w-[18ch] text-balance font-display text-[clamp(28px,4.4vw,46px)] font-bold uppercase leading-[0.95] tracking-[-0.045em] text-text-1">
        You&rsquo;re on the founding producer list.
      </h1>
      <p className="max-w-[44ch] text-pretty text-[clamp(15px,1.3vw,17px)] leading-[1.55] text-text-2">
        We&rsquo;ll be in touch as soon as your spot opens. Your{" "}
        <b className="font-semibold text-text-1">early-access price</b> is now{" "}
        <b className="font-semibold text-text-1">locked for life</b>.
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
        <Icon
          name="lock"
          size={11}
          className="mr-[6px] inline-block text-accent align-[-1px]"
        />
        No credit card required
      </p>
      <div className="mt-[8px]">
        <Link href="/" className="wv-btn wv-btn-ghost wv-btn-lg group">
          Back to site
          <span
            aria-hidden
            className="transition-transform duration-wav ease-wav group-hover:translate-x-[2px]"
          >
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ================================================================== */
/* QUESTION SCREENS                                                    */
/* ================================================================== */

type TextQuestionProps = {
  number: number;
  title: string;
  placeholder: string;
  type: string;
  inputMode?: "text" | "email" | "url";
  autoComplete?: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  validate?: (v: string) => boolean;
};

function TextQuestion({
  number,
  title,
  placeholder,
  type,
  inputMode,
  autoComplete,
  helper,
  value,
  onChange,
  onNext,
  validate,
}: TextQuestionProps) {
  const isValid = validate ? validate(value) : value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onNext();
      }}
      className="flex flex-col gap-[24px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300"
    >
      <QuestionEyebrow number={number} />
      <QuestionTitle>{title}</QuestionTitle>
      <div className="flex flex-col gap-[10px]">
        <TextField
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required
        />
        {helper && (
          <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
            {helper}
          </p>
        )}
      </div>
      <div className="mt-[8px]">
        <PrimaryButton type="submit" disabled={!isValid}>
          Continue
        </PrimaryButton>
      </div>
    </form>
  );
}

function MultiSelectQuestion({
  number,
  title,
  helper,
  ctaLabel,
  options,
  value,
  onChange,
  onComplete,
}: {
  number: number;
  title: string;
  helper?: string;
  ctaLabel: string;
  options: ReadonlyArray<string>;
  value: string[];
  onChange: (v: string[]) => void;
  onComplete: () => void;
}) {
  const toggle = (option: string) => {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option],
    );
  };

  return (
    <div className="flex flex-col gap-[24px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300">
      <QuestionEyebrow number={number} />
      <QuestionTitle>{title}</QuestionTitle>
      <div className="flex flex-wrap gap-[10px]">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value.includes(option)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>
      {helper && (
        <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
          {helper}
        </p>
      )}
      <div className="mt-[8px]">
        <PrimaryButton onClick={onComplete} disabled={value.length === 0}>
          {ctaLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ================================================================== */
/* TOPBAR — stripped: brand on left, back + progress on right          */
/* ================================================================== */

function FlowTopbar({
  isQuestion,
  step,
  onBack,
}: {
  isQuestion: boolean;
  step: StepId;
  onBack: () => void;
}) {
  const stepNum = typeof step === "number" ? step : 0;

  return (
    <header className="relative z-10 bg-transparent">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-[20px] px-5 sm:px-8">
        {/* brand */}
        <Link
          href="/"
          aria-label="Wavloops home"
          className="flex shrink-0 items-center gap-[10px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Photos/wavloops-icon.png"
            alt=""
            className="block h-[22px] w-auto"
          />
          <span className="font-display text-[17px] font-bold tracking-[-0.01em] text-text-1">
            WAVLOOPS
            <span className="ml-px align-super text-[9px] text-accent">
              &trade;
            </span>
          </span>
        </Link>

        {/* right: progress + back */}
        <div className="ml-auto flex items-center gap-[12px]">
          {isQuestion && (
            <div className="hidden items-center gap-[10px] sm:flex">
              <div className="h-[2px] w-[120px] overflow-hidden rounded-full bg-line-strong">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500 ease-wav"
                  style={{ width: `${(stepNum / TOTAL_QUESTIONS) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
                {stepNum} / {TOTAL_QUESTIONS}
              </span>
            </div>
          )}

          {isQuestion ? (
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center gap-[6px] rounded-pill border border-line-strong bg-surface-1/40 px-[14px] py-[8px] font-mono text-[10px] uppercase tracking-[0.13em] text-text-2 backdrop-blur-md transition-colors duration-wav ease-wav hover:border-text-3 hover:text-text-1"
            >
              <span
                aria-hidden
                className="transition-transform duration-wav ease-wav group-hover:-translate-x-[2px]"
              >
                ←
              </span>
              Back
            </button>
          ) : (
            <Link
              href="/"
              className="group inline-flex items-center gap-[6px] rounded-pill border border-line-strong bg-surface-1/40 px-[14px] py-[8px] font-mono text-[10px] uppercase tracking-[0.13em] text-text-2 backdrop-blur-md transition-colors duration-wav ease-wav hover:border-text-3 hover:text-text-1"
            >
              <span
                aria-hidden
                className="transition-transform duration-wav ease-wav group-hover:-translate-x-[2px]"
              >
                ←
              </span>
              Back to Wavloops
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/* ================================================================== */
/* MAIN FLOW                                                           */
/* ================================================================== */

export function OnboardingFlow() {
  const [step, setStep] = useState<StepId>("intro");
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [transitioning, setTransitioning] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const goNext = (nextStep: StepId) => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setTransitioning(false);
    }, TRANSITION_MS);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setTransitioning(true);

    const [result] = await Promise.all([
      submitOnboarding({
        producerName: answers.producerName,
        email: answers.email,
        workUrl: answers.workUrl,
        painPoints: answers.painPoints,
        _honeypot: honeypot,
      }),
      // min duration keeps the transition smooth even if the network is fast
      new Promise((r) => setTimeout(r, TRANSITION_MS)),
    ]);

    if (!result.ok) {
      setSubmitError(result.error);
      setTransitioning(false);
      return;
    }

    setStep("final");
    setTransitioning(false);
  };

  const goBack = () => {
    if (typeof step !== "number") return;
    setStep(step === 1 ? "intro" : ((step - 1) as StepId));
  };

  const isQuestion = typeof step === "number";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg">
      {/* Hero-style glow + grid bg — softer here than on the landing
          (intensity dialled down so it doesn't pull focus from the form). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-200px] z-0 h-[680px] w-[1100px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(56% 60% at 50% 0%, rgba(43,37,255,0.22), rgba(43,37,255,0.04) 45%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
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

      {/* Honeypot — visually hidden, off-screen, ignored by a11y */}
      <input
        type="text"
        name="company"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] top-0 opacity-0"
      />

      <div className="relative z-[2] flex flex-1 flex-col">
        <FlowTopbar isQuestion={isQuestion} step={step} onBack={goBack} />

        <main className="relative flex flex-1 items-center justify-center px-5 py-[40px] sm:px-8 sm:py-[56px]">
          <div className="w-full max-w-[560px]">
            {transitioning ? (
              <LoadingState />
            ) : step === "intro" ? (
              <IntroScreen onStart={() => goNext(1)} />
            ) : step === 1 ? (
              <TextQuestion
                number={1}
                title="What's your producer name?"
                placeholder="Kreptone"
                type="text"
                autoComplete="name"
                value={answers.producerName}
                onChange={(producerName) =>
                  setAnswers((a) => ({ ...a, producerName }))
                }
                onNext={() => goNext(2)}
              />
            ) : step === 2 ? (
              <TextQuestion
                number={2}
                title="Where can we contact you?"
                placeholder="you@email.com"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={answers.email}
                onChange={(email) => setAnswers((a) => ({ ...a, email }))}
                onNext={() => goNext(3)}
                validate={(v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
              />
            ) : step === 3 ? (
              <TextQuestion
                number={3}
                title="Where can we see your work?"
                placeholder="https://instagram.com/yourname"
                helper="Instagram, YouTube, TikTok, BeatStars or website URL"
                type="url"
                inputMode="url"
                autoComplete="url"
                value={answers.workUrl}
                onChange={(workUrl) =>
                  setAnswers((a) => ({ ...a, workUrl }))
                }
                onNext={() => goNext(4)}
              />
            ) : step === 4 ? (
              <>
                <MultiSelectQuestion
                  number={4}
                  title="What slows you down today?"
                  helper="Select anything that matches — we'll prioritize accordingly"
                  ctaLabel="Submit"
                  options={PAIN_POINTS}
                  value={answers.painPoints}
                  onChange={(painPoints) =>
                    setAnswers((a) => ({ ...a, painPoints }))
                  }
                  onComplete={handleSubmit}
                />
                {submitError && (
                  <p
                    role="alert"
                    className="mt-[20px] text-center font-mono text-[10px] uppercase tracking-[0.13em] text-danger"
                  >
                    {submitError}
                  </p>
                )}
              </>
            ) : (
              <FinalScreen />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
