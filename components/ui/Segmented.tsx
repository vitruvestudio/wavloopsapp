/**
 * Segmented — pill-style 2/3-option toggle (Composition / Loop,
 * All / Mine / Theirs, mobile / desktop, etc.).
 *
 *   ┌──────────────────────────────────┐
 *   │ ▓ Composition ▓ │   Loop          │   active = solid, inactive = ghost
 *   └──────────────────────────────────┘
 *
 * Generic over the value type so the parent's `value` literal stays
 * typed end-to-end.
 *
 * Sizes:
 *   - default (md): height 36
 *   - sm           : height 30 (used in toolbars, page headers)
 */

"use client";

import * as React from "react";

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const h = size === "sm" ? 30 : 36;
  const pad = size === "sm" ? "0 12px" : "0 16px";
  const fontSize = size === "sm" ? 13 : 14;

  return (
    <div
      role="tablist"
      className={[
        "inline-flex items-center border border-border-2 bg-bg-inset",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ padding: 4, gap: 0, borderRadius: "var(--r-md)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className="cursor-pointer border-0 transition-all duration-fast"
            style={{
              height: h,
              padding: pad,
              borderRadius: "var(--r-sm)",
              // Active pill: bg-0 + subtle shadow → reads as an
              // elevated "card" lifted off the bg-inset container.
              // Works in both light and dark modes because bg-0 is
              // always one step lighter than bg-inset.
              background: active ? "var(--bg-0)" : "transparent",
              boxShadow: active
                ? "0 1px 3px oklch(0 0 0 / 0.08), 0 1px 1px oklch(0 0 0 / 0.04)"
                : "none",
              color: active ? "var(--fg-1)" : "var(--fg-3)",
              fontFamily: "var(--font-body)",
              fontWeight: active ? 600 : 500,
              fontSize,
              letterSpacing: "-0.005em",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
