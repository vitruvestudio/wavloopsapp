/**
 * Sidebar — Wavloops V3 producer-side nav.
 *
 * Mirrors the prototype exactly (see proto: components_app.jsx →
 * ProducerShell + QuickAdd + PSidebarItem):
 *   - Width: 244px expanded · 76px collapsed
 *   - Padding: 20px (12-14)px 14px
 *   - Brand row at TOP: Logo (size 27) | IconButton(sidebar-toggle)
 *     → collapsed = just the toggle, centered
 *   - Hairline divider beneath the brand row
 *   - Quick add button (accent-filled, chevron-down at the end —
 *     suggests a popover that lands in a future commit)
 *   - Nav items: Servers · Beat library · Contacts · Settings
 *     → active = accent-surface fill + 3px accent left-bar
 *     → hover = bg-2 fill + fg-1 text
 *
 * State (collapsed/expanded) persisted in localStorage (`wl-srv-nav`).
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Other URL prefixes that count as "active" for this nav item. */
  matches?: string[];
}

const NAV: ReadonlyArray<NavItem> = [
  { href: "/dashboard", label: "Servers", icon: "server", matches: ["/servers"] },
  { href: "/library", label: "Beat library", icon: "library", matches: ["/beats"] },
  { href: "/contacts", label: "Contacts", icon: "users" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const STORAGE_KEY = "wl-srv-nav";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState<boolean>(false);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const width = collapsed ? 76 : 244;
  const pad = collapsed ? 12 : 14;

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden border-r border-border-1 bg-bg-1 transition-[width] duration-200 ease-out"
      style={{
        width,
        paddingTop: 20,
        paddingLeft: pad,
        paddingRight: pad,
        paddingBottom: 14,
      }}
    >
      {/* Brand row — Logo on left, toggle on right; collapsed = just toggle */}
      <div
        className="flex items-center"
        style={{
          height: 40,
          justifyContent: collapsed ? "center" : "space-between",
          paddingLeft: collapsed ? 0 : 6,
          paddingRight: collapsed ? 0 : 2,
        }}
      >
        {!collapsed && <Logo size={27} />}
        <IconButton
          name="sidebar-toggle"
          size={36}
          onClick={toggle}
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        />
      </div>

      {/* Hairline beneath brand */}
      <div
        className="h-px bg-border-1"
        style={{
          marginTop: 0,
          marginBottom: 14,
          marginLeft: collapsed ? 4 : 6,
          marginRight: collapsed ? 4 : 6,
        }}
      />

      {/* Quick add — primary CTA with chevron-down (popover lands later) */}
      <QuickAddButton collapsed={collapsed} />

      {/* Nav */}
      <nav
        className="flex flex-col gap-[4px]"
        style={{ marginTop: 14 }}
      >
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.matches?.some((m) => pathname.startsWith(m)) ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                "group relative flex items-center rounded-md transition-[background-color,color] duration-fast",
                active
                  ? "bg-accent-surface text-accent-text font-semibold"
                  : "text-fg-2 hover:bg-bg-2 hover:text-fg-1 font-medium",
              ].join(" ")}
              style={{
                height: 42,
                padding: collapsed ? 0 : "0 13px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 13,
                fontSize: 14.5,
                fontFamily: "var(--font-body)",
              }}
            >
              {active && !collapsed && (
                <span
                  aria-hidden
                  className="absolute rounded-pill bg-accent"
                  style={{
                    left: 0,
                    top: 11,
                    bottom: 11,
                    width: 3,
                  }}
                />
              )}
              <Icon name={item.icon} size={20} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />
    </aside>
  );
}

/**
 * QuickAddButton — placeholder for the dropdown popover.
 *
 * V1 visual only: the chevron-down hints at "click to expand options"
 * (New server / Upload a beat / Add an artist). The actual popover lands
 * with the Upload modal + New Contact modal in the next commit.
 */
function QuickAddButton({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <button
        type="button"
        title="Quick add"
        className="mx-auto flex items-center justify-center rounded-pill border-none bg-accent text-accent-fg transition-colors duration-fast hover:bg-accent-hover"
        style={{
          width: 48,
          height: 48,
          boxShadow: "0 6px 20px -6px var(--accent-glow)",
        }}
      >
        <Icon name="plus" size={22} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center rounded-md border-none bg-accent text-accent-fg transition-colors duration-fast hover:bg-accent-hover"
      style={{
        height: 44,
        padding: "0 14px",
        gap: 10,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 14.5,
        boxShadow: "0 6px 20px -8px var(--accent-glow)",
      }}
    >
      <Icon name="plus" size={19} />
      Quick add
      <span className="flex-1" />
      <Icon name="chevron-down" size={15} />
    </button>
  );
}
