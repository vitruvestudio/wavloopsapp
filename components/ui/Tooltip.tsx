/**
 * Tooltip — vanilla hover-/focus-triggered popover, ~70 lines.
 *
 *   <Tooltip content={<>...</>}>
 *     <Icon name="info" size={13} />
 *   </Tooltip>
 *
 * Shows on `mouseenter` + `focus`, hides on `mouseleave` + `blur`,
 * with a small delay so a quick mouse pass doesn't open it.
 *
 * Positioning:
 *   - `side="bottom"` (default) — drops below the trigger. Safer near
 *     the top of a page where the sticky PageHeader could clip an
 *     upward tooltip.
 *   - `side="top"` — appears above.
 *   In both cases the popover is centred on the trigger and uses
 *   `position: absolute` with the trigger's wrapping span as the
 *   `position: relative` anchor.
 *
 * Styling matches the AccountMenu panel: bg-2 + border-2 + shadow-pop +
 * r-md. Max 280px wide so paragraphs stay readable.
 *
 * Pointer-events: none so the tooltip doesn't intercept clicks on the
 * content underneath. Tap to dismiss isn't needed — the trigger handles
 * blur on iOS Safari.
 */

"use client";

import * as React from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  /** Open delay in ms. 200 by default — quick enough to feel snappy,
   *  slow enough that a mouse-by doesn't flash the popover. */
  openDelay?: number;
}

export function Tooltip({
  content,
  children,
  side = "bottom",
  openDelay = 200,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  const show = () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(true), openDelay);
  };

  const hide = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="absolute bg-bg-2 border border-border-2"
          style={{
            ...(side === "top"
              ? { bottom: "100%", marginBottom: 8 }
              : { top: "100%", marginTop: 8 }),
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: 220,
            maxWidth: 280,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-pop)",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
