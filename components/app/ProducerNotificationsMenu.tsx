/**
 * ProducerNotificationsMenu — dropdown that opens from the topbar
 * bell on the producer surface.
 *
 * Mirrors the artist-side ArtistNotificationsMenu in structure
 * (header + scrollable list + unread fill + mark-all-read) but
 * scopes to producer-relevant kinds:
 *   - access_request → /servers/<slug>?tab=requests
 *   - like           → /beats/<beat_id>?tab=audience
 *   - comment        → /beats/<beat_id>?tab=feedback
 *
 * Realtime: a postgres_changes subscription on `notifications`
 * filtered by recipient_user_id triggers a router.refresh() so a
 * new row landing while the producer is mid-app updates the badge
 * + list without a manual reload.
 *
 * Mark-as-read fires:
 *   - on row click  → that one row, before navigating to the
 *                     deeplink (optimistic local strike-through).
 *   - on MARK ALL READ → every unread row in one shot.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { markNotificationsReadAction } from "@/app/(app)/actions";
import {
  useProducerNotifications,
  useProducerViewer,
} from "@/app/(app)/_components/ProducerContext";
import type { ProducerNotificationRow } from "@/app/(app)/_data";

const KIND_ICON: Record<ProducerNotificationRow["kind"], IconName> = {
  access_request: "lock",
  like: "heart",
  comment: "message",
};

interface MenuProps {
  open: boolean;
  onClose: () => void;
}

export function ProducerNotificationsMenu({ open, onClose }: MenuProps) {
  const router = useRouter();
  const viewer = useProducerViewer();
  const { items: serverItems } = useProducerNotifications();

  // Local copy so click-to-read flips the unread fill instantly.
  // The server action's revalidate eventually reconciles, but we
  // don't want the menu to feel laggy.
  const [items, setItems] = React.useState<ProducerNotificationRow[]>(serverItems);
  React.useEffect(() => {
    setItems(serverItems);
  }, [serverItems]);

  const menuRef = React.useRef<HTMLDivElement>(null);

  // Click-outside closes — defer one tick so the opening click on
  // the bell button doesn't immediately fire it.
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

  // Realtime — new notification rows for THIS recipient land in the
  // bell live. We refresh the layout instead of mutating local state
  // so the badge count + viewer context stay in sync across the rest
  // of the shell.
  React.useEffect(() => {
    if (!viewer?.userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`producer-notifs-${viewer.userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${viewer.userId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewer?.userId, router]);

  // Catch-up on tab focus — Postgres replication doesn't replay
  // events that landed while the browser was sleeping / offline.
  // Re-fetching when visibility regains pulls whatever notifs
  // arrived during the gap so the bell can't get permanently
  // stale. visibilitychange fires immediately on tab activation
  // so the badge updates before the producer even clicks.
  React.useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router]);

  if (!open) return null;

  const markAllRead = () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
    void markNotificationsReadAction(unreadIds);
  };

  const onRowClick = (n: ProducerNotificationRow) => {
    if (!n.read) {
      setItems((cur) =>
        cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      void markNotificationsReadAction([n.id]);
    }
    const target = deeplinkFor(n);
    onClose();
    if (target) router.push(target);
  };

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-label="Notifications"
      // Below sm: pin to the viewport. The bell button's narrow
      // position-relative wrapper would otherwise overflow the
      // viewport with a 380px-wide menu.
      className="fixed left-2 right-2 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[380px]"
      style={{
        maxWidth: "100vw",
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
        items.map((n) => (
          <NotificationRow
            key={n.id}
            n={n}
            onClick={() => onRowClick(n)}
          />
        ))
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: ProducerNotificationRow;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer text-left"
      style={{
        gap: 12,
        padding: "12px 18px",
        background: n.read ? "transparent" : "var(--accent-surface)",
        borderBottom: "1px solid var(--border-1)",
        border: 0,
        borderRadius: 0,
        font: "inherit",
        color: "inherit",
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
    </button>
  );
}

/** Per-kind deeplink resolver. Returns null when the underlying
 *  row was deleted (e.g. server gone), so the row click just marks
 *  read + closes without throwing 404. */
function deeplinkFor(n: ProducerNotificationRow): string | null {
  switch (n.kind) {
    case "access_request":
      return n.serverSlug ? `/servers/${n.serverSlug}?tab=requests` : null;
    case "like":
      return n.beatId ? `/beats/${n.beatId}?tab=audience` : null;
    case "comment":
      return n.beatId ? `/beats/${n.beatId}?tab=feedback` : null;
  }
}

/** Same relative-time formatter as the artist menu — kept in lock-
 *  step copy-wise ("12 MIN AGO" / "1 D AGO"). */
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
