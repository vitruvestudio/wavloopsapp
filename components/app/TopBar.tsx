/**
 * TopBar — Wavloops V3 global app chrome (responsive).
 *
 * Layout (desktop, lg+):
 *   [Search 440px max] [spacer] [● LIVE] | [Preview Server Page]
 *   [theme] [bell+dot] [account pill]
 *
 * Mobile/Tablet adaptations (< lg):
 *   [Hamburger] [Search flex-1] [theme] [bell+dot] [avatar-only]
 *     - LIVE indicator hidden (< md)
 *     - Vertical divider hidden (< md)
 *     - "Preview Server Page" button hidden (< md), reachable from the
 *       per-page right slot when relevant
 *     - Account pill collapses to avatar-only (< sm)
 *
 * Height 60 desktop · 56 mobile. Padding 0 22 desktop · 0 14 mobile.
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";

const THEME_KEY = "wl-srv-theme";

function useTheme() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  React.useEffect(() => {
    const stored =
      (localStorage.getItem(THEME_KEY) as "dark" | "light" | null) ?? "dark";
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

interface TopBarProps {
  /** Opens the mobile sidebar overlay (< lg only — hamburger hidden on lg+). */
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className={[
        "flex shrink-0 items-center border-b border-border-1 bg-bg-0",
        "h-[56px] gap-[10px] px-[14px]",
        "lg:h-[60px] lg:gap-[14px] lg:px-[22px]",
      ].join(" ")}
      style={{ zIndex: 25 }}
    >
      {/* Hamburger — opens the mobile sidebar, hidden on lg+ */}
      <IconButton
        name="menu"
        size={40}
        iconSize={20}
        onClick={onMenuClick}
        label="Open menu"
        className="rounded-pill lg:hidden"
      />

      {/* Search — left-aligned, max 440px on lg+, grows on mobile */}
      <div className="min-w-0 flex-1 lg:max-w-[440px] lg:flex-none lg:basis-[440px]">
        <div className="flex h-9 items-center gap-sp-2 rounded-md border border-border-1 bg-bg-inset px-sp-3 text-fg-3 transition-colors focus-within:border-accent">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search…"
            className="t-body min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* spacer (desktop only — mobile lets right cluster touch the search) */}
      <div className="hidden flex-1 lg:block" />

      {/* live sync indicator — md+ */}
      <span
        className="t-mono-s hidden items-center md:inline-flex"
        style={{ gap: 7, padding: "0 4px" }}
      >
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--ok)",
            boxShadow: "0 0 8px 0 var(--ok)",
          }}
        />
        LIVE
      </span>

      {/* vertical divider — md+ */}
      <div
        aria-hidden
        className="hidden bg-border-2 md:block"
        style={{ width: 1, height: 24 }}
      />

      {/* preview server page — md+ */}
      <div className="hidden md:block">
        <Button variant="secondary" size="sm" icon="eye">
          Preview Server Page
        </Button>
      </div>

      {/* theme toggle */}
      <IconButton
        name={theme === "dark" ? "sun" : "moon"}
        size={40}
        iconSize={18}
        onClick={toggle}
        label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="rounded-pill"
      />

      {/* notifications */}
      <IconButton
        name="bell"
        size={40}
        iconSize={18}
        label="Notifications"
        dot
        className="rounded-pill"
      />

      {/* account pill — collapses to avatar-only under sm */}
      <button
        type="button"
        className="inline-flex items-center rounded-pill border border-border-1 transition-colors duration-fast hover:bg-bg-2"
        style={{ height: 40, padding: "0 4px 0 4px", gap: 9 }}
      >
        <Avatar name="Tyler Mills" label="TM" size={28} />
        <Icon
          name="chevron-down"
          size={15}
          className="hidden text-fg-3 sm:inline-block sm:mr-[4px]"
        />
      </button>
    </header>
  );
}
