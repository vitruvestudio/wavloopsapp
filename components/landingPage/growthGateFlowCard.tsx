"use client";

import { useEffect, useState } from "react";
import {
  CheckIcon,
  DiscordIcon,
  EnvelopeIcon,
  InstagramIcon,
  LockIcon,
  YoutubeIcon,
  type IconComponent,
} from "@/components/landingPage/icons";

type Step = {
  icon: IconComponent;
  label: string;
  sub: string;
};

const STEPS: Step[] = [
  { icon: EnvelopeIcon, label: "Email capture", sub: "Leave your email" },
  {
    icon: InstagramIcon,
    label: "Instagram follow",
    sub: "Follow @producername",
  },
  {
    icon: YoutubeIcon,
    label: "Youtube subscribe",
    sub: "Subscribe to channel",
  },
  { icon: DiscordIcon, label: "Discord join", sub: "Join community" },
];

const RESULTS = [
  { value: "291", label: "Emails" },
  { value: "134", label: "Followers" },
  { value: "451", label: "Downloads" },
];

const STEP_INTERVAL_MS = 1400;
const CYCLE_PAUSE_MS = 3500;

export function GrowthGateFlowCard() {
  const [done, setDone] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) {
      setDone(3);
    }
  }, []);

  useEffect(() => {
    if (reduced) return;
    const delay = done < STEPS.length ? STEP_INTERVAL_MS : CYCLE_PAUSE_MS;
    const nextValue = done < STEPS.length ? done + 1 : 0;
    const t = setTimeout(() => setDone(nextValue), delay);
    return () => clearTimeout(t);
  }, [done, reduced]);

  const unlocked = done === STEPS.length;
  const progressPct = (done / STEPS.length) * 100;

  return (
    <div className="relative overflow-hidden rounded-r-2 border border-line-strong bg-surface-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-s-2 border-b border-line px-s-3 py-s-3 sm:px-s-4">
        <div className="flex min-w-0 items-center gap-s-2">
          <span
            className={`h-[6px] w-[6px] flex-shrink-0 bg-accent ${
              unlocked ? "" : "animate-pulse"
            }`}
          />
          <span className="truncate font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-1">
            Growth gate flow
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-s-5 p-s-4 sm:p-s-5">
        {/* Card title */}
        <div>
          <p className="text-[16px] font-semibold leading-snug text-text-1 sm:text-lead-sm">
            Exclusive Sample Pack
          </p>
          <p className="mt-[2px] text-[12px] leading-[1.5] text-text-2">
            Complete the steps below to unlock
          </p>
        </div>

        {/* Steps list */}
        <div className="flex flex-col gap-s-2">
          {STEPS.map((step, i) => {
            const isDone = i < done;
            const isActive = i === done && !unlocked && !reduced;
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-s-3 rounded-r-1 border px-s-3 py-s-3 transition-colors duration-300 ease-wav ${
                  isDone
                    ? "border-line bg-surface-2"
                    : isActive
                      ? "border-accent bg-bg-deep"
                      : "border-line bg-bg-deep"
                }`}
              >
                <div
                  className={`flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-r-1 transition-colors duration-wav ease-wav ${
                    isDone
                      ? "bg-accent text-accent-ink"
                      : isActive
                        ? "border border-accent text-accent"
                        : "border border-line-strong text-text-3"
                  }`}
                >
                  {isDone ? (
                    <CheckIcon />
                  ) : (
                    <span
                      aria-hidden
                      className="font-mono text-[10px] leading-none"
                    >
                      ○
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-s-2">
                    <span
                      className={`flex-shrink-0 transition-colors duration-wav ease-wav ${
                        isDone ? "text-text-2" : "text-text-3"
                      }`}
                    >
                      <Icon />
                    </span>
                    <span
                      className={`truncate font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow transition-colors duration-wav ease-wav ${
                        isDone ? "text-text-1" : "text-text-3"
                      }`}
                    >
                      Step 0{i + 1} · {step.label}
                    </span>
                  </div>
                  <span
                    className={`mt-[2px] truncate text-[12px] leading-[1.4] transition-colors duration-wav ease-wav ${
                      isDone ? "text-text-2" : "text-text-3"
                    }`}
                  >
                    {step.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between gap-s-2">
            <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
              Unlock progress
            </span>
            <span className="font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-1">
              {done}/{STEPS.length} done
            </span>
          </div>
          <div className="mt-s-2 h-[3px] w-full overflow-hidden bg-line-strong">
            <div
              className="h-full bg-accent transition-all duration-500 ease-wav"
              style={{ width: `${progressPct}%` }}
              aria-hidden
            />
          </div>
        </div>

        {/* Unlock button */}
        <button
          type="button"
          disabled={!unlocked}
          aria-disabled={!unlocked}
          aria-label={unlocked ? "Download unlocked" : "Unlock file — complete all steps"}
          className={`flex w-full items-center justify-center gap-s-2 rounded-r-1 px-s-4 py-s-4 text-[14px] font-semibold uppercase leading-none tracking-button transition-colors duration-wav ease-wav ${
            unlocked
              ? "bg-accent text-accent-ink"
              : "cursor-not-allowed border border-line-strong bg-surface-2 text-text-3"
          }`}
        >
          {unlocked ? <CheckIcon /> : <LockIcon />}
          {unlocked ? "Download unlocked" : "Unlock file"}
        </button>

        {/* Result module */}
        <div className="border-t border-line pt-s-4">
          <div className="flex items-center justify-between gap-s-2">
            <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
              Result captured · last 30 days
            </span>
          </div>
          <div className="mt-s-3 grid grid-cols-3 gap-s-3">
            {RESULTS.map((r) => (
              <div key={r.label} className="flex flex-col gap-s-1">
                <span className="font-display text-[24px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1 sm:text-[28px]">
                  {r.value}
                </span>
                <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-2">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
