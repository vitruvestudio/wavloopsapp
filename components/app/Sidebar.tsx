/**
 * Sidebar — Wavloops V3 producer-side nav (248px expanded · 72px collapsed).
 *
 * Layout:
 *   - Logo at the top (mark only when collapsed)
 *   - Hairline separator
 *   - "Quick add" CTA (primary accent) — placeholder popover in a later commit
 *   - Hairline separator
 *   - Nav items: Servers, Beat library, Contacts, Settings
 *   - Active item: accent-surface fill + 3px accent left-bar (per DS spec)
 *   - Collapse toggle at the bottom (chevron / sidebar icon)
 *
 * State (collapsed/expanded) is persisted in localStorage (`wl-srv-nav`)
 * so the producer's preference sticks across sessions.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV: ReadonlyArray<NavItem> = [
  { href: "/dashboard", label: "Servers", icon: "server" },
  { href: "/library", label: "Beat library", icon: "library" },
  { href: "/contacts", label: "Contacts", icon: "users" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const STORAGE_KEY = "wl-srv-nav";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState<boolean>(false);

  // Hydrate from localStorage after mount (avoids SSR flash).
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

  const width = collapsed ? 72 : 248;

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-border-1 bg-bg-1 transition-[width] duration-200 ease-out"
      style={{ width }}
    >
      {/* logo */}
      <div
        className="flex items-center px-sp-5 py-sp-5"
        style={{ height: 72, justifyContent: collapsed ? "center" : "flex-start" }}
      >
        <Logo size={collapsed ? 28 : 26} markOnly={collapsed} />
      </div>

      {/* Quick add */}
      <div className="px-sp-3 pb-sp-3">
        {collapsed ? (
          <IconButton
            name="plus"
            size={44}
            iconSize={20}
            label="Quick add"
            className="!bg-accent !text-accent-fg hover:!bg-accent-hover mx-auto"
          />
        ) : (
          <Button icon="plus" full size="md">
            Quick add
          </Button>
        )}
      </div>

      <div className="mx-sp-3 h-px bg-border-1" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-[2px] px-sp-2 py-sp-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                "group relative flex items-center rounded-md transition-colors duration-fast",
                active
                  ? "bg-accent-surface text-accent-text"
                  : "text-fg-2 hover:bg-bg-2 hover:text-fg-1",
                collapsed
                  ? "h-11 justify-center"
                  : "h-10 gap-sp-3 px-sp-3 text-[14px]",
              ].join(" ")}
            >
              {/* 3px accent left-bar on active (DS spec) */}
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-pill bg-accent"
                />
              )}
              <Icon name={item.icon} size={collapsed ? 22 : 18} />
              {!collapsed && (
                <span className="font-body font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle at the bottom */}
      <div className="border-t border-border-1 p-sp-3">
        <IconButton
          name="sidebar-toggle"
          size={collapsed ? 44 : 36}
          iconSize={collapsed ? 22 : 18}
          onClick={toggle}
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={collapsed ? "mx-auto" : ""}
        />
      </div>
    </aside>
  );
}
