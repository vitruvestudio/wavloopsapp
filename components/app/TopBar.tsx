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
import { useFormStatus } from "react-dom";
import { AccountMenu } from "@/components/app/AccountMenu";
import { PlanBadge } from "@/components/app/PlanBadge";
import { ProducerNotificationsMenu } from "@/components/app/ProducerNotificationsMenu";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import {
  useProducerNotifications,
  useProducerViewer,
} from "@/app/(app)/_components/ProducerContext";
import { switchToArtistViewAction } from "@/app/auth/mode-switch";

import { useTheme } from "@/lib/use-theme";

interface TopBarProps {
  /** Opens the mobile sidebar overlay (< lg only — hamburger hidden on lg+). */
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, toggle } = useTheme();
  const { unreadCount } = useProducerNotifications();
  const viewer = useProducerViewer();
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

      {/* Panel switcher — segmented toggle (Artist | Producer),
          mirrors the artist /listen topbar. Replaces the old
          LIVE indicator: a present-tense panel control is more
          useful than a static sync badge, and the AccountMenu
          already carries the same action via ModeSwitchForm.
          Only renders for multi-role users; producers without
          an artist profile never see it. */}
      {viewer?.hasArtistProfile && (
        <form action={switchToArtistViewAction} className="contents">
          <PanelSwitcherToggle />
        </form>
      )}

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

/** Pill toggle for the panel switcher — producer-side mirror of
 *  the artist topbar's. Lives inside its parent
 *  `<form action={switchToArtistViewAction}>` so useFormStatus
 *  can drive the pending visuals without prop drilling.
 *
 *  Layout mirrors the artist version exactly: same height, same
 *  half width, same thumb. The thumb just starts on the RIGHT
 *  (under PRODUCER, the current state) and slides LEFT toward
 *  ARTIST on submit. */
function PanelSwitcherToggle() {
  const { pending } = useFormStatus();
  const HALF_WIDTH = 78;
  const INNER_H = 24;

  return (
    <div
      role="group"
      aria-label="Switch panel"
      className="relative hidden md:inline-flex shrink-0 items-center"
      style={{
        height: 28,
        padding: 2,
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-pill)",
      }}
    >
      {/* Sliding thumb. Starts on the right (under PRODUCER, the
              current panel) and slides LEFT on submit. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 2,
          left: 2,
          width: HALF_WIDTH,
          height: INNER_H,
          borderRadius: "var(--r-pill)",
          background: "var(--bg-0)",
          boxShadow: "inset 0 0 0 1px var(--border-2)",
          transform: pending
            ? "translateX(0)"
            : `translateX(${HALF_WIDTH}px)`,
          transition:
            "transform 320ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      />

      {/* ARTIST — the submit. Swaps to a spinner while pending. */}
      <button
        type="submit"
        aria-label="Switch to artist panel"
        title="Switch to artist panel"
        disabled={pending}
        className="t-mono inline-flex items-center justify-center cursor-pointer"
        style={{
          position: "relative",
          width: HALF_WIDTH,
          height: INNER_H,
          padding: 0,
          fontSize: 10.5,
          letterSpacing: "0.04em",
          color: pending ? "var(--fg-1)" : "var(--fg-3)",
          background: "transparent",
          border: "none",
          borderRadius: "var(--r-pill)",
          transition: "color 220ms var(--ease)",
        }}
      >
        {pending ? (
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: "1.5px solid currentColor",
              borderTopColor: "transparent",
              animation: "wlpPanelSwitchSpin 0.8s linear infinite",
            }}
          />
        ) : (
          "ARTIST"
        )}
      </button>

      {/* PRODUCER — current state, non-clickable. */}
      <span
        aria-current={pending ? undefined : "true"}
        className="t-mono inline-flex items-center justify-center"
        style={{
          position: "relative",
          width: HALF_WIDTH,
          height: INNER_H,
          fontSize: 10.5,
          letterSpacing: "0.04em",
          color: pending ? "var(--fg-3)" : "var(--fg-1)",
          transition: "color 220ms var(--ease)",
        }}
      >
        PRODUCER
      </span>

      <style>{`
        @keyframes wlpPanelSwitchSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
