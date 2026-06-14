/**
 * VisBadge — public / private pill, pixel-ported from prototype
 * `components_app.jsx` lines 5-19.
 *
 *   PUBLIC   → accent-surface bg, accent-text fg, globe icon
 *   PRIVATE  → bg-3 bg, fg-3 fg, lock icon
 *
 * Two sizes:
 *   sm — height 22, used inside ServerCard cover overlay
 *   md — height 26 (default), used in ServerView header and Create flow preview
 */

import * as React from "react";
import { Icon } from "./Icon";

interface VisBadgeProps {
  visibility: "public" | "private";
  size?: "sm" | "md";
  className?: string;
}

export function VisBadge({
  visibility,
  size = "md",
  className,
}: VisBadgeProps) {
  const pub = visibility === "public";
  const h = size === "sm" ? 22 : 26;

  return (
    <span
      className={["t-mono-s inline-flex items-center", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        height: h,
        padding: "0 9px",
        gap: 6,
        borderRadius: "var(--r-sm)",
        background: pub ? "var(--accent-surface)" : "var(--bg-3)",
        color: pub ? "var(--accent-text)" : "var(--fg-3)",
      }}
    >
      <Icon name={pub ? "globe" : "lock"} size={12} />
      {pub ? "PUBLIC" : "PRIVATE"}
    </span>
  );
}
