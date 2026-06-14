/**
 * TopBar — Wavloops V3 sticky producer header.
 *
 * Slots (left → right):
 *   - Page title + sub kicker (passed via context or page header — V1 lets
 *     the page itself render the title; the TopBar is just chrome)
 *   - Search input (centred-ish, grows to fill)
 *   - Theme toggle (sun/moon, persists to localStorage `wl-srv-theme`)
 *   - Notifications bell (dot when unread — V1 = always off)
 *   - Account avatar / menu (placeholder, dropdown comes later)
 *
 * Background is bg-0 with backdrop-blur — the only translucent surface
 * in the app per DS spec.
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

const THEME_KEY = "wl-srv-theme";

function useTheme() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  React.useEffect(() => {
    const stored = (localStorage.getItem(THEME_KEY) as "dark" | "light" | null) ?? "dark";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);
  const toggle = React.useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);
  return { theme, toggle };
}

export function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-sp-4 border-b border-border-1 px-sp-6"
      style={{
        height: 64,
        background: "color-mix(in oklch, var(--bg-0) 80%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* search */}
      <div className="flex h-9 min-w-0 flex-1 items-center gap-sp-2 rounded-md border border-border-1 bg-bg-inset px-sp-3 text-fg-3 transition-colors focus-within:border-accent">
        <Icon name="search" size={16} />
        <input
          type="search"
          placeholder="Search beats, servers, contacts…"
          className="t-body min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
        />
      </div>

      {/* right cluster */}
      <div className="flex shrink-0 items-center gap-sp-1">
        <IconButton
          name={theme === "dark" ? "sun" : "moon"}
          onClick={toggle}
          label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        />
        <IconButton name="bell" label="Notifications" />
        <button
          type="button"
          className="ml-sp-2 inline-flex items-center gap-sp-2 rounded-pill p-[3px] pr-sp-3 text-fg-2 transition-colors hover:bg-bg-2 hover:text-fg-1"
        >
          <Avatar name="Producer" size={28} />
          <Icon name="chevron-down" size={14} />
        </button>
      </div>
    </header>
  );
}
