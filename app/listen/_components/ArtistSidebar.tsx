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
 *   - Footer "SHOW HIDDEN · N" when the artist has hidden any.
 *
 * Per-producer preferences (pinned / muted / hidden) are kept in
 * localStorage so the layout survives refresh. Pinning a producer
 * pins all of their servers; muting a producer mutes all of their
 * notifications; hiding a producer hides all of their servers
 * from the main list and parks them in the "SHOW HIDDEN" footer.
 *
 * Phase 3 swaps localStorage for a real artist_producer_prefs
 * table on Supabase.
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
   Per-producer preferences (pinned / muted / hidden). One menu
   per producer header covers every server they share, which
   matches the Wavloops mental model: an artist subscribes to
   producers, not to individual packs.
   ============================================================ */

interface ProducerPref {
  pinned?: boolean;
  muted?: boolean;
  hidden?: boolean;
}
type ProducerPrefs = Record<string, ProducerPref>;

const PREFS_KEY = "wlp_artist_producer_prefs";

function loadPrefs(): ProducerPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as ProducerPrefs) : {};
  } catch {
    return {};
  }
}

function useProducerPrefs(): [
  ProducerPrefs,
  (id: string, key: keyof ProducerPref) => void,
] {
  const [prefs, setPrefs] = React.useState<ProducerPrefs>(() => loadPrefs());
  React.useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // localStorage quota or unavailable — fine, prefs stay
      // in-memory for the session.
    }
  }, [prefs]);
  const togglePref = React.useCallback(
    (id: string, key: keyof ProducerPref) => {
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
  const [prefs, togglePref] = useProducerPrefs();
  const [showHidden, setShowHidden] = React.useState(false);

  // Visible producers — hidden ones get routed to the bottom
  // footer. Sort visible by pinned first, otherwise the original
  // order from loadArtistContext (most-recent activity).
  const visibleProducers = producers
    .filter((p) => !prefs[p.profileId]?.hidden)
    .slice()
    .sort((a, b) => {
      const ap = prefs[a.profileId]?.pinned ? 1 : 0;
      const bp = prefs[b.profileId]?.pinned ? 1 : 0;
      return bp - ap;
    });
  const hiddenProducers = producers.filter(
    (p) => prefs[p.profileId]?.hidden,
  );

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
          // Match the producer Sidebar's footprint so the two
          // panels read as the same DS: 280px drawer on mobile,
          // 244px sticky rail on lg+. The 244 number mirrors
          // components/app/Sidebar.tsx's expanded width — keeps
          // the content column's left edge in the same screen
          // x-coord regardless of which panel you're in.
          "w-[280px] lg:w-[244px]",
        ].join(" ")}
        style={{
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
          style={{ padding: "12px 22px 8px", color: "var(--fg-3)" }}
        >
          YOUR PRODUCERS · {visibleProducers.length}
        </div>

        {/* Scrollable producer list, or an empty-state for a brand-
            new artist that no producer has added yet. */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "0 10px 18px" }}
        >
          {producers.length === 0 ? (
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
            visibleProducers.map((p) => (
              <ProducerGroup
                key={p.profileId}
                producer={p}
                pathname={pathname}
                pref={prefs[p.profileId]}
                togglePref={togglePref}
              />
            ))
          )}

          {/* Hidden producers reveal — collapsed by default. */}
          {hiddenProducers.length > 0 && (
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
                {showHidden
                  ? "HIDDEN"
                  : `SHOW HIDDEN · ${hiddenProducers.length}`}
              </button>
              {showHidden && (
                <div style={{ marginTop: 4 }}>
                  {hiddenProducers.map((p) => (
                    <ProducerGroup
                      key={p.profileId}
                      producer={p}
                      pathname={pathname}
                      pref={prefs[p.profileId]}
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
  pref,
  togglePref,
}: {
  producer: ArtistProducerLite;
  pathname: string;
  pref: ProducerPref | undefined;
  togglePref: (id: string, key: keyof ProducerPref) => void;
}) {
  const activeUnderHere = producer.servers.some(
    (s) => pathname === `/listen/${s.slug}`,
  );
  const [expanded, setExpanded] = React.useState(activeUnderHere);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuWrapRef = React.useRef<HTMLDivElement>(null);
  const totalUnread = 0;

  // Close the per-producer menu on outside click / Escape.
  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuWrapRef.current?.contains(e.target as Node))
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
    <div style={{ paddingTop: 6, paddingBottom: 6 }}>
      <div
        ref={menuWrapRef}
        className="relative flex items-center w-full"
        style={{
          padding: "4px 4px 4px 8px",
          borderRadius: "var(--r-md)",
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center min-w-0 flex-1 cursor-pointer transition-colors duration-fast"
          style={{
            gap: 12,
            padding: "4px 4px",
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
              className="truncate flex items-center"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg-1)",
                gap: 6,
              }}
            >
              {producer.name}
              {pref?.pinned && (
                <Icon
                  name="zap"
                  size={11}
                  style={{ color: "var(--fg-3)" }}
                />
              )}
              {pref?.muted && (
                <Icon
                  name="bell"
                  size={11}
                  style={{ color: "var(--fg-4)", opacity: 0.6 }}
                />
              )}
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

        {/* Per-producer dots menu. */}
        <button
          type="button"
          aria-label="Producer options"
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
            marginLeft: 4,
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
              minWidth: 220,
              padding: 6,
              background: "var(--bg-1)",
              border: "1px solid var(--border-1)",
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-pop)",
            }}
          >
            <MenuItem
              icon="zap"
              label={pref?.pinned ? "Unpin producer" : "Pin to top"}
              onClick={() => {
                togglePref(producer.profileId, "pinned");
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon="bell"
              label={
                pref?.muted
                  ? "Unmute notifications"
                  : "Mute notifications"
              }
              onClick={() => {
                togglePref(producer.profileId, "muted");
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
              label={pref?.hidden ? "Unhide producer" : "Hide producer"}
              onClick={() => {
                togglePref(producer.profileId, "hidden");
                setMenuOpen(false);
              }}
            />
          </div>
        )}
      </div>

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
  server: ArtistServerLite;
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
        <CoverArt
          fill
          seed={server.slug}
          // Prefer the producer-uploaded server artwork; otherwise
          // pick the first-beat cover so the mini-thumb matches
          // what the /listen/[slug] hero shows (the same beat
          // artwork is the prominent cover in the mosaic on the
          // main view). CoverArt falls back to a slug-seeded
          // gradient when both are absent.
          src={
            server.artworkImageUrl ??
            server.firstBeatArtworkUrl ??
            undefined
          }
        />
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
          {(server.styleText ?? "").toUpperCase() || "SERVER"}
        </div>
      </div>
    </Link>
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
