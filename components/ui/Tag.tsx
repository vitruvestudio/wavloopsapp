/**
 * Tag — mono uppercase chip. Used for BPM, key, mood, genre,
 * visibility, status — anywhere small technical metadata lives.
 *
 * Variants:
 *   outline (default) — hairline border, bg-1, fg-2 text
 *   solid             — bg-2 fill, no border (denser tables)
 *   accent            — accent-surface fill, accent-text — for the played key,
 *                       active filter chip, currently-playing badge
 */

import * as React from "react";

type Variant = "outline" | "solid" | "accent";

interface TagProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const VARIANT: Record<Variant, string> = {
  outline: "border border-border-1 bg-bg-1 text-fg-2",
  solid: "bg-bg-2 text-fg-2",
  accent: "bg-accent-surface text-accent-text",
};

export function Tag({ children, variant = "outline", className }: TagProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-sm px-[8px] py-[3px]",
        "font-mono text-[10px] font-medium uppercase tracking-mono-s",
        VARIANT[variant],
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
