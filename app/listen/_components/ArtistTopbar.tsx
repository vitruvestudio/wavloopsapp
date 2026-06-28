/**
 * ArtistTopbar — light top bar for the artist panel.
 *
 * Right-aligned: theme toggle (stub for now), notification bell with
 * badge count, artist account chip (@handle + avatar).
 */

"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/lib/use-theme";
import { switchToProducerViewAction } from "@/app/auth/mode-switch";
import { ArtistAccountMenu } from "./ArtistAccountMenu";
import { useArtistContext } from "./ArtistContext";
import { ArtistNotificationsMenu } from "./ArtistNotificationsMenu";

interface ArtistTopbarProps {
  /** Called when the mobile hamburger is tapped. */
  onOpenDrawer?: () => void;
}

export function ArtistTopbar({ onOpenDrawer }: ArtistTopbarProps) {
  const { theme, toggle } = useTheme();
  const { notifications, viewer } = useArtistContext();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const unread = notifications.unreadCount;
  return (
    <header
      className="sticky top-0 z-20 flex items-center border-b border-border-1"
      style={{
        gap: 10,
        padding: "12px 18px",
        minHeight: 60,
        background:
          "color-mix(in oklch, var(--bg-0) 82%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Hamburger — opens the sidebar drawer on mobile only. */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={onOpenDrawer}
        className="lg:hidden inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-md)",
          border: "none",
          background: "transparent",
          color: "var(--fg-2)",
        }}
      >
        <Icon name="menu" size={18} />
      </button>

      {/* Search bar — mirrors the producer TopBar's position
          (left-aligned, max 440px on lg+, grows on mobile so it
          shares space with the right-cluster icons). */}
      <div className="min-w-0 flex-1 lg:max-w-[440px] lg:flex-none lg:basis-[440px]">
        <div
          className="flex items-center rounded-md border border-border-2 bg-bg-inset px-3 text-fg-3 transition-colors focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
          style={{ height: 38, gap: 8 }}
        >
          <Icon name="search" size={17} className="text-fg-3" />
          <input
            type="search"
            placeholder="Search beats, producers…"
            className="min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Desktop spacer — pushes the right cluster to the edge.
          Hidden on mobile so the search bar can use the whole row. */}
      <div className="hidden flex-1 lg:block" />

      {/* Panel switcher — segmented toggle (Artist | Producer).
          Only renders for multi-role users (a producer profile
          that finished onboarding); single-role artists never
          see it. */}
      {viewer.hasProducerProfile && (
        <form action={switchToProducerViewAction} className="contents">
          <PanelSwitcherToggle />
        </form>
      )}

      {/* Theme toggle — shared with the producer side, persisted
          in localStorage["wl-srv-theme"]. */}
      <button
        type="button"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        onClick={toggle}
        className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-md)",
          border: "none",
          background: "transparent",
          color: "var(--fg-2)",
        }}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
      </button>

      {/* Notification bell + badge + dropdown.
          Anchored via a position-relative wrapper so the menu's
          `right: 0` lands on the bell button's right edge. */}
      <div className="relative">
        <button
          type="button"
          aria-label="Notifications"
          aria-haspopup="dialog"
          aria-expanded={notifOpen}
          onClick={() => setNotifOpen((v) => !v)}
          className="relative inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-md)",
            border: "none",
            background: notifOpen ? "var(--bg-2)" : "transparent",
            color: "var(--fg-2)",
          }}
        >
          <Icon name="bell" size={17} />
          {unread > 0 && (
            <span
              aria-label={`${unread} unread notifications`}
              className="absolute inline-flex items-center justify-center"
              style={{
                top: 4,
                right: 4,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                border: "2px solid var(--bg-0)",
              }}
            >
              {unread}
            </span>
          )}
        </button>
        <ArtistNotificationsMenu
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
        />
      </div>

      {/* Account chip — toggles a dropdown menu (Edit profile /
          Notifications / Log out). Handle text hides on mobile;
          avatar always visible. Same trigger anatomy as before,
          now wrapped with click-to-open behaviour. */}
      <ArtistAccountMenu />
    </header>
  );
}

/** Pill toggle for the panel switcher. Lives inside its parent
 *  `<form action={switchToProducerViewAction}>` so the PRODUCER
 *  half can be a plain `type="submit"` button and useFormStatus
 *  picks up the pending state without prop drilling.
 *
 *  Both halves share the same fixed width so the thumb's slide
 *  lands cleanly on the right edge on submit. The thumb is an
 *  absolutely-positioned span that animates via `transform`
 *  (cheap, GPU-composited) — it sits at translateX(0) for
 *  ARTIST, translateX(100%) once the form goes pending. We don't
 *  wait for the redirect to advance the thumb: the optimistic
 *  slide gives the UI life while Next handles the round-trip.
 *
 *  Spinner inside the PRODUCER button when pending. Same animation
 *  as the ModeSwitchForm overlay so the affordance feels consistent
 *  with the existing menu-based switch. */
function PanelSwitcherToggle() {
  const { pending } = useFormStatus();
  const HALF_WIDTH = 78;
  const INNER_H = 24;

  return (
    <div
      role="group"
      aria-label="Switch panel"
      className="relative hidden sm:inline-flex shrink-0 items-center"
      style={{
        height: 28,
        padding: 2,
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-pill)",
      }}
    >
      {/* Sliding thumb — sits under the labels, slides on submit.
              Width matches one half so it lands flush on each side. */}
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
            ? `translateX(${HALF_WIDTH}px)`
            : "translateX(0)",
          transition:
            "transform 320ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      />

      {/* ARTIST — current state, non-clickable on purpose so
              accidentally clicking the current side can't submit
              an empty form. */}
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
        ARTIST
      </span>

      {/* PRODUCER — the submit. Swaps the label for a spinner
              while the action is pending so the click reads as
              "something is happening". */}
      <button
        type="submit"
        aria-label="Switch to producer panel"
        title="Switch to producer panel"
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
          "PRODUCER"
        )}
      </button>

      <style>{`
        @keyframes wlpPanelSwitchSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
