/**
 * ArtistSidebar — left rail for the artist panel.
 *
 * Top-level structure:
 *   - WAVLOOPS logo
 *   - Search input (mock — Phase 3 will wire a real beat search)
 *   - "Liked Songs" pinned card (accent), cross-producers aggregate
 *   - "YOUR PRODUCERS · N" header
 *   - One ProducerGroup per producer, expandable, with its servers
 *     listed inside. Active server highlighted; servers with unread
 *     beats show a blue dot.
 *
 * Active state comes from the URL pathname so refreshing keeps the
 * right server selected. Mock data lives in app/listen/_mock.ts.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import {
  PRODUCERS,
  PRODUCER_COUNT,
  likedBeats,
  type MockProducer,
  type MockServer,
} from "../_mock";

interface ArtistSidebarProps {
  /** Mobile drawer state — ignored at lg+ where the sidebar is
   *  always visible as a sticky rail. */
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

export function ArtistSidebar({
  drawerOpen,
  onCloseDrawer,
}: ArtistSidebarProps) {
  const [search, setSearch] = React.useState("");
  const pathname = usePathname();
  const likedCount = likedBeats().length;

  // Close the drawer on Escape (mobile only).
  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseDrawer?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, onCloseDrawer]);

  return (
    <>
      {/* Mobile backdrop — only rendered when the drawer is open
          and covers the rest of the page. */}
      {drawerOpen && (
        <div
          aria-hidden
          onClick={onCloseDrawer}
          className="lg:hidden fixed inset-0"
          style={{
            zIndex: 49,
            background: "oklch(0 0 0 / 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}
      <aside
        className={[
          "flex flex-col shrink-0",
          // Mobile: fixed slide-in drawer.
          "fixed top-0 left-0 z-50 transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: sticky rail, always visible (override the
          // mobile translate-x via lg: prefix).
          "lg:sticky lg:translate-x-0",
        ].join(" ")}
        style={{
          width: 280,
          height: "100vh",
          // Match the producer-side Sidebar exactly: bg-1 surface
          // + the DS border-1 divider, same token cascade as the
          // producer rail so a theme tweak there carries here.
          background: "var(--bg-1)",
          borderRight: "1px solid var(--border-1)",
        }}
      >
      {/* Logo — the Logo primitive already composes the logomark +
          the WAVLOOPS wordmark, no need to add a second span. */}
      <div
        className="flex items-center shrink-0"
        style={{ padding: "20px 22px" }}
      >
        <Logo size={28} />
      </div>

      {/* Search */}
      <div
        style={{
          padding: "0 18px 16px",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <div
          className="flex items-center bg-bg-inset border border-border-2 transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
          style={{
            gap: 10,
            padding: "0 12px",
            height: 38,
            borderRadius: "var(--r-md)",
          }}
        >
          <Icon
            name="search"
            size={14}
            style={{ color: "var(--fg-3)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your beats…"
            className="flex-1 bg-transparent outline-none placeholder:text-fg-4 min-w-0"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13.5,
              color: "var(--fg-1)",
            }}
          />
        </div>
      </div>

      {/* Liked Songs */}
      <div
        style={{
          padding: "14px 14px 14px",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <Link
          href="/listen/liked"
          className="flex items-center transition-colors duration-fast"
          style={{
            gap: 12,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            background:
              pathname === "/listen/liked"
                ? "var(--accent-surface)"
                : "transparent",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--r-sm)",
              background:
                "linear-gradient(135deg, oklch(0.55 0.2 270), oklch(0.45 0.22 320))",
              color: "#fff",
            }}
          >
            <Icon name="heart" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14.5,
                fontWeight: 600,
                color: "var(--fg-1)",
              }}
            >
              Liked Songs
            </div>
            <div
              className="t-mono-s truncate"
              style={{ color: "var(--fg-3)", marginTop: 2 }}
            >
              {likedCount} BEAT{likedCount === 1 ? "" : "S"} · ALL
              PRODUCERS
            </div>
          </div>
        </Link>
      </div>

      {/* Producers header */}
      <div
        className="t-mono-s"
        style={{
          padding: "12px 22px 8px",
          color: "var(--fg-3)",
        }}
      >
        YOUR PRODUCERS · {PRODUCER_COUNT}
      </div>

      {/* Scrollable producer list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "0 10px 18px" }}
      >
        {PRODUCERS.map((p) => (
          <ProducerGroup
            key={p.handle}
            producer={p}
            pathname={pathname}
          />
        ))}
      </div>
      </aside>
    </>
  );
}

function ProducerGroup({
  producer,
  pathname,
}: {
  producer: MockProducer;
  pathname: string;
}) {
  // Auto-expand if any of this producer's servers is active.
  const activeUnderHere = producer.servers.some(
    (s) => pathname === `/listen/${s.slug}`,
  );
  const [expanded, setExpanded] = React.useState(activeUnderHere);
  const totalUnread = producer.servers.reduce((n, s) => n + s.unread, 0);

  return (
    <div style={{ paddingTop: 6, paddingBottom: 6 }}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center w-full cursor-pointer transition-colors duration-fast"
        style={{
          gap: 12,
          padding: "8px 8px",
          borderRadius: "var(--r-md)",
          border: "none",
          background: "transparent",
          textAlign: "left",
        }}
      >
        <Avatar
          name={producer.name}
          src={producer.avatarUrl}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <div
            className="truncate"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {producer.name}
          </div>
          <div
            className="t-mono-s truncate"
            style={{ color: "var(--fg-3)", marginTop: 2 }}
          >
            @{producer.handle.toUpperCase()} · {producer.servers.length}
          </div>
        </div>
        {totalUnread > 0 && !expanded && (
          <span
            aria-label={`${totalUnread} new`}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
            }}
          />
        )}
        <Icon
          name="chevron-down"
          size={14}
          style={{
            color: "var(--fg-3)",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform var(--dur-fast) var(--ease)",
            flexShrink: 0,
          }}
        />
      </button>

      {expanded && (
        <div style={{ paddingLeft: 12, marginTop: 4 }}>
          {producer.servers.map((server) => (
            <ServerNavItem
              key={server.slug}
              server={server}
              active={pathname === `/listen/${server.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServerNavItem({
  server,
  active,
}: {
  server: MockServer;
  active: boolean;
}) {
  return (
    <Link
      href={`/listen/${server.slug}`}
      className="flex items-center transition-colors duration-fast"
      style={{
        gap: 10,
        padding: "8px 10px",
        borderRadius: "var(--r-md)",
        background: active ? "var(--accent-surface)" : "transparent",
        textDecoration: "none",
        color: "inherit",
        marginBottom: 2,
      }}
    >
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
        }}
      >
        <CoverArt fill seed={server.artSeeds[0]} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13.5,
            fontWeight: active ? 600 : 500,
            color: active ? "var(--accent-text)" : "var(--fg-1)",
          }}
        >
          {server.name}
        </div>
        <div
          className="t-mono-s truncate"
          style={{ color: "var(--fg-3)", marginTop: 1 }}
        >
          {server.beats.length} BEATS
        </div>
      </div>
      {server.unread > 0 && (
        <span
          aria-label={`${server.unread} new`}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--accent)",
            flexShrink: 0,
          }}
        />
      )}
    </Link>
  );
}
