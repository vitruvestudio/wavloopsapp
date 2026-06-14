/**
 * Sidebar — Wavloops V3 producer-side nav.
 *
 * Responsive strategy:
 *   <  lg : `position: fixed`, 280px wide overlay, slides in from the
 *           left, controlled by `mobileOpen` prop. Backdrop + body
 *           scroll lock are handled by the (app) layout.
 *   >= lg : In-flow, 244px expanded / 76px collapsed, collapse state
 *           persisted in localStorage `wl-srv-nav`.
 *
 * Tapping a nav link on mobile auto-closes the sidebar.
 *
 * Inside structure (mirrors proto components_app.jsx):
 *   - Brand row: Logo on left, sidebar-toggle on right.
 *     Collapsed (desktop only) → just the toggle, centered.
 *     Mobile → Logo + close button on the right.
 *   - Hairline divider
 *   - Quick add button (accent, with chevron-down hint)
 *   - Nav items (Servers · Beat library · Contacts · Settings)
 *     Active = accent-surface fill + 3px accent left-bar.
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
  matches?: string[];
}

const NAV: ReadonlyArray<NavItem> = [
  { href: "/dashboard", label: "Servers", icon: "server", matches: ["/servers"] },
  { href: "/library", label: "Beat library", icon: "library", matches: ["/beats"] },
  { href: "/contacts", label: "Contacts", icon: "users" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const STORAGE_KEY = "wl-srv-nav";

interface SidebarProps {
  /** Mobile-only: whether the overlay sidebar is open. Ignored on lg+. */
  mobileOpen: boolean;
  /** Called when the mobile sidebar should close (backdrop, link tap, etc). */
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  // Desktop collapsed state — only respected at lg+
  const [collapsed, setCollapsed] = React.useState<boolean>(false);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Desktop width depends on collapsed; mobile is always 280px (overlay).
  const desktopWidthClass = collapsed ? "lg:w-[76px]" : "lg:w-[244px]";
  const desktopPadClass = collapsed
    ? "lg:px-[12px]"
    : "lg:px-[14px]";

  return (
    <aside
      className={[
        // Mobile: fixed overlay
        "fixed inset-y-0 left-0 z-50 w-[280px] px-[18px]",
        "transition-transform duration-200 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: in-flow, no transform
        "lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width]",
        desktopWidthClass,
        desktopPadClass,
        // Shared
        "flex shrink-0 flex-col overflow-hidden border-r border-border-1 bg-bg-1",
        "pt-[20px] pb-[14px]",
      ].join(" ")}
    >
      {/* Brand row */}
      <div
        className={[
          "flex items-center",
          // Mobile: Logo left, close button right
          "justify-between",
          // Desktop: same when expanded, center when collapsed
          collapsed ? "lg:justify-center lg:px-0" : "lg:justify-between lg:pl-[6px] lg:pr-[2px]",
        ].join(" ")}
        style={{ height: 40 }}
      >
        {/* On desktop collapsed, hide the logo (only show toggle). On mobile + expanded desktop, show logo. */}
        <span className={collapsed ? "lg:hidden" : ""}>
          <Logo size={27} />
        </span>

        {/* Mobile close button */}
        <IconButton
          name="close"
          size={36}
          onClick={onCloseMobile}
          label="Close menu"
          className="lg:hidden"
        />

        {/* Desktop sidebar toggle — hidden on mobile */}
        <IconButton
          name="sidebar-toggle"
          size={36}
          onClick={toggleCollapsed}
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:inline-flex"
        />
      </div>

      {/* Hairline */}
      <div
        className={[
          "h-px bg-border-1",
          "mb-[14px] mx-[6px]",
          collapsed ? "lg:mx-[4px]" : "lg:mx-[6px]",
        ].join(" ")}
      />

      {/* Quick add */}
      <QuickAddButton collapsed={collapsed} />

      {/* Nav */}
      <nav className="mt-[14px] flex flex-col gap-[4px]">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.matches?.some((m) => pathname.startsWith(m)) ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={onCloseMobile}
              className={[
                "group relative flex items-center rounded-md transition-[background-color,color] duration-fast",
                active
                  ? "bg-accent-surface text-accent-text font-semibold"
                  : "text-fg-2 hover:bg-bg-2 hover:text-fg-1 font-medium",
                // Mobile: always expanded layout. Desktop: collapsed-aware.
                "gap-[13px] px-[13px]",
                collapsed ? "lg:gap-0 lg:justify-center lg:px-0" : "lg:gap-[13px] lg:px-[13px]",
              ].join(" ")}
              style={{
                height: 42,
                fontSize: 14.5,
                fontFamily: "var(--font-body)",
              }}
            >
              {/* 3px accent left-bar on active — hidden when collapsed (desktop only) */}
              {active && (
                <span
                  aria-hidden
                  className={[
                    "absolute rounded-pill bg-accent",
                    collapsed ? "lg:hidden" : "",
                  ].join(" ")}
                  style={{ left: 0, top: 11, bottom: 11, width: 3 }}
                />
              )}
              <Icon name={item.icon} size={20} />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />
    </aside>
  );
}

function QuickAddButton({ collapsed }: { collapsed: boolean }) {
  // Collapsed only matters on desktop. On mobile we always show the full pill.
  return (
    <>
      {/* Mobile + desktop expanded: full pill */}
      <button
        type="button"
        className={[
          "flex w-full items-center rounded-md border-none bg-accent text-accent-fg",
          "transition-colors duration-fast hover:bg-accent-hover",
          collapsed ? "lg:hidden" : "",
        ].join(" ")}
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

      {/* Desktop collapsed only: circular icon */}
      {collapsed && (
        <button
          type="button"
          title="Quick add"
          className="mx-auto hidden items-center justify-center rounded-pill border-none bg-accent text-accent-fg transition-colors duration-fast hover:bg-accent-hover lg:flex"
          style={{
            width: 48,
            height: 48,
            boxShadow: "0 6px 20px -6px var(--accent-glow)",
          }}
        >
          <Icon name="plus" size={22} />
        </button>
      )}
    </>
  );
}
