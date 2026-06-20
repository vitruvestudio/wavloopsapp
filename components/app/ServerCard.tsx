/**
 * ServerCard — dashboard tile for a single server.
 *
 * Pixel-ported from prototype `components_app.jsx` lines 37-80.
 *
 *   ┌──────────────────────────────────────────┐
 *   │  ┌─ cover mosaic (132h) ──────────────┐  │   ← 1 to 4 CoverArts, flex row
 *   │  │                                    │  │     darken-down gradient overlay
 *   │  │   ATLANTA NIGHTS   🔒 PRIVATE      │  │     name + style + VisBadge
 *   │  │   TRAP · DARK                      │  │     bottom-left, white
 *   │  └────────────────────────────────────┘  │
 *   │  ♫ 4   👥 3   ▶ 842            →         │   ← stats footer + chevron
 *   └──────────────────────────────────────────┘
 *
 * Hover: card lifts (translateY -3px) + shadow-md, chevron switches
 * to accent-text. Whole card is a Next <Link> to /servers/<slug>.
 *
 * Mosaic strategy (no real beat covers exist yet):
 *   - 0 beats   → 1 CoverArt with the server's accent_hue (or slug-hashed)
 *   - 1-3 beats → that many CoverArts, each seeded with the beat's
 *                 wave_seed (parent passes them in via `beatSeeds`)
 *   - 4+ beats  → first 4 CoverArts (proto's mosaic cap)
 *
 * Stats are denormalized at read time from the parent's query — this
 * component doesn't fetch anything.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { VisBadge } from "@/components/ui/VisBadge";
import type { ServerRow } from "@/lib/supabase/database.types";
import { deleteServerAction } from "@/app/(app)/servers/[slug]/actions";

/**
 * One mosaic slice — either a real beat cover (`src` set) or a
 * fallback generative gradient seeded by the wave_seed.
 */
export interface BeatCover {
  seed: string;
  src: string | null;
}

interface ServerCardProps {
  server: ServerRow;
  /** Covers of beats in this server, in order. The first 4 are used
   *  for the cover mosaic. When omitted, a single generative tile
   *  seeded by the server slug is used. */
  beatCovers?: BeatCover[];
  stats: {
    beats: number;
    contacts: number;
    plays: number;
  };
}

export function ServerCard({
  server,
  beatCovers,
  stats,
}: ServerCardProps) {
  const [hovered, setHovered] = React.useState(false);

  // Pick the mosaic tiles. Always at least 1 (the server's own slug).
  const covers = React.useMemo<BeatCover[]>(() => {
    const list = (beatCovers ?? []).slice(0, 4);
    if (list.length === 0) {
      return [{ seed: server.slug, src: null }];
    }
    return list;
  }, [beatCovers, server.slug]);

  // Overlay hue — use server.accent_hue if set, else hash slug.
  const overlayHue = server.accent_hue ?? null;

  return (
    <Link
      href={`/servers/${server.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block overflow-hidden border border-border-1 bg-bg-1 transition-all"
      style={{
        borderRadius: "var(--r-lg)",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "var(--shadow-md)" : "none",
        transitionDuration: "var(--dur)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {/* Cover surface — uploaded image (artwork_mode 'image') OR
          generative mosaic from beat seeds (default 'auto' / 'color'). */}
      <div
        className="relative flex overflow-hidden bg-bg-inset"
        style={{ height: 132, gap: 2 }}
      >
        {server.artwork_mode === "image" && server.artwork_image_url ? (
          // ─ IMAGE: full uploaded cover
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={server.artwork_image_url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : server.artwork_mode === "color" && server.accent_hue != null ? (
          // ─ COLOR: a single, full-bleed generative cover tinted with
          // the producer's chosen hue. No mosaic — the whole point of
          // this mode is "the cover IS this colour".
          <div style={{ position: "absolute", inset: 0 }}>
            <CoverArt
              fill
              seed={server.slug}
              hue={server.accent_hue}
            />
          </div>
        ) : (
          // ─ AUTO: mosaic of the producer's beats. First slice picks
          // up the server's accent_hue when set (rare in Auto, but it
          // keeps the rule honest); subsequent slices keep their per-
          // beat hue for variety.
          covers.map((c, i) => (
            <div key={i} className="relative flex-1">
              {c.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.src}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <CoverArt
                  fill
                  seed={c.seed}
                  hue={
                    i === 0 && overlayHue != null ? overlayHue : undefined
                  }
                />
              )}
            </div>
          ))
        )}

        {/* Darken-down overlay tinted with the server's accent hue */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: overlayHue
              ? `linear-gradient(180deg, transparent 30%, oklch(0.14 0.02 ${overlayHue} / 0.65))`
              : "linear-gradient(180deg, transparent 30%, oklch(0.14 0.02 270 / 0.65))",
          }}
        />

        {/* Action menu — ⋯ button top-right, opens dropdown
                with Edit / Preview / Delete. Sits above the Link
                so clicks here don't trigger navigation. */}
        <ServerActionMenu server={server} />

        {/* Bottom strip — name + style + visibility */}
        <div
          className="absolute flex items-end justify-between"
          style={{ left: 14, right: 14, bottom: 12 }}
        >
          <div className="min-w-0">
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 19,
                letterSpacing: "-0.01em",
                color: "#fff",
              }}
            >
              {server.name}
            </div>
            {server.style_text && (
              <div
                className="t-mono-s truncate"
                style={{
                  color: "oklch(1 0 0 / 0.7)",
                  marginTop: 4,
                }}
              >
                {server.style_text.toUpperCase()}
              </div>
            )}
          </div>
          <VisBadge visibility={server.visibility} size="sm" />
        </div>
      </div>

      {/* Stats footer */}
      <div
        className="flex items-center"
        style={{ gap: 18, padding: "14px 16px" }}
      >
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-2)" }}
        >
          <Icon name="note" size={14} />
          {stats.beats}
        </span>
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-2)" }}
        >
          <Icon name="users" size={14} />
          {stats.contacts}
        </span>
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-2)" }}
        >
          <Icon name="play" size={13} />
          {stats.plays}
        </span>
        <span className="flex-1" />
        <Icon
          name="chevron-right"
          size={16}
          style={{
            color: hovered ? "var(--accent-text)" : "var(--fg-4)",
            transition: "color var(--dur-fast) var(--ease)",
          }}
        />
      </div>
    </Link>
  );
}

/* ============================================================
   ServerActionMenu — ⋯ overlay button + dropdown popover.
   Sits absolutely-positioned in the top-right of the cover so
   the wrapping <Link> sees a click anywhere ELSE on the card
   while clicks on this button (and the menu it opens) cancel
   bubble + nav.

   Items:
     Edit   → navigate to /servers/[slug]/edit
     Preview→ navigate to the public /s/[slug] (target=_blank)
     Delete → 2-click confirm, then deleteServerAction +
              router.refresh()
   ============================================================ */

function ServerActionMenu({ server }: { server: ServerRow }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPtr = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("pointerdown", onPtr);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPtr);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Cancel parent Link navigation. Used on every interactive
  // element inside the menu — without it, the bubbling click on
  // the <Link> would steal the producer's intent.
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const onDelete = async (e: React.MouseEvent) => {
    stop(e);
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      const res = await deleteServerAction(server.id);
      if (res.error) {
        // Cheap visible feedback — full toast system can replace
        // this later. Keeps the menu open so the producer sees
        // the error.
        window.alert(res.error);
        setBusy(false);
        return;
      }
      setOpen(false);
      setConfirmDelete(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed.";
      window.alert(msg);
      setBusy(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{ top: 10, right: 10, zIndex: 5 }}
    >
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen((o) => !o);
        }}
        aria-label="Server actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center transition-colors"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
          background: "color-mix(in oklch, var(--bg-0) 55%, transparent)",
          backdropFilter: "blur(6px)",
          color: "#fff",
          border: "1px solid oklch(1 0 0 / 0.18)",
        }}
      >
        <Icon name="more" size={16} />
      </button>

      {open && (
        <div
          role="menu"
          onClick={stop}
          className="absolute bg-bg-2 border border-border-2"
          style={{
            top: "calc(100% + 6px)",
            right: 0,
            width: 200,
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
            padding: 6,
            zIndex: 30,
          }}
        >
          <MenuItem
            icon="edit"
            label="Edit server"
            onClick={(e) => {
              stop(e);
              setOpen(false);
              router.push(`/servers/${server.slug}/edit`);
            }}
          />
          <MenuItem
            icon="external"
            label="Preview public page"
            onClick={(e) => {
              stop(e);
              setOpen(false);
              window.open(`/s/${server.slug}`, "_blank");
            }}
          />
          <div
            aria-hidden="true"
            style={{
              height: 1,
              margin: "4px 0",
              background: "var(--border-1)",
            }}
          />
          <MenuItem
            icon="trash"
            label={confirmDelete ? "Click again to confirm" : "Delete server"}
            danger
            onClick={onDelete}
            disabled={busy}
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
  danger,
  disabled,
}: {
  icon: import("@/components/ui/Icon").IconName;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center w-full transition-colors text-left"
      style={{
        gap: 10,
        padding: "8px 10px",
        borderRadius: "var(--r-sm)",
        background: "transparent",
        color: danger ? "var(--danger)" : "var(--fg-1)",
        fontSize: 13,
        fontFamily: "var(--font-body)",
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          danger ? "var(--danger-surface)" : "var(--bg-3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "transparent";
      }}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}
