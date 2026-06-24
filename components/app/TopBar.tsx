/**
 * TopBar — Wavloops V3 global app chrome (responsive).
 *
 * Layout (desktop, lg+):
 *   [Search 440px max] [spacer] [● LIVE] [plan badge] [theme] [bell+dot] [account pill]
 *
 * Mobile/Tablet adaptations (< lg):
 *   [Hamburger] [Search flex-1] [theme] [bell+dot] [avatar-only]
 *     - LIVE indicator hidden (< md)
 *     - Plan badge hidden (< md) — reachable from /settings on mobile
 *     - Account pill collapses to avatar-only (< sm)
 *
 * Height 60 desktop · 56 mobile. Padding 0 22 desktop · 0 14 mobile.
 */

"use client";

import * as React from "react";
import { AccountMenu } from "@/components/app/AccountMenu";
import { PlanBadge } from "@/components/app/PlanBadge";
import { ProducerNotificationsMenu } from "@/components/app/ProducerNotificationsMenu";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useProducerNotifications } from "@/app/(app)/_components/ProducerContext";

import { useTheme } from "@/lib/use-theme";

interface TopBarProps {
  /** Opens the mobile sidebar overlay (< lg only — hamburger hidden on lg+). */
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, toggle } = useTheme();
  const { unreadCount } = useProducerNotifications();
  const [notifsOpen, setNotifsOpen] = React.useState(false);

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

      {/* Search — h38 (proto's `size="sm"`), left-aligned, max 440px on lg+, grows on mobile */}
      <div className="min-w-0 flex-1 lg:max-w-[440px] lg:flex-none lg:basis-[440px]">
        <div
          className="flex items-center gap-sp-2 rounded-md border border-border-2 bg-bg-inset px-sp-3 text-fg-3 transition-colors focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
          style={{ height: 38 }}
        >
          <Icon name="search" size={17} className="text-fg-3" />
          <input
            type="search"
            placeholder="Search servers, beats, contacts…"
            className="t-body min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
            style={{ fontSize: 14 }}
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

      {/* plan badge — md+, links to /settings billing tab */}
      <PlanBadge />

      {/* theme toggle */}
      <IconButton
        name={theme === "dark" ? "sun" : "moon"}
        size={40}
        iconSize={18}
        onClick={toggle}
        label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="rounded-pill"
      />

      {/* notifications — bell + numbered badge + dropdown. Custom
              button (vs the IconButton primitive) so the badge can
              render a real unread count instead of just a dot.
              Mirrors the artist-side ArtistTopbar bell pattern so
              the two surfaces read as the same product. */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
          aria-haspopup="dialog"
          aria-expanded={notifsOpen}
          onClick={() => setNotifsOpen((v) => !v)}
          className="relative inline-flex items-center justify-center cursor-pointer rounded-pill transition-colors duration-fast"
          style={{
            width: 40,
            height: 40,
            border: "none",
            background: notifsOpen ? "var(--bg-2)" : "transparent",
            color: "var(--fg-2)",
          }}
        >
          <Icon name="bell" size={18} />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute inline-flex items-center justify-center"
              style={{
                top: 4,
                right: 4,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 700,
                border: "2px solid var(--bg-0)",
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <ProducerNotificationsMenu
          open={notifsOpen}
          onClose={() => setNotifsOpen(false)}
        />
      </div>

      {/* account pill + dropdown (Account / Settings / Upgrade / Log out) */}
      <AccountMenu />
    </header>
  );
}
