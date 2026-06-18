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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { markAllArtistNotifsReadAction } from "../actions";
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
  const router = useRouter();
  const { viewer, notifications } = useArtistContext();
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

  // Realtime — new notification rows for THIS recipient land in
  // the artist's bell live (no manual refresh). Mirror of the
  // producer-side ProducerNotificationsMenu subscription. We
  // refresh the layout so the badge count + viewer context stay
  // in sync across the rest of the shell.
  // Realtime — best-effort live INSERT subscription. Observed
  // unreliable on the artist's session in dev (the producer-side
  // sub works fine with identical wiring; suspect JWT / WS auth
  // quirk on Supabase Free Realtime). Kept as the fast path
  // because when it works it's instant; failures are covered by
  // the polling + visibilitychange handlers below.
  React.useEffect(() => {
    if (!viewer?.userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`artist-notifs-${viewer.userId}`)
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

  // Polling fallback — every 30s, pull fresh server data so a
  // missed realtime event doesn't leave the bell stale forever.
  // Cheap RSC re-render; no per-user network connection involved.
  React.useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [router]);

  // Catch-up on tab focus — visibilitychange re-fetches so notifs
  // that landed while the tab was asleep / offline are picked up
  // as soon as the artist comes back. Cheap + complements the
  // polling for the "user just came back" case where 30s is
  // perceptually too long.
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

  const markAllRead = () => {
    // Optimistic local update so the dropdown visually clears
    // instantly. The server action persists in DB + revalidates
    // the shell layout so the bell badge re-renders to 0 on the
    // next pass.
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
    void markAllArtistNotifsReadAction().then((r) => {
      if (!r.ok) console.warn("[markAllArtistNotifsRead]", r.error);
    });
  };

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-label="Notifications"
      // Below sm: pin to the viewport instead of the bell's
      // narrow position-relative wrapper. Without this, the
      // `right: 0; width: 380` combo on a 36px parent renders
      // the menu off the left edge of a 375px iPhone viewport.
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

      {/* List — Slack/Discord-style: only unread surface here, so
          MARK ALL READ clears the dropdown. The /listen/notifications
          page is the full history (read + unread). */}
      {(() => {
        const visible = items.filter((n) => !n.read);
        if (visible.length === 0) {
          return (
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
          );
        }
        return visible.map((n) => <NotificationRow key={n.id} n={n} />);
      })()}

      {/* Footer link to the full history (read + unread). Sticky
          to the bottom of the menu so the user can always jump
          there even mid-scroll. */}
      <div
        className="text-center"
        style={{
          padding: "10px 18px",
          borderTop: "1px solid var(--border-1)",
          background: "var(--bg-1)",
          position: "sticky",
          bottom: 0,
        }}
      >
        <Link
          href="/listen/notifications"
          onClick={onClose}
          className="t-mono-s"
          style={{
            color: "var(--accent-text)",
            letterSpacing: "0.08em",
            textDecoration: "none",
          }}
        >
          VIEW ALL NOTIFICATIONS →
        </Link>
      </div>
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
