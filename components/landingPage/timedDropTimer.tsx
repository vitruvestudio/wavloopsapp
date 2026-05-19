"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/components/landingPage/hooks";

const INITIAL_SECONDS = 2 * 3600 + 52 * 60 + 57; // 02:52:57

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function format(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

type Props = {
  className?: string;
  separatorClassName?: string;
};

export function TimedDropTimer({
  className = "",
  separatorClassName = "text-text-3",
}: Props) {
  const reduced = useReducedMotion();
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? INITIAL_SECONDS : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [reduced]);

  const [h, m, s] = format(seconds).split(":");

  return (
    <span className={className} aria-live="polite">
      {h}
      <span aria-hidden className={separatorClassName}>
        :
      </span>
      {m}
      <span aria-hidden className={separatorClassName}>
        :
      </span>
      {s}
    </span>
  );
}
