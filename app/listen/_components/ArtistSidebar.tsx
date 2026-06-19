/**
 * ArtistSidebar — left rail for the artist panel.
 *
 * Top-level structure:
 *   - WAVLOOPS logo
 *   - "Liked Songs" pinned card (accent), cross-producers aggregate
 *   - "YOUR PRODUCERS · N" header
 *   - One ProducerGroup per producer, expandable, with its servers
 *     listed inside. Active server highlighted; servers with unread
 *     beats show a blue dot.
 *   - Footer "Show N hidden servers" when the artist has hidden any.
 *
 * Per-server preferences (pinned / muted / hidden) are kept in
 * localStorage so the layout survives refresh. Phase 3 swaps this
 * for a real `artist_server_prefs` table.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import type {
  ArtistProducerLite,
  ArtistServerLite,
} from "../_data";
import { useArtistContext } from "./ArtistContext";

interface ArtistSidebarProps {
  /** Mobile drawer state — ignored at lg+ where the sidebar is
   *  always visible as a sticky rail. */
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

/* ============================================================
   Per-server preferences (pinned / muted / hidden), persisted
   in localStorage. Lifted to the sidebar root so producer
   groups + server rows can share the same map.
   ============================================================ */

interface ServerPref {
  pinned?: boolean;
  muted?: boolean;
  hidden?: boolean;
}
type ServerPrefs = Record<string, ServerPref>;

const PREFS_KEY = "wlp_artist_server_prefs";

function loadPrefs(): ServerPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as ServerPrefs) : {};
  } catch {
    return {};
  }
}

function useServerPrefs(): [ServerPrefs, (id: string, key: keyof ServerPref) => void] {
  const [prefs, setPrefs] = React.useState<ServerPrefs>(() => loadPrefs());
  React.useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // localStorage quota or unavailable — fine, prefs stay
      // in-memory for the session.
    }
  }, [prefs]);
  const togglePref = React.useCallback(
    (id: string, key: keyof ServerPref) => {
      setPrefs((cur) => ({
        ...cur,
        [id]: { ...cur[id], [key]: !cur[id]?.[key] },
      }));
    },
    [],
  );
  return [prefs, togglePref];
}

export function ArtistSidebar({
  drawerOpen,
  onCloseDrawer,
}: ArtistSidebarProps) {
  const { producers, likedCount } = useArtistContext();
  const pathname = usePathname();
  const producerCount = producers.length;
  const [prefs, togglePref] = useServerPrefs();
  // Show-hidden toggle — collapsed by default. Click reveals the
  // hidden servers grouped at the bottom of the sidebar with an
  // "Unhide" action on each.
  const [showHidden, setShowHidden] = React.useState(false);

  // Flatten every server with its parent producer so the hidden
  // section can list cross-producer entries.
  const allServers = producers.flatMap((p) =>
    p.servers.map((s) => ({ server: s, producer: p })),
  );
  const hiddenServers = allServers.filter(
    ({ server }) => prefs[server.id]?.hidden,
  );

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
          "fixed top-0 left-0 z-50 transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          "lg:sticky lg:translate-x-0",
        ].join(" ")}
        style={{
          width: 280,
          height: "100vh",
          background: "var(--bg-1)",
          borderRight: "1px solid var(--border-1)",
        }}
      >
      <div
        className="flex items-center shrink-0"
        style={{ padding: "20px 22px" }}
      >
        <Logo size={28} />
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
        YOUR PRODUCERS · {producerCount}
      </div>

      {/* Scrollable producer list, or an empty-state for a brand-
          new artist that no producer has added yet. */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "0 10px 18px" }}
      >
        {producerCount === 0 ? (
          <div
            className="t-body-s"
            style={{
              padding: "20px 12px",
              textAlign: "center",
              color: "var(--fg-3)",
              border: "1px dashed var(--border-1)",
              borderRadius: "var(--r-md)",
              margin: "8px 0",
            }}
          >
            No producers have added you yet. They&apos;ll show up
            here as soon as one does.
          </div>
        ) : (
          producers.map((p) => (
            <ProducerGroup
              key={p.profileId}
              producer={p}
              pathname={pathname}
              prefs={prefs}
              togglePref={togglePref}
            />
          ))
        )}

        {/* Hidden servers reveal — collapsed by default. */}
        {hiddenServers.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="flex items-center w-full t-mono-s cursor-pointer"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--r-md)",
                border: "none",
                background: "transparent",
                color: "var(--fg-3)",
                gap: 6,
                textAlign: "left",
              }}
            >
              <Icon
                name="chevron-down"
                size={12}
                style={{
                  transform: showHidden
                    ? "rotate(0deg)"
                    : "rotate(-90deg)",
                  transition:
                    "transform var(--dur-fast) var(--ease)",
                }}
              />
              {showHidden ? "HIDDEN" : `SHOW HIDDEN · ${hiddenServers.length}`}
            </button>
            {showHidden && (
              <div style={{ paddingLeft: 6, marginTop: 4 }}>
                {hiddenServers.map(({ server }) => (
                  <ServerNavItem
                    key={server.slug}
                    server={server}
                    active={pathname === `/listen/${server.slug}`}
                    pref={prefs[server.id]}
                    togglePref={togglePref}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </aside>
    </>
  );
}

function ProducerGroup({
  producer,
  pathname,
  prefs,
  togglePref,
}: {
  producer: ArtistProducerLite;
  pathname: string;
  prefs: ServerPrefs;
  togglePref: (id: string, key: keyof ServerPref) => void;
}) {
  // Auto-expand if any of this producer's NON-HIDDEN servers is
  // active. A hidden-active server shouldn't drag the group open.
  const visibleServers = producer.servers
    .filter((s) => !prefs[s.id]?.hidden)
    .slice()
    .sort((a, b) => {
      const ap = prefs[a.id]?.pinned ? 1 : 0;
      const bp = prefs[b.id]?.pinned ? 1 : 0;
      return bp - ap;
    });
  const activeUnderHere = visibleServers.some(
    (s) => pathname === `/listen/${s.slug}`,
  );
  const [expanded, setExpanded] = React.useState(activeUnderHere);
  const totalUnread = 0;

  if (visibleServers.length === 0) return null;

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
            @{producer.handle.toUpperCase()} · {visibleServers.length}
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
          {visibleServers.map((server) => (
            <ServerNavItem
              key={server.slug}
              server={server}
              active={pathname === `/listen/${server.slug}`}
              pref={prefs[server.id]}
              togglePref={togglePref}
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
  pref,
  togglePref,
}: {
  server: ArtistServerLite;
  active: boolean;
  pref: ServerPref | undefined;
  togglePref: (id: string, key: keyof ServerPref) => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      ref={wrapRef}
      className="relative flex items-center transition-colors duration-fast"
      style={{
        padding: "4px 4px 4px 10px",
        borderRadius: "var(--r-md)",
        background: active ? "var(--accent-surface)" : "transparent",
        marginBottom: 2,
      }}
    >
      <Link
        href={`/listen/${server.slug}`}
        className="flex items-center min-w-0 flex-1"
        style={{
          gap: 10,
          padding: "4px 0",
          textDecoration: "none",
          color: "inherit",
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
          <CoverArt
            fill
            seed={server.slug}
            src={server.artworkImageUrl ?? undefined}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate flex items-center"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13.5,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--accent-text)" : "var(--fg-1)",
              gap: 6,
            }}
          >
            {server.name}
            {pref?.pinned && (
              <Icon
                name="zap"
                size={10}
                style={{ color: "var(--fg-3)" }}
              />
            )}
            {pref?.muted && (
              <Icon
                name="bell"
                size={10}
                style={{
                  color: "var(--fg-4)",
                  opacity: 0.6,
                }}
              />
            )}
          </div>
          <div
            className="t-mono-s truncate"
            style={{ color: "var(--fg-3)", marginTop: 1 }}
          >
            {(server.styleText ?? "").toUpperCase() || "SERVER"}
          </div>
        </div>
      </Link>

      {/* Per-server dots menu — Microsoft-Teams-style. */}
      <button
        type="button"
        aria-label="Server options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="inline-flex items-center justify-center cursor-pointer shrink-0 transition-colors duration-fast"
        style={{
          width: 28,
          height: 28,
          border: "none",
          borderRadius: "var(--r-sm)",
          background: menuOpen ? "var(--bg-2)" : "transparent",
          color: "var(--fg-3)",
        }}
      >
        <Icon name="more" size={14} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute"
          style={{
            top: "calc(100% + 4px)",
            right: 4,
            zIndex: 60,
            minWidth: 200,
            padding: 6,
            background: "var(--bg-1)",
            border: "1px solid var(--border-1)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
          }}
        >
          <MenuItem
            icon="zap"
            label={pref?.pinned ? "Unpin" : "Pin to top"}
            onClick={() => {
              togglePref(server.id, "pinned");
              setMenuOpen(false);
            }}
          />
          <MenuItem
            icon="bell"
            label={
              pref?.muted ? "Unmute notifications" : "Mute notifications"
            }
            onClick={() => {
              togglePref(server.id, "muted");
              setMenuOpen(false);
            }}
          />
          <div
            aria-hidden
            style={{
              height: 1,
              background: "var(--border-1)",
              margin: "4px 0",
            }}
          />
          <MenuItem
            icon="eye-off"
            label={pref?.hidden ? "Unhide" : "Hide server"}
            onClick={() => {
              togglePref(server.id, "hidden");
              setMenuOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex items-center w-full cursor-pointer transition-colors duration-fast hover:bg-bg-2"
      style={{
        height: 34,
        padding: "0 10px",
        gap: 10,
        border: "none",
        borderRadius: "var(--r-sm)",
        background: "transparent",
        color: "var(--fg-2)",
        fontFamily: "var(--font-body)",
        fontSize: 13.5,
        textAlign: "left",
      }}
    >
      <Icon name={icon} size={14} style={{ color: "var(--fg-3)" }} />
      {label}
    </button>
  );
}
