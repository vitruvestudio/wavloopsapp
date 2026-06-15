/**
 * ArtistTopbar — light top bar for the artist panel.
 *
 * Right-aligned: theme toggle (stub for now), notification bell with
 * badge count, artist account chip (@handle + avatar).
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { ARTIST } from "../_mock";

export function ArtistTopbar() {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-end border-b border-border-1"
      style={{
        gap: 14,
        padding: "12px 26px",
        minHeight: 64,
        background:
          "color-mix(in oklch, var(--bg-0) 82%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Theme toggle (stub — wires to next-themes later) */}
      <button
        type="button"
        aria-label="Switch theme"
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
        <Icon name="moon" size={17} />
      </button>

      {/* Notification bell + badge */}
      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-md)",
          border: "none",
          background: "transparent",
          color: "var(--fg-2)",
        }}
      >
        <Icon name="bell" size={17} />
        {ARTIST.notifications > 0 && (
          <span
            aria-label={`${ARTIST.notifications} notifications`}
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
            {ARTIST.notifications}
          </span>
        )}
      </button>

      {/* Account chip */}
      <button
        type="button"
        className="inline-flex items-center cursor-pointer transition-colors duration-fast"
        style={{
          gap: 10,
          padding: "4px 8px 4px 12px",
          height: 38,
          borderRadius: 999,
          border: "1px solid var(--border-1)",
          background: "var(--bg-1)",
          color: "var(--fg-1)",
        }}
      >
        <span
          className="t-mono-s"
          style={{ color: "var(--fg-2)" }}
        >
          @{ARTIST.handle.toUpperCase()}
        </span>
        <Avatar name={ARTIST.handle} size={28} />
      </button>
    </header>
  );
}
