/**
 * ArtistAccountMenu — TopBar account pill + dropdown for the
 * artist panel.
 *
 * Mirrors the producer-side `AccountMenu` (components/app/) on
 * purpose: same trigger anatomy (avatar + @handle pill, fills to
 * bg-2 when open), same dropdown chrome (220px panel, identity
 * header on top, items below a hairline, danger log-out), same
 * close mechanics (pointer-outside + Escape).
 *
 * Differences from the producer menu:
 *   - Only three items (Edit profile / Notifications / Log out)
 *     per Theo's call — the artist surface stays lean.
 *   - Trigger shows `@handle` text on sm+, hidden on mobile
 *     (same responsive rule the previous bare chip used).
 *   - Log-out is a no-op in Phase 1 — artist auth lands in Phase 2
 *     (magic link), at which point this button wires to whatever
 *     server action that introduces. Until then the button still
 *     renders so the visual shape matches what Phase 2 will ship.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { signOutArtistAction } from "@/app/auth/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ARTIST } from "../_mock";

interface MenuItem {
  icon: IconName;
  label: string;
  href: string;
}

const ITEMS: ReadonlyArray<MenuItem> = [
  { icon: "user", label: "Edit profile", href: "/listen/settings" },
  { icon: "bell", label: "Notifications", href: "/listen/notifications" },
];

export function ArtistAccountMenu() {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Trigger pill — same anatomy as the bare chip the topbar
          used to render, just with toggle behaviour + open fill. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center cursor-pointer transition-colors duration-fast"
        style={{
          gap: 8,
          padding: "4px",
          height: 38,
          borderRadius: 999,
          border: "1px solid var(--border-1)",
          background: open ? "var(--bg-2)" : "var(--bg-1)",
          color: "var(--fg-1)",
        }}
      >
        <span
          className="t-mono-s hidden sm:inline"
          style={{ color: "var(--fg-2)", padding: "0 8px" }}
        >
          @{ARTIST.handle.toUpperCase()}
        </span>
        <Avatar name={ARTIST.handle} size={28} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0"
          style={{
            top: 48,
            width: 240,
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
            padding: 6,
            zIndex: 60,
          }}
        >
          {/* Identity header — display name + email. */}
          <div
            className="flex items-center"
            style={{
              gap: 10,
              padding: "10px 10px 12px",
              borderBottom: "1px solid var(--border-1)",
              marginBottom: 6,
            }}
          >
            <Avatar name={ARTIST.handle} size={36} />
            <div className="min-w-0">
              <div
                className="t-title truncate"
                style={{ fontSize: 14 }}
              >
                {ARTIST.name}
              </div>
              <div
                className="t-mono-s truncate"
                style={{ marginTop: 3 }}
              >
                {ARTIST.email.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Items */}
          {ITEMS.map((it) => (
            <Link
              key={it.label}
              role="menuitem"
              href={it.href}
              onClick={() => setOpen(false)}
              className="flex w-full items-center text-fg-2 transition-colors duration-fast hover:bg-bg-3 hover:text-fg-1"
              style={{
                height: 38,
                padding: "0 10px",
                gap: 11,
                borderRadius: "var(--r-sm)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
            >
              <Icon name={it.icon} size={17} />
              {it.label}
            </Link>
          ))}

          <div
            aria-hidden
            style={{
              height: 1,
              background: "var(--border-1)",
              margin: "6px 0",
            }}
          />

          {/* Log out — Phase 2 wired to signOutArtistAction, which
              clears the session and lands on /auth/magic. Lives in
              its own <form> so the server action runs cleanly. */}
          <form action={signOutArtistAction}>
            <button
              type="submit"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center transition-colors duration-fast"
              style={{
                height: 38,
                padding: "0 10px",
                gap: 11,
                borderRadius: "var(--r-sm)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--danger)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--danger-surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Icon name="log-out" size={17} />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
