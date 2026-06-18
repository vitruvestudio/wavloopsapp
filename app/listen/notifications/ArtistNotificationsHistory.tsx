/**
 * ArtistNotificationsHistory — full list of every notification
 * the artist has received, newest first.
 *
 * Mirrors the bell dropdown row shape (avatar, actor + body,
 * kind icon + ago timestamp) but on a wider, scrollable page
 * with read-state styling and no popup chrome.
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { markAllArtistNotifsReadAction } from "../actions";
import type { ArtistNotificationRow } from "../_data";

type ArtistNotificationKind = ArtistNotificationRow["kind"];

const KIND_ICON: Record<ArtistNotificationKind, IconName> = {
  upload: "upload",
  added_to_server: "plus",
  drop: "mic",
  comment_like: "message",
  trending: "flame",
};

interface ArtistNotificationsHistoryProps {
  items: ArtistNotificationRow[];
}

export function ArtistNotificationsHistory({
  items,
}: ArtistNotificationsHistoryProps) {
  const [list, setList] = React.useState(items);
  React.useEffect(() => setList(items), [items]);

  const unread = list.filter((n) => !n.read).length;
  const markAll = () => {
    setList((cur) => cur.map((n) => ({ ...n, read: true })));
    void markAllArtistNotifsReadAction();
  };

  return (
    <main
      className="flex-1 min-w-0"
      style={{ padding: "32px clamp(16px, 4vw, 32px) 80px" }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 22, gap: 14, flexWrap: "wrap" }}
        >
          <div>
            <div
              className="t-mono-s"
              style={{ color: "var(--accent-text)", marginBottom: 8 }}
            >
              ACTIVITY
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(28px, 4vw, 36px)",
                letterSpacing: "-0.02em",
                color: "var(--fg-1)",
                margin: 0,
              }}
            >
              Notifications
            </h1>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="t-mono-s cursor-pointer"
              style={{
                color: "var(--accent-text)",
                background: "transparent",
                border: "none",
                padding: "8px 12px",
                letterSpacing: "0.08em",
              }}
            >
              MARK ALL READ
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div
            className="text-center border border-border-1"
            style={{
              padding: "48px 18px",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              color: "var(--fg-3)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
          >
            No activity yet. When a producer uploads beats, invites you,
            or interacts with your notes, you&apos;ll see it here.
          </div>
        ) : (
          <div
            className="border border-border-1"
            style={{
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              overflow: "hidden",
            }}
          >
            {list.map((n, i) => (
              <Row
                key={n.id}
                n={n}
                isLast={i === list.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({
  n,
  isLast,
}: {
  n: ArtistNotificationRow;
  isLast: boolean;
}) {
  return (
    <div
      className="flex"
      style={{
        gap: 14,
        padding: "16px 18px",
        background: n.read ? "transparent" : "var(--accent-surface)",
        borderBottom: isLast ? "none" : "1px solid var(--border-1)",
      }}
    >
      <Avatar name={n.actorSeed ?? n.actorName} size={40} />
      <div className="min-w-0 flex-1">
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            color: "var(--fg-1)",
            lineHeight: 1.45,
          }}
        >
          <strong style={{ fontWeight: 700 }}>{n.actorName}</strong>{" "}
          {n.body}
        </div>
        <div
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, marginTop: 6, color: "var(--fg-4)" }}
        >
          <Icon name={KIND_ICON[n.kind]} size={11} />
          {fmtAgo(n.createdAt)}
        </div>
      </div>
      {!n.read && (
        <div
          aria-hidden
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

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "JUST NOW";
  if (min < 60) return `${min} MIN AGO`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} H AGO`;
  const d = Math.round(h / 24);
  if (d === 1) return "YESTERDAY";
  if (d < 7) return `${d} D AGO`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w} W AGO`;
  const mo = Math.round(d / 30);
  return `${mo} MO AGO`;
}
