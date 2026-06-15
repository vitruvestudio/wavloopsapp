/**
 * RadioCard — chunky single-pick radio that the user selects by
 * clicking anywhere on the card. Pixel-ported from prototype
 * components_app.jsx visibility cards.
 *
 *   ┌─ 🔒  [●]                                        ┐
 *   │                                                 │
 *   │  Private                                        │
 *   │  Entry on request: artists submit email +       │
 *   │  a social. You approve each one manually,       │
 *   │  then they get an access link by email.         │
 *   │                                                 │
 *   │  MANUAL APPROVAL · ACCESS BY EMAIL LINK         │
 *   └─────────────────────────────────────────────────┘
 *
 * Selected:
 *   - border-accent + accent-surface background + accent-text title
 *   - radio dot filled (accent inside, accent ring outside)
 *
 * Unselected:
 *   - border-1 + bg-1
 *   - radio dot empty (border-strong)
 *
 * Used by /servers/new for visibility (Private vs Public). Generic
 * enough to re-use anywhere we want a "big radio with description".
 */

"use client";

import * as React from "react";
import { Icon, type IconName } from "./Icon";

interface RadioCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: IconName;
  title: string;
  description: string;
  features?: string;
}

export function RadioCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  features,
}: RadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex flex-col text-left cursor-pointer transition-all duration-fast border"
      style={{
        gap: 10,
        padding: "16px 18px",
        borderRadius: "var(--r-md)",
        borderColor: selected ? "var(--accent)" : "var(--border-1)",
        background: selected ? "var(--accent-surface)" : "var(--bg-1)",
      }}
    >
      {/* Top row: leading icon + radio dot */}
      <div className="flex items-center justify-between">
        <span
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--r-sm)",
            background: selected ? "var(--accent)" : "var(--bg-3)",
            color: selected ? "var(--accent-fg)" : "var(--fg-2)",
            transition: "all var(--dur-fast) var(--ease)",
          }}
        >
          <Icon name={icon} size={16} />
        </span>

        <span
          aria-hidden
          className="inline-flex items-center justify-center"
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: `1.5px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
            transition: "border-color var(--dur-fast) var(--ease)",
          }}
        >
          {selected && (
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--accent)",
              }}
            />
          )}
        </span>
      </div>

      <div>
        <div
          className="t-title"
          style={{
            fontSize: 16,
            color: selected ? "var(--accent-text)" : "var(--fg-1)",
          }}
        >
          {title}
        </div>
        <p
          className="t-body-s"
          style={{
            marginTop: 6,
            color: selected ? "var(--fg-1)" : "var(--fg-3)",
            lineHeight: 1.45,
          }}
        >
          {description}
        </p>
      </div>

      {features && (
        <div
          className="t-mono-s"
          style={{
            marginTop: 4,
            color: selected ? "var(--accent-text)" : "var(--fg-4)",
          }}
        >
          {features}
        </div>
      )}
    </button>
  );
}
