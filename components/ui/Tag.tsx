/**
 * Tag — mono uppercase chip (BPM, key, mood, genre, visibility…).
 *
 * Mirrors the prototype's Tag (components.jsx) exactly:
 *   - Height 22, padding "0 8px"
 *   - .t-mono-s (font-mono, ~10px, letter-spacing .1em, uppercase)
 *   - Variants:
 *       default — transparent bg + border-2 + fg-3 text
 *       solid   — bg-3 fill + fg-2 text (denser tables)
 *       accent  — accent-surface + accent-text (active filter, currently
 *                 playing key, server visibility = public)
 *       ok      — ok-surface + ok text (success states)
 *   - Optional 11px prefix icon
 */

import * as React from "react";
import { Icon, type IconName } from "./Icon";

type TagVariant = "default" | "solid" | "accent" | "ok";

interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  icon?: IconName;
  className?: string;
}

const VARIANT_STYLE: Record<TagVariant, React.CSSProperties> = {
  default: {
    background: "transparent",
    color: "var(--fg-3)",
    border: "1px solid var(--border-2)",
  },
  solid: {
    background: "var(--bg-3)",
    color: "var(--fg-2)",
    border: "1px solid transparent",
  },
  accent: {
    background: "var(--accent-surface)",
    color: "var(--accent-text)",
    border: "1px solid transparent",
  },
  ok: {
    background: "var(--ok-surface)",
    color: "var(--ok)",
    border: "1px solid transparent",
  },
};

export function Tag({ children, variant = "default", icon, className }: TagProps) {
  return (
    <span
      className={["t-mono-s inline-flex items-center", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        height: 22,
        padding: "0 8px",
        gap: 5,
        borderRadius: "var(--r-sm)",
        ...VARIANT_STYLE[variant],
      }}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}
