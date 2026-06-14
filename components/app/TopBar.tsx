/**
 * TopBar — Wavloops V3 global app chrome.
 *
 * Mirrors the prototype's `GlobalTopBar` exactly:
 *   [Search 440px max] [spacer] [● LIVE] | [Preview Server Page]
 *   [theme] [bell+dot] [account pill]
 *
 *   - Height 60, padding 0 22px
 *   - Border-bottom hairline, opaque bg-0 (no blur — that lives on the
 *     per-page header below it)
 *   - LIVE is a green-ok dot + uppercase mono kicker (sync status)
 *   - Preview Server Page = ghost-style secondary Button with `eye` icon —
 *     jumps to the artist gate preview for the currently-viewed server
 *   - Account = round-pill button (border-1, padding 0 8 0 6) holding
 *     the avatar + chevron-down
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

export function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="flex shrink-0 items-center border-b border-border-1 bg-bg-0"
      style={{ height: 60, padding: "0 22px", gap: 14, zIndex: 25 }}
    >
      {/* search — max 440 on the LEFT */}
      <div style={{ flex: 1, maxWidth: 440 }}>
        <div className="flex h-9 items-center gap-sp-2 rounded-md border border-border-1 bg-bg-inset px-sp-3 text-fg-3 transition-colors focus-within:border-accent">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search servers, beats, contacts…"
            className="t-body min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* spacer */}
      <div className="flex-1" />

      {/* live sync indicator */}
      <span
        className="t-mono-s inline-flex items-center"
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

      {/* vertical divider */}
      <div
        aria-hidden
        className="bg-border-2"
        style={{ width: 1, height: 24 }}
      />

      {/* preview public profile */}
      <Button variant="secondary" size="sm" icon="eye">
        Preview Server Page
      </Button>

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

      {/* account pill */}
      <button
        type="button"
        className="inline-flex items-center rounded-pill border border-border-1 transition-colors duration-fast hover:bg-bg-2"
        style={{ height: 40, padding: "0 8px 0 6px", gap: 9 }}
      >
        <Avatar name="Tyler Mills" label="TM" size={28} />
        <Icon name="chevron-down" size={15} className="text-fg-3" />
      </button>
    </header>
  );
}
