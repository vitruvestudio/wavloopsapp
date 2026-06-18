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
import { createPortal } from "react-dom";
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
        // Desktop: in-flow, width transitions with proto's --ease easing
        "lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-200 lg:ease",
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

/** Inputs for the Quick add dropdown. Each item navigates with a
 *  query param that the target page picks up to auto-open the
 *  relevant modal — keeps the dropdown stateless and the modal
 *  trigger logic colocated with the surface that owns the modal. */
const QUICK_ADD_ITEMS: ReadonlyArray<{
  href: string;
  icon: IconName;
  label: string;
  sub: string;
}> = [
  {
    href: "/servers/new",
    icon: "server",
    label: "New server",
    sub: "CREATE A SHAREABLE FOLDER",
  },
  {
    href: "/library?upload=1",
    icon: "upload",
    label: "Upload a beat",
    sub: "ADD TO YOUR LIBRARY",
  },
  {
    href: "/contacts?add=1",
    icon: "users",
    label: "Add an artist",
    sub: "CREATE A NEW CONTACT",
  },
];

function QuickAddButton({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Position the menu relative to the trigger's viewport rect so
  // `position: fixed` escapes the sidebar's overflow clipping. The
  // sidebar caps its inner column at ~244px expanded / 76px
  // collapsed, which is too narrow for a comfortable menu width —
  // fixed positioning lets us float over the main content area.
  const computeAnchor = React.useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setAnchor({
      top: rect.bottom + 8,
      left: collapsed ? rect.right + 8 : rect.left,
    });
  }, [collapsed]);

  React.useEffect(() => {
    if (!open) return;
    computeAnchor();
    const onResize = () => computeAnchor();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, computeAnchor]);

  // Click-outside + Escape close — defer the listener one tick so
  // the opening click on the trigger doesn't immediately fire it.
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const inWrap = wrapRef.current?.contains(e.target as Node);
      const inMenu = menuRef.current?.contains(e.target as Node);
      if (!inWrap && !inMenu) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const t = setTimeout(() => {
      document.addEventListener("pointerdown", onPointer);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Mobile + desktop expanded: full pill trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          "flex w-full items-center rounded-md border-none bg-accent text-accent-fg cursor-pointer",
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

      {/* Desktop collapsed only: circular icon trigger */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title="Quick add"
          aria-haspopup="menu"
          aria-expanded={open}
          className="mx-auto hidden items-center justify-center rounded-pill border-none bg-accent text-accent-fg cursor-pointer transition-colors duration-fast hover:bg-accent-hover lg:flex"
          style={{
            width: 48,
            height: 48,
            boxShadow: "0 6px 20px -6px var(--accent-glow)",
          }}
        >
          <Icon name="plus" size={22} />
        </button>
      )}

      {open && anchor && typeof document !== "undefined" &&
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Quick add"
          style={{
            position: "fixed",
            top: anchor.top,
            left: anchor.left,
            width: 280,
            background: "var(--bg-1)",
            border: "1px solid var(--border-1)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
            padding: 6,
            zIndex: 100,
          }}
        >
          <div
            className="t-mono-s"
            style={{
              padding: "8px 10px 6px",
              color: "var(--fg-3)",
              letterSpacing: "0.08em",
            }}
          >
            QUICK ADD
          </div>
          {QUICK_ADD_ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center transition-colors duration-fast"
              style={{
                gap: 12,
                padding: "10px 10px",
                borderRadius: "var(--r-sm)",
                textDecoration: "none",
                color: "var(--fg-1)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-sm)",
                  background: "var(--accent-surface)",
                  color: "var(--accent-text)",
                }}
              >
                <Icon name={it.icon} size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                  }}
                >
                  {it.label}
                </div>
                <div
                  className="t-mono-s"
                  style={{
                    color: "var(--fg-3)",
                    marginTop: 3,
                    letterSpacing: "0.08em",
                  }}
                >
                  {it.sub}
                </div>
              </div>
            </Link>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
