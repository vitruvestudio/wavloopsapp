/**
 * Icon — Wavloops V3 line set.
 *
 * Custom single-source SVG registry. All icons share:
 *   - 24×24 viewBox
 *   - 1.75 stroke (round caps + joins)
 *   - currentColor for stroke (filled glyphs override with `fill=currentColor`)
 *
 * Filled glyphs (play, pause, skip-back, skip-fwd) set their own
 * fill="currentColor" so they paint solid; everything else is stroked.
 *
 * Add new icons by extending the `IconName` union + the switch.
 * No emoji, no multicolor — icon color is always a foreground token
 * or the accent (for active states).
 */

import * as React from "react";

export type IconName =
  /* nav + structure */
  | "server"
  | "library"
  | "users"
  | "settings"
  | "plus"
  | "sidebar-toggle"
  | "menu"
  | "close"
  /* topbar */
  | "search"
  | "bell"
  | "sun"
  | "moon"
  | "chevron-down"
  /* player */
  | "play"
  | "pause"
  | "skip-back"
  | "skip-fwd"
  | "volume"
  /* misc */
  | "heart"
  | "external"
  | "eye"
  | "chevron-left"
  /* dropdown / account menu */
  | "user"
  | "flame"
  | "log-out";

interface IconProps {
  name: IconName;
  /** Pixel size of the rendered svg (width === height). Defaults to 20. */
  size?: number;
  className?: string;
  /** Override stroke width if needed (default 1.75). */
  stroke?: number;
  /** Inline style override (e.g. PlayButton optical-centring marginLeft). */
  style?: React.CSSProperties;
}

export function Icon({
  name,
  size = 20,
  className,
  stroke = 1.75,
  style,
}: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    style,
    "aria-hidden": true,
  } as const;

  const lineProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    /* -------------------- nav + structure -------------------- */
    case "server":
      return (
        <svg {...common} {...lineProps}>
          <rect x="3.5" y="4.5" width="17" height="6.5" rx="1.5" />
          <rect x="3.5" y="13" width="17" height="6.5" rx="1.5" />
          <circle cx="7" cy="7.75" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="7" cy="16.25" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "library":
      /* Double music note — matches the proto's `note` semantic. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M9 17V4l11-2v13" />
          <circle cx="6.25" cy="17" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="17.25" cy="15" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "users":
      return (
        <svg {...common} {...lineProps}>
          <circle cx="9" cy="9" r="3.25" />
          <path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
          <path d="M15.5 7.5a2.75 2.75 0 110 5.5" />
          <path d="M16.5 13.5c2.7.5 4.5 2.5 4.5 5" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common} {...lineProps}>
          <circle cx="12" cy="12" r="2.75" />
          <path d="M19.4 14.3a1 1 0 00.2 1.1l.04.04a2 2 0 11-2.83 2.83l-.04-.04a1 1 0 00-1.1-.2 1 1 0 00-.6.92V19a2 2 0 11-4 0v-.05a1 1 0 00-.66-.92 1 1 0 00-1.1.2l-.04.04a2 2 0 11-2.83-2.83l.04-.04a1 1 0 00.2-1.1 1 1 0 00-.92-.6H5a2 2 0 110-4h.05a1 1 0 00.92-.66 1 1 0 00-.2-1.1l-.04-.04a2 2 0 112.83-2.83l.04.04a1 1 0 001.1.2 1 1 0 00.6-.92V5a2 2 0 114 0v.05a1 1 0 00.66.92 1 1 0 001.1-.2l.04-.04a2 2 0 112.83 2.83l-.04.04a1 1 0 00-.2 1.1 1 1 0 00.92.6H19a2 2 0 110 4h-.05a1 1 0 00-.92.6z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} {...lineProps}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "sidebar-toggle":
      return (
        <svg {...common} {...lineProps}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path d="M9 4.5v15" />
          <path d="M6.25 9.25l-1 1 1 1" />
        </svg>
      );
    case "menu":
      /* Hamburger — 3 horizontal lines. Used for mobile sidebar open. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...common} {...lineProps}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );

    /* -------------------- topbar -------------------- */
    case "search":
      return (
        <svg {...common} {...lineProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common} {...lineProps}>
          <path d="M6 9a6 6 0 0112 0v4l1.5 3h-15L6 13V9z" />
          <path d="M10 18.5a2 2 0 004 0" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common} {...lineProps}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common} {...lineProps}>
          <path d="M20 14.5A8 8 0 119.5 4a7 7 0 0010.5 10.5z" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common} {...lineProps}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );

    /* -------------------- player (filled glyphs) -------------------- */
    case "play":
      return (
        <svg {...common} fill="currentColor">
          <path d="M7.5 5.5v13l11-6.5z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common} fill="currentColor">
          <rect x="6.5" y="5.5" width="3.5" height="13" rx="0.6" />
          <rect x="14" y="5.5" width="3.5" height="13" rx="0.6" />
        </svg>
      );
    case "skip-back":
      return (
        <svg {...common} fill="currentColor">
          <path d="M19 5.5v13l-9-6.5z" />
          <rect x="5" y="5.5" width="2.5" height="13" rx="0.6" />
        </svg>
      );
    case "skip-fwd":
      return (
        <svg {...common} fill="currentColor">
          <path d="M5 5.5v13l9-6.5z" />
          <rect x="16.5" y="5.5" width="2.5" height="13" rx="0.6" />
        </svg>
      );
    case "volume":
      return (
        <svg {...common} {...lineProps}>
          <path
            d="M4 9.5h3l5-3.5v12l-5-3.5H4z"
            fill="currentColor"
            stroke="none"
          />
          <path d="M16 9c1 1 1.5 2 1.5 3s-.5 2-1.5 3" />
          <path d="M18.5 6.5c2 2 2.5 3.5 2.5 5.5s-.5 3.5-2.5 5.5" />
        </svg>
      );

    /* -------------------- misc -------------------- */
    case "heart":
      return (
        <svg {...common} {...lineProps}>
          <path d="M12 19.5l-7.2-6.6a4.5 4.5 0 116.4-6.3l.8.8.8-.8a4.5 4.5 0 116.4 6.3z" />
        </svg>
      );
    case "external":
      return (
        <svg {...common} {...lineProps}>
          <path d="M9 5H5v14h14v-4" />
          <path d="M14 5h5v5M19 5l-9 9" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common} {...lineProps}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common} {...lineProps}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );

    /* -------------------- dropdown / account menu -------------------- */
    case "user":
      /* Single user silhouette — distinct from "users" plural icon
         (which is two figures, used for Contacts nav). */
      return (
        <svg {...common} {...lineProps}>
          <circle cx="12" cy="8.5" r="3.75" />
          <path d="M4.5 20c0-3.6 3-6 7.5-6s7.5 2.4 7.5 6" />
        </svg>
      );
    case "flame":
      /* Upgrade-plan glyph. Single tear-shaped flame. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M12 3s-1 3-3 5.5-3.5 4.5-3.5 7.2A6.5 6.5 0 0012 22a6.5 6.5 0 006.5-6.3c0-2.3-1.4-4-2.7-5.4-1.8-1.9-2-3.5-2-4.3-1.2 1.4-2 2.3-3 3.5C10.5 7 11.5 4.5 12 3z" />
        </svg>
      );
    case "log-out":
      return (
        <svg {...common} {...lineProps}>
          <path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H10" />
        </svg>
      );

    default:
      return null;
  }
}
