/**
 * AccountMenu — TopBar account pill + dropdown.
 *
 * Pixel-ported from prototype `components_app.jsx` (GlobalTopBar lines
 * 179-207). Single combined component because the trigger style depends
 * on whether the menu is open (bg flips to bg-2).
 *
 * Behaviour:
 *   - Click the pill toggles the menu.
 *   - Click outside closes it.
 *   - Escape closes it.
 *   - Selecting an item closes the menu before navigating.
 *   - "Log out" submits a tiny <form action={signOutAction}> — keeps the
 *     server action wiring idiomatic without needing a route handler.
 *
 * Panel anatomy (from proto):
 *   width 220 · bg-2 · border-2 · r-md · shadow-pop · padding 6
 *   position absolute, right 0, top 48
 *
 *   ┌─ name (.t-title 14) ────────────┐
 *   │  email.toUpperCase (.t-mono-s)   │
 *   ├─ hairline ─────────────────────┤
 *   │  user   Account                 │  ← 38h items, r-sm, hover bg-3
 *   │  gear   Settings                │
 *   │  flame  Upgrade plan            │
 *   ├─ hairline ─────────────────────┤
 *   │  log-out  Log out  (danger)    │  ← hover bg-danger-surface
 *   └─────────────────────────────────┘
 *
 * User data is hardcoded to "Tyler Mills / tyler@studio.com" for V1.
 * When the `profiles` table lands (J3), the parent layout will fetch
 * it server-side and pass it in via a prop.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";

interface AccountMenuProps {
  name?: string;
  email?: string;
  /** Two-letter avatar fallback. Defaults to first letter of first + last word. */
  avatarLabel?: string;
}

interface MenuItem {
  icon: IconName;
  label: string;
  href: string;
}

const ITEMS: ReadonlyArray<MenuItem> = [
  { icon: "user", label: "Account", href: "/settings?tab=account" },
  { icon: "settings", label: "Settings", href: "/settings" },
  { icon: "flame", label: "Upgrade plan", href: "/settings?tab=billing" },
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AccountMenu({
  name = "Tyler Mills",
  email = "tyler@studio.com",
  avatarLabel,
}: AccountMenuProps) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const label = avatarLabel ?? initialsFromName(name);

  // Click-outside + Escape close
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
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center rounded-pill border border-border-1 transition-colors duration-fast hover:bg-bg-2"
        style={{
          height: 40,
          padding: "0 8px 0 6px",
          gap: 9,
          background: open ? "var(--bg-2)" : "transparent",
        }}
      >
        <Avatar name={name} label={label} size={28} />
        <Icon
          name="chevron-down"
          size={15}
          className="hidden text-fg-3 sm:inline-block"
        />
      </button>

      {/* Panel */}
      {open && (
        <div
          role="menu"
          className="bg-bg-2 border-border-2 absolute right-0 border"
          style={{
            top: 48,
            width: 220,
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
            padding: 6,
            zIndex: 60,
          }}
        >
          {/* User identity header */}
          <div
            style={{
              padding: "10px 10px 12px",
              borderBottom: "1px solid var(--border-1)",
              marginBottom: 6,
            }}
          >
            <div className="t-title" style={{ fontSize: 14 }}>
              {name}
            </div>
            <div className="t-mono-s" style={{ marginTop: 3 }}>
              {email}
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

          {/* Divider */}
          <div
            aria-hidden
            style={{
              height: 1,
              background: "var(--border-1)",
              margin: "6px 0",
            }}
          />

          {/* Log out — own form so the server action runs cleanly */}
          <form action={signOutAction}>
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
                (e.currentTarget.style.background = "var(--danger-surface)")
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
