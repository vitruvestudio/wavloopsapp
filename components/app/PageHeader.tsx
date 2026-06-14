/**
 * PageHeader — per-screen sticky title bar.
 *
 * Mirrors the prototype's `PTopBar`. Lives INSIDE the content slot
 * (not the global TopBar), sticky to the top of the scrollable area,
 * uses a blurred bg-0/82% surface so content scrolls under it cleanly.
 *
 *   [← back?] [Title h2 + sub mono]                       [right slot]
 *
 *   - h2 fontSize 23 (smaller than .t-h1 — page headers don't shout)
 *   - sub = mono-s uppercase, fg-3, marginTop 5
 *   - min-height 76, padding 18px 30px
 *   - right slot is a flex row of buttons / chips / actions
 *
 * Pages render this themselves; the (app) layout doesn't include it.
 */

import * as React from "react";
import { IconButton } from "@/components/ui/IconButton";

interface PageHeaderProps {
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** Render a chevron-left back button to the left of the title. */
  back?: boolean;
  onBack?: () => void;
  /** Right slot — buttons / chips / actions. */
  right?: React.ReactNode;
}

export function PageHeader({ title, sub, back, onBack, right }: PageHeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 flex shrink-0 items-center border-b border-border-1"
      style={{
        gap: 16,
        padding: "18px 30px",
        minHeight: 76,
        background: "color-mix(in oklch, var(--bg-0) 82%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {back && (
        <IconButton
          name="chevron-left"
          size={38}
          iconSize={20}
          onClick={onBack}
          label="Back"
        />
      )}
      <div className="min-w-0">
        <h1
          className="t-h2 truncate"
          style={{ fontSize: 23 }}
        >
          {title}
        </h1>
        {sub && (
          <div
            className="t-mono-s"
            style={{ color: "var(--fg-3)", marginTop: 5 }}
          >
            {sub}
          </div>
        )}
      </div>
      <div className="flex-1" />
      {right}
    </header>
  );
}
