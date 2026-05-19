"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SCROLL_THRESHOLD_PX = 600;
const PRODUCER = {
  name: "40minsmusic",
  avatar: "/Photos/40mins_img.jpeg",
};

export function StickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/70 backdrop-blur-xl transition-transform duration-300 ease-wav supports-[backdrop-filter]:bg-bg/60 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-s-3 px-s-4 py-s-3 sm:px-s-5">
        <div className="flex min-w-0 items-center gap-s-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PRODUCER.avatar}
            alt=""
            loading="lazy"
            className="h-[32px] w-[32px] flex-shrink-0 rounded-r-1 border border-line-strong object-cover sm:h-[36px] sm:w-[36px]"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold leading-tight text-text-1">
              {PRODUCER.name}&apos;s free kit page
            </span>
            <span className="hidden font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3 sm:inline">
              See what your fans see when they unlock
            </span>
          </div>
        </div>

        <Link
          href="/preview"
          tabIndex={visible ? 0 : -1}
          className="group/preview inline-flex flex-shrink-0 items-center gap-s-2 rounded-r-1 bg-accent px-s-4 py-s-3 text-[12px] font-semibold uppercase leading-none tracking-button text-accent-ink transition-colors duration-wav ease-wav hover:bg-accent-hover active:translate-y-px sm:px-s-5 sm:text-[13px]"
        >
          <span className="hidden sm:inline">Preview as a fan</span>
          <span className="sm:hidden">Preview</span>
          <span
            aria-hidden
            className="transition-transform duration-wav ease-wav group-hover/preview:translate-x-[2px]"
          >
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
