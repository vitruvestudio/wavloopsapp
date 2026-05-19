"use client";

import { useState } from "react";
import Link from "next/link";
import { Atmosphere } from "@/components/landingPage/atmosphere";
import { CheckIcon } from "@/components/landingPage/icons";
import { submitOnboarding } from "./actions";

const TOTAL_QUESTIONS = 5;
const TRANSITION_MS = 700;

const GROW_OPTIONS = [
  "Email list",
  "Instagram followers",
  "Tiktok followers",
  "Youtube subscribers",
  "Discord community",
  "Future kit sales",
  "Not sure yet",
];

const INTEREST_OPTIONS = [
  { value: "early-access", label: "I want early access" },
  { value: "test-real-kit", label: "I want to test it with a real free kit" },
  { value: "curious", label: "I'm just curious for now" },
];

type StepId = "intro" | 1 | 2 | 3 | 4 | 5 | "final";

type Answers = {
  producerName: string;
  email: string;
  workUrl: string;
  growGoals: string[];
  interestLevel: string;
};

const INITIAL_ANSWERS: Answers = {
  producerName: "",
  email: "",
  workUrl: "",
  growGoals: [],
  interestLevel: "",
};

/* ---------- Shared atoms ---------- */

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
      className="group inline-flex w-full items-center justify-center gap-s-3 rounded-r-1 bg-accent px-[28px] py-[18px] text-[15px] font-semibold uppercase leading-none tracking-button text-accent-ink transition-colors duration-wav ease-wav hover:bg-accent-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[200px]"
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
    <div className="inline-flex items-center gap-s-2">
      <span aria-hidden className="h-[12px] w-[3px] bg-accent" />
      <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-3">
        Question {number} of {TOTAL_QUESTIONS}
      </span>
    </div>
  );
}

function QuestionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[28px] font-extrabold uppercase leading-[0.95] tracking-[-0.04em] text-text-1 sm:text-[36px] md:text-[40px]">
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
      className="h-[56px] w-full rounded-r-1 border border-line-strong bg-transparent px-s-4 text-[18px] text-text-1 placeholder:text-text-3 transition-colors duration-wav ease-wav focus:border-accent focus:outline-none"
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
      className={`inline-flex h-[36px] items-center rounded-r-1 px-s-4 text-[13px] font-medium transition-colors duration-wav ease-wav ${
        selected
          ? "border border-accent bg-accent text-accent-ink"
          : "border border-line-strong text-text-2 hover:border-text-1 hover:text-text-1"
      }`}
    >
      {label}
    </button>
  );
}

function OptionCard({
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
      className={`flex w-full items-center gap-s-4 rounded-r-2 border px-s-5 py-s-4 text-left transition-colors duration-wav ease-wav ${
        selected
          ? "border-accent bg-surface-2"
          : "border-line-strong bg-surface-1 hover:border-text-1"
      }`}
    >
      <span
        className={`flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-wav ease-wav ${
          selected ? "border-accent" : "border-line-strong"
        }`}
      >
        {selected && (
          <span aria-hidden className="h-[10px] w-[10px] rounded-full bg-accent" />
        )}
      </span>
      <span className="text-[15px] font-medium leading-snug text-text-1 sm:text-[16px]">
        {label}
      </span>
    </button>
  );
}

/* ---------- Loading state ---------- */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-s-4 py-s-8">
      <div className="flex items-center gap-s-2">
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="h-[10px] w-[10px] rounded-full bg-accent motion-safe:animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-2">
        Saving your answer
      </p>
    </div>
  );
}

/* ---------- Screens ---------- */

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-s-5 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:gap-s-6">
      <span className="inline-flex h-[22px] items-center gap-s-2 rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
        <span aria-hidden className="animate-pulse">●</span>
        Early Access
      </span>
      <h1 className="font-display text-[32px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-text-1 sm:text-[44px] md:text-[52px]">
        Claim your early access spot.
      </h1>
      <p className="max-w-md text-[15px] leading-[1.55] text-text-2 sm:text-lead">
        Answer a few quick questions so we can understand what you want to grow
        with Wavloops.
      </p>
      <p className="font-mono text-mono-caption uppercase tracking-mono-eyebrow text-text-3">
        <span className="text-text-1">Only 20 founding producer spots</span>{" "}
        <span aria-hidden className="mx-s-1 text-line-strong">·</span> No credit
        card required
      </p>
      <div className="mt-s-3">
        <PrimaryButton onClick={onStart}>Start</PrimaryButton>
      </div>
    </div>
  );
}

function FinalScreen() {
  return (
    <div className="flex flex-col items-center gap-s-5 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:gap-s-6">
      <div className="flex h-[64px] w-[64px] items-center justify-center rounded-r-2 bg-accent text-accent-ink">
        <CheckIcon />
      </div>
      <h1 className="font-display text-[32px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-text-1 sm:text-[40px] md:text-[44px]">
        You&apos;re on the founding producer list.
      </h1>
      <p className="max-w-md text-[15px] leading-[1.55] text-text-2 sm:text-lead">
        We&apos;re reviewing the first 20 producer spots before the private
        launch. If selected, you&apos;ll get early access and lock your founding
        price at{" "}
        <span className="font-semibold text-text-1">$4.99/mo</span> instead of{" "}
        <span className="text-text-3 line-through">$19/mo</span>.
      </p>
      <p className="font-mono text-mono-caption uppercase tracking-mono-eyebrow text-text-3">
        <span className="text-text-1">Private launch planned for June 20</span>{" "}
        <span aria-hidden className="mx-s-1 text-line-strong">·</span> No credit
        card required
      </p>
      <div className="mt-s-3">
        <Link
          href="/"
          className="group inline-flex w-full items-center justify-center gap-s-3 rounded-r-1 bg-accent px-[28px] py-[18px] text-[15px] font-semibold uppercase leading-none tracking-button text-accent-ink transition-colors duration-wav ease-wav hover:bg-accent-hover active:translate-y-px sm:w-auto sm:min-w-[200px]"
        >
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
      className="flex flex-col gap-s-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300"
    >
      <QuestionEyebrow number={number} />
      <QuestionTitle>{title}</QuestionTitle>
      <div className="flex flex-col gap-s-2">
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
          <p className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
            {helper}
          </p>
        )}
      </div>
      <div className="mt-s-2">
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
  options,
  value,
  onChange,
  onNext,
}: {
  number: number;
  title: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
}) {
  const toggle = (option: string) => {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option],
    );
  };

  return (
    <div className="flex flex-col gap-s-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300">
      <QuestionEyebrow number={number} />
      <QuestionTitle>{title}</QuestionTitle>
      <div className="flex flex-wrap gap-s-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value.includes(option)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>
      <p className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
        Select any that apply
      </p>
      <div className="mt-s-2">
        <PrimaryButton onClick={onNext} disabled={value.length === 0}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}

function SingleSelectQuestion({
  number,
  title,
  options,
  value,
  onChange,
  onSubmit,
}: {
  number: number;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-s-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300">
      <QuestionEyebrow number={number} />
      <QuestionTitle>{title}</QuestionTitle>
      <div className="flex flex-col gap-s-3">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
      <div className="mt-s-2">
        <PrimaryButton onClick={onSubmit} disabled={!value}>
          Submit
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ---------- Main flow ---------- */

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
        growGoals: answers.growGoals,
        interestLevel: answers.interestLevel,
        _honeypot: honeypot,
      }),
      // Minimum 700ms loading to keep transition feel consistent
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
      <Atmosphere intensity="strong" />

      {/* Honeypot — bots fill all visible-like fields, real users skip it */}
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

      <div className="relative flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-s-4 px-s-4 py-s-4 sm:px-s-5 sm:py-s-5">
          {isQuestion ? (
            <button
              type="button"
              onClick={goBack}
              className="group inline-flex items-center gap-s-2 rounded-r-1 border border-line-strong bg-surface-1/60 px-s-3 py-s-2 font-mono text-mono-tiny uppercase tracking-mono-button text-text-2 backdrop-blur-md transition-colors duration-wav ease-wav hover:border-text-1 hover:text-text-1"
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
              className="group inline-flex items-center gap-s-2 rounded-r-1 border border-line-strong bg-surface-1/60 px-s-3 py-s-2 font-mono text-mono-tiny uppercase tracking-mono-button text-text-2 backdrop-blur-md transition-colors duration-wav ease-wav hover:border-text-1 hover:text-text-1"
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

          {isQuestion && (
            <div className="flex items-center gap-s-3">
              <div className="hidden h-[2px] w-[120px] overflow-hidden bg-line-strong sm:block">
                <div
                  className="h-full bg-accent transition-all duration-500 ease-wav"
                  style={{ width: `${(step / TOTAL_QUESTIONS) * 100}%` }}
                />
              </div>
              <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                {step} / {TOTAL_QUESTIONS}
              </span>
            </div>
          )}
        </div>

        {/* Main content area */}
        <main className="relative flex flex-1 items-center justify-center px-s-4 py-s-6 sm:px-s-5 sm:py-s-7">
          <div className="w-full max-w-lg">
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
                helper="Instagram, Youtube, Tiktok, BeatStars, Gumroad or website URL"
                type="url"
                inputMode="url"
                autoComplete="url"
                value={answers.workUrl}
                onChange={(workUrl) => setAnswers((a) => ({ ...a, workUrl }))}
                onNext={() => goNext(4)}
              />
            ) : step === 4 ? (
              <MultiSelectQuestion
                number={4}
                title="What do you want to grow with your free downloads?"
                options={GROW_OPTIONS}
                value={answers.growGoals}
                onChange={(growGoals) =>
                  setAnswers((a) => ({ ...a, growGoals }))
                }
                onNext={() => goNext(5)}
              />
            ) : step === 5 ? (
              <>
                <SingleSelectQuestion
                  number={5}
                  title="How interested are you in testing Wavloops?"
                  options={INTEREST_OPTIONS}
                  value={answers.interestLevel}
                  onChange={(interestLevel) =>
                    setAnswers((a) => ({ ...a, interestLevel }))
                  }
                  onSubmit={handleSubmit}
                />
                {submitError && (
                  <p
                    role="alert"
                    className="mt-s-4 text-center font-mono text-mono-caption uppercase tracking-mono-eyebrow text-destructive"
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
