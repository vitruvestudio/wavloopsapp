/**
 * ArtistTopbar — light top bar for the artist panel.
 *
 * Right-aligned: theme toggle (stub for now), notification bell with
 * badge count, artist account chip (@handle + avatar).
 */

"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/lib/use-theme";
import { ArtistAccountMenu } from "./ArtistAccountMenu";
import { useArtistContext } from "./ArtistContext";
import { ArtistNotificationsMenu } from "./ArtistNotificationsMenu";

interface ArtistTopbarProps {
  /** Called when the mobile hamburger is tapped. */
  onOpenDrawer?: () => void;
}

export function ArtistTopbar({ onOpenDrawer }: ArtistTopbarProps) {
  const { theme, toggle } = useTheme();
  const { notifications } = useArtistContext();
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

      {/* Spacer pushes the right cluster to the edge. */}
      <div className="flex-1" />

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
