/**
 * ArtistNotificationsMenu — dropdown that opens from the topbar bell.
 *
 * Layout
 * ──────
 * Header  : "Notifications" label + "MARK ALL READ" action.
 * List    : one row per ArtistNotification, newest at top. Each row
 *           shows an actor avatar, the bolded actor name + sentence
 *           fragment, a tiny kind-icon + relative timestamp, and an
 *           unread dot on the right.
 *
 * Unread rows pick up the `--accent-surface` token as a fill so the
 * dropdown communicates "there are X new things" without needing the
 * badge to stay visible after open.
 *
 * Phase 1 owns the read state in local React state — clicking the
 * MARK ALL READ link clears it. Phase 3 swaps for a real
 * `notifications` table scoped to the artist's contact ids.
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import type {
  ArtistNotificationRow,
} from "../_data";
import { useArtistContext } from "./ArtistContext";

/** Kind union — mirrors the notifications.kind text-check
 *  constraint from migration #14. Kept local to this file (no
 *  longer re-exported from _mock) since the artist surface now
 *  reads from _data instead. */
type ArtistNotificationKind = ArtistNotificationRow["kind"];

/** Map every notification kind to its trailing-line icon. Keys
 *  match the notifications.kind text-check constraint. */
const KIND_ICON: Record<ArtistNotificationKind, IconName> = {
  upload: "upload",
  added_to_server: "plus",
  drop: "mic",
  comment_like: "message",
  trending: "flame",
};

interface ArtistNotificationsMenuProps {
  open: boolean;
  onClose: () => void;
}

export function ArtistNotificationsMenu({
  open,
  onClose,
}: ArtistNotificationsMenuProps) {
  const { notifications } = useArtistContext();
  // Local override so MARK ALL READ is instant — the action that
  // persists the update lands with the BeatNoteModal / comments
  // wiring in a follow-up commit.
  const [items, setItems] = React.useState<ArtistNotificationRow[]>(
    notifications.items,
  );
  React.useEffect(() => {
    setItems(notifications.items);
  }, [notifications.items]);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Click-outside closes — defer attaching the listener one tick so
  // the opening click on the bell button doesn't immediately fire it.
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const t = setTimeout(
      () => document.addEventListener("mousedown", onClick),
      0,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  // Esc closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const markAllRead = () =>
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-label="Notifications"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "min(72vh, 560px)",
        overflowY: "auto",
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-lg)",
        boxShadow:
          "0 20px 50px -10px oklch(0 0 0 / 0.25), 0 4px 12px oklch(0 0 0 / 0.10)",
        zIndex: 30,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-1)",
          // Sticky so the title + MARK ALL READ stay visible while
          // the list scrolls inside the menu.
          position: "sticky",
          top: 0,
          background: "var(--bg-1)",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--fg-1)",
          }}
        >
          Notifications
        </span>
        <button
          type="button"
          onClick={markAllRead}
          className="t-mono-s cursor-pointer"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            color: "var(--accent-text)",
            letterSpacing: "0.08em",
          }}
        >
          MARK ALL READ
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div
          className="text-center"
          style={{
            padding: "32px 18px",
            color: "var(--fg-3)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
          }}
        >
          You&apos;re all caught up.
        </div>
      ) : (
        items.map((n) => <NotificationRow key={n.id} n={n} />)
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: ArtistNotificationRow }) {
  return (
    <div
      className="flex"
      style={{
        gap: 12,
        padding: "12px 18px",
        background: n.read ? "transparent" : "var(--accent-surface)",
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <Avatar name={n.actorSeed ?? n.actorName} size={36} />
      <div className="min-w-0 flex-1">
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--fg-1)",
            lineHeight: 1.4,
          }}
        >
          <strong style={{ fontWeight: 700 }}>{n.actorName}</strong>{" "}
          {n.body}
        </div>
        <div
          className="flex items-center"
          style={{ gap: 6, marginTop: 6 }}
        >
          <Icon
            name={KIND_ICON[n.kind]}
            size={12}
            style={{ color: "var(--fg-4)" }}
          />
          <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
            {fmtAgo(n.createdAt)}
          </span>
        </div>
      </div>
      {!n.read && (
        <div
          aria-label="Unread"
          className="shrink-0"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--accent)",
            marginTop: 8,
          }}
        />
      )}
    </div>
  );
}

/** Cheap relative-time formatter for the timestamp under each
 *  row. Renders mono-uppercase so it matches the previous mock's
 *  "12 MIN AGO" / "1 D AGO" copy. Phase 4: swap for a real lib
 *  with locale handling. */
function fmtAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "JUST NOW";
  if (min < 60) return `${min} MIN AGO`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} H AGO`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} D AGO`;
  const w = Math.round(d / 7);
  return `${w} W AGO`;
}
