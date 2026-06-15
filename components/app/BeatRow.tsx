/**
 * BeatRow — Wavloops V3 single-beat list item.
 *
 * Pixel-ported from prototype `components_app.jsx` lines 82-128.
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ [▢] [▦] [▸cover] Midnight Drive                       2D AGO  ⌗1S   │
 *   │                  [COMP] 142 BPM · F MIN [TRAP] [DARK] ▶208 ♥27 ⋯    │
 *   └─────────────────────────────────────────────────────────────────────┘
 *      ↑ optional checkbox + drag handle
 *
 * Row anatomy:
 *   - Wrapper: flex, padding "10px 12px", r-md, hover bg-2, current
 *     state accent-surface.
 *   - 46×46 CoverArt (generative from beat.wave_seed, or beat.artwork_url).
 *     Hover/current → play overlay icon (play or pause).
 *   - Title + meta row underneath: Tag (COMP=accent+waves / LOOP=solid+repeat)
 *     + MetaRow "{bpm} BPM · {key}" + mood tags.
 *   - Right side cluster — three optional column groups:
 *       added         : "2D AGO" mono-s (from beat.created_at)
 *       servers       : "1 SERVER" / "X SERVERS" chip
 *       engagement    : ▶ plays · ♥ likes · duration
 *
 * Variants kept for V1 (full list view on /library):
 *   - showAdded, showServers, showEngagement — each toggles a column.
 *
 * Variants reserved for later (J3.4 / Server view / Upload modal):
 *   - checkbox      : multi-select (Create Server, Add to Server)
 *   - isCurrent / playing : player highlight
 *   - onPlay        : in-row play trigger
 *
 * Title click opens the beat detail page (J5). For V1 we make the
 * row's whole surface a non-link interactive shell (cursor pointer) but
 * leave actual navigation to the parent through onOpen — keeps the
 * component independent of routing decisions.
 */

"use client";

import * as React from "react";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { fmtAgo, fmtDuration } from "@/lib/fmt";
import type { BeatWithStatsRow } from "@/lib/supabase/database.types";

export interface BeatRowAction {
  label: string;
  icon: IconName;
  onClick: () => void;
  /** Render in danger colour + require a 2-click confirm. */
  danger?: boolean;
}

interface BeatRowProps {
  beat: BeatWithStatsRow;
  /** Reference time for the "2D AGO" formatter. Pass a stable value
   *  (e.g. from server render) to keep SSR + hydrate consistent. */
  now: Date;
  /* Column toggles */
  showAdded?: boolean;
  showServers?: boolean;
  showEngagement?: boolean;
  /* Interaction */
  onOpen?: () => void;
  onPlay?: () => void;
  isCurrent?: boolean;
  playing?: boolean;
  /* Selection mode — when `checkbox` is true the row becomes a
   *  selectable item: a 22×22 checkbox replaces the play overlay,
   *  and both the row and the cover click fire `onCheck` instead of
   *  `onOpen` / `onPlay`. Used by Create / Edit Server. */
  checkbox?: boolean;
  checked?: boolean;
  onCheck?: () => void;
  /** Action menu items shown when the ⋯ button is clicked. When
   *  omitted, the ⋯ button is hidden. */
  actions?: BeatRowAction[];
}

export function BeatRow({
  beat,
  now,
  showAdded = true,
  showServers = true,
  showEngagement = true,
  onOpen,
  onPlay,
  isCurrent,
  playing,
  checkbox,
  checked,
  onCheck,
  actions,
}: BeatRowProps) {
  const [hovered, setHovered] = React.useState(false);

  const handleRowClick = () => {
    if (checkbox) onCheck?.();
    else onOpen?.();
  };

  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checkbox) onCheck?.();
    else onPlay?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className="flex items-center cursor-pointer transition-colors duration-fast"
      style={{
        gap: 14,
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        background:
          checked
            ? "var(--accent-surface)"
            : isCurrent
              ? "var(--accent-surface)"
              : hovered
                ? "var(--bg-2)"
                : "transparent",
      }}
    >
      {/* Checkbox — selection mode only */}
      {checkbox && (
        <button
          type="button"
          aria-label={checked ? "Unselect beat" : "Select beat"}
          onClick={(e) => {
            e.stopPropagation();
            onCheck?.();
          }}
          className="flex items-center justify-center shrink-0 cursor-pointer transition-all duration-fast"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `1.5px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
            background: checked ? "var(--accent)" : "transparent",
            color: "var(--accent-fg)",
          }}
        >
          {checked && <Icon name="check" size={14} />}
        </button>
      )}

      {/* Cover thumbnail — generative gradient, hover/current → play overlay */}
      <div
        onClick={handleCoverClick}
        className="relative shrink-0"
        style={{ width: 46, height: 46 }}
      >
        <CoverArt
          seed={beat.wave_seed || beat.id}
          src={beat.artwork_url ?? undefined}
          size={46}
          radius="var(--r-sm)"
        />
        {(hovered || isCurrent) && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
            style={{
              borderRadius: "var(--r-sm)",
              background: "oklch(0 0 0 / 0.45)",
            }}
          >
            <Icon
              name={isCurrent && playing ? "pause" : "play"}
              size={18}
              style={{ color: "#fff" }}
            />
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        {/* Top row — title (truncates if long) sits inline immediately
            beside the producer credit. No flex-1 push to the right
            edge: producer reads as a byline next to the title, not as
            a separate column. Hidden on < md to keep mobile rows tight. */}
        <div
          className="flex items-baseline min-w-0"
          style={{ gap: 10 }}
        >
          <span
            className="t-title truncate min-w-0"
            style={{
              fontSize: 14.5,
              color: isCurrent ? "var(--accent-text)" : "var(--fg-1)",
            }}
          >
            {beat.title}
          </span>
          {beat.co_producers.length > 0 && (
            <span
              className="t-mono-s shrink-0 hidden md:inline-block truncate"
              style={{
                color: "var(--fg-3)",
                maxWidth: 200,
              }}
            >
              {beat.co_producers.join(" · ")}
            </span>
          )}
        </div>

        {/* Bottom row — type tag · BPM · KEY · LENGTH · mood tags */}
        <div
          className="flex items-center flex-wrap"
          style={{ gap: 7, marginTop: 5 }}
        >
          {beat.type === "comp" && (
            <Tag variant="accent" icon="waves">
              COMP
            </Tag>
          )}
          {beat.type === "loop" && (
            <Tag variant="solid" icon="repeat">
              LOOP
            </Tag>
          )}
          <MetaRow
            items={[
              beat.bpm != null ? `${beat.bpm} BPM` : null,
              beat.key,
              beat.duration_seconds != null
                ? fmtDuration(beat.duration_seconds)
                : null,
            ]}
          />
          {beat.mood.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
      </div>

      {/* Right cluster — three optional column groups */}
      {showAdded && (
        <span
          className="t-mono-s hidden md:inline-block shrink-0"
          style={{ width: 90, textAlign: "right", color: "var(--fg-3)" }}
        >
          {fmtAgo(beat.created_at, now)}
        </span>
      )}

      {showServers && (
        <span
          className="hidden lg:inline-flex shrink-0"
          style={{ width: 110, justifyContent: "flex-end" }}
        >
          {beat.in_servers_count > 0 ? (
            <Tag variant="solid" icon="server">
              {beat.in_servers_count} SERVER
              {beat.in_servers_count > 1 ? "S" : ""}
            </Tag>
          ) : (
            <span
              className="t-mono-s"
              style={{ color: "var(--fg-4)" }}
            >
              —
            </span>
          )}
        </span>
      )}

      {showEngagement && (
        <div
          className="hidden sm:flex items-center justify-end shrink-0"
          style={{ gap: 16, width: 100 }}
        >
          <span
            className="t-mono-s inline-flex items-center"
            style={{ gap: 5, color: "var(--fg-3)" }}
          >
            <Icon name="play" size={12} />
            {beat.plays_count}
          </span>
          <span
            className="t-mono-s inline-flex items-center"
            style={{ gap: 5, color: "var(--fg-3)" }}
          >
            <Icon name="heart" size={12} />
            {beat.likes_count}
          </span>
        </div>
      )}

      {/* Action menu — popover anchored to the ⋯ button, opens to the
          left so it doesn't overflow the row's right edge. */}
      <BeatActionMenu actions={actions} />
    </div>
  );
}

/* ============================================================
   BeatActionMenu — ⋯ button + click-outside / Escape popover.
   Renders nothing when `actions` is empty so the row still aligns
   correctly (the spacer slot is kept).
   ============================================================ */

function BeatActionMenu({ actions }: { actions?: BeatRowAction[] }) {
  const [open, setOpen] = React.useState(false);
  const [pendingConfirm, setPendingConfirm] = React.useState<string | null>(
    null,
  );
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPtr = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPendingConfirm(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setPendingConfirm(null);
      }
    };
    document.addEventListener("pointerdown", onPtr);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPtr);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative" }}
      className="shrink-0"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!actions || actions.length === 0) return;
          setOpen((o) => !o);
        }}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center text-fg-4 hover:text-fg-1 transition-colors"
        style={{ width: 32, height: 32, borderRadius: "var(--r-sm)" }}
      >
        <Icon name="more" size={18} />
      </button>

      {open && actions && actions.length > 0 && (
        <div
          role="menu"
          className="absolute bg-bg-2 border border-border-2"
          style={{
            top: "calc(100% + 4px)",
            right: 0,
            width: 200,
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
            padding: 6,
            zIndex: 30,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action) => {
            const awaitingConfirm =
              pendingConfirm === action.label;
            const isDanger = Boolean(action.danger);
            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDanger && !awaitingConfirm) {
                    setPendingConfirm(action.label);
                    return;
                  }
                  action.onClick();
                  setOpen(false);
                  setPendingConfirm(null);
                }}
                className="flex w-full items-center cursor-pointer transition-colors duration-fast border-0"
                style={{
                  height: 36,
                  padding: "0 10px",
                  gap: 10,
                  borderRadius: "var(--r-sm)",
                  background: "transparent",
                  color: isDanger ? "var(--danger)" : "var(--fg-2)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDanger
                    ? "var(--danger-surface)"
                    : "var(--bg-3)";
                  if (!isDanger)
                    e.currentTarget.style.color = "var(--fg-1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = isDanger
                    ? "var(--danger)"
                    : "var(--fg-2)";
                }}
              >
                <Icon name={action.icon} size={16} />
                {awaitingConfirm ? "Click to confirm" : action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MetaRow — inline meta items separated by · bullets
   ============================================================ */

interface MetaRowProps {
  items: Array<string | null | undefined>;
}

function MetaRow({ items }: MetaRowProps) {
  const visible = items.filter((s): s is string => Boolean(s));
  if (visible.length === 0) return null;

  return (
    <span
      className="t-mono-s"
      style={{ color: "var(--fg-3)" }}
    >
      {visible.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && (
            <span style={{ margin: "0 7px", color: "var(--fg-4)" }}>·</span>
          )}
          {s}
        </React.Fragment>
      ))}
    </span>
  );
}
