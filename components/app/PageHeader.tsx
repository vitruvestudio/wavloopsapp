/**
 * PageHeader — per-screen sticky title bar (responsive).
 *
 * Desktop: 18px 30px padding · title fontSize 23 · sub mono-s below · right slot inline
 * Mobile : 14px 18px padding · title fontSize 19 · sub stays below · right slot
 *          shrinks (pages can hide non-critical buttons via `sm:` classes)
 *
 * Sticky with bg-0/82% + backdrop-blur(12px), per proto PTopBar spec.
 */

import * as React from "react";
import { IconButton } from "@/components/ui/IconButton";

interface PageHeaderProps {
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** Render a chevron-left back button to the left of the title. */
  back?: boolean;
  onBack?: () => void;
  /** Right slot — buttons / chips / actions. Pages choose what hides on mobile. */
  right?: React.ReactNode;
}

export function PageHeader({ title, sub, back, onBack, right }: PageHeaderProps) {
  return (
    <header
      className={[
        "sticky top-0 z-20 flex shrink-0 items-center border-b border-border-1",
        "gap-[12px] px-[18px] py-[14px] min-h-[64px]",
        "lg:gap-[16px] lg:px-[30px] lg:py-[18px] lg:min-h-[76px]",
      ].join(" ")}
      style={{
        background: "color-mix(in oklch, var(--bg-0) 82%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {back && (
        <IconButton
          name="chevron-left"
          size={36}
          iconSize={20}
          onClick={onBack}
          label="Back"
        />
      )}
      <div className="min-w-0 flex-1">
        <h1
          className="t-h2 truncate"
          style={{ fontSize: "clamp(18px, 4vw, 23px)" }}
        >
          {title}
        </h1>
        {sub && (
          <div
            className="t-mono-s truncate"
            style={{ color: "var(--fg-3)", marginTop: 4 }}
          >
            {sub}
          </div>
        )}
      </div>
      {right}
    </header>
  );
}
