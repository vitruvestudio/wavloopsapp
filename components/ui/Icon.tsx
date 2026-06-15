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
  | "log-out"
  /* onboarding / forms */
  | "upload"
  | "instagram"
  | "x-logo"
  | "youtube"
  | "mic"
  | "globe"
  | "link"
  | "arrow-right"
  | "check"
  | "trash"
  | "x"
  /* server card / visibility */
  | "lock"
  | "chevron-right"
  | "note"
  /* beat library / row */
  | "waves"
  | "repeat"
  | "drag"
  | "more"
  /* upload — auto-detect indicator */
  | "zap"
  /* info / tooltip */
  | "info"
  /* library view toggle */
  | "view-list"
  | "view-grid"
  /* server detail page actions */
  | "copy"
  | "share"
  | "edit"
  | "mail"
  /* contact detail */
  | "clock"
  | "phone";

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

    /* -------------------- onboarding / forms -------------------- */
    case "upload":
      return (
        <svg {...common} {...lineProps}>
          <path d="M21 15v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3" />
          <path d="M17 8l-5-5-5 5" />
          <path d="M12 3v13" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} {...lineProps}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="17.25" cy="6.75" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "x-logo":
      /* X (Twitter) letter glyph */
      return (
        <svg {...common} {...lineProps}>
          <path d="M5 4l14 16M19 4L5 20" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} {...lineProps}>
          <rect x="2.5" y="6.5" width="19" height="11" rx="3" />
          <path d="M10.5 9.75v4.5l4-2.25z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "mic":
      return (
        <svg {...common} {...lineProps}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0013 0" />
          <path d="M12 17.5V21" />
          <path d="M9 21h6" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common} {...lineProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17" />
          <path d="M12 3.5c2.5 3 2.5 14 0 17" />
          <path d="M12 3.5c-2.5 3-2.5 14 0 17" />
        </svg>
      );
    case "link":
      return (
        <svg {...common} {...lineProps}>
          <path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 10-5.66-5.66l-1.5 1.5" />
          <path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 105.66 5.66l1.5-1.5" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common} {...lineProps}>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} {...lineProps}>
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common} {...lineProps}>
          <path d="M4 7h16" />
          <path d="M9 7V4.5h6V7" />
          <path d="M6.5 7l1 13a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5l1-13" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );
    case "x":
      /* Alias of close — small X used inside chips and inputs. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );

    /* -------------------- server card / visibility -------------------- */
    case "lock":
      return (
        <svg {...common} {...lineProps}>
          <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
          <path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common} {...lineProps}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case "note":
      /* Single music note — used for COMP beat type and Spotify
         placement glyphs. Smaller, less ornate than the `library`
         double-note used in the sidebar nav. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M10 18V5l9-1.5v12" />
          <circle cx="7.5" cy="18" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="15.5" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      );

    /* -------------------- beat library / row -------------------- */
    case "waves":
      /* Equalizer bars — used inside the Tag for COMP beat type. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M3 12v0M7.5 8.5v7M12 5.5v13M16.5 8.5v7M21 12v0" />
        </svg>
      );
    case "repeat":
      /* Loop arrows — used inside the Tag for LOOP beat type. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M4 9V8a2 2 0 012-2h12l-3-3" />
          <path d="M20 15v1a2 2 0 01-2 2H6l3 3" />
        </svg>
      );
    case "drag":
      /* 6-dot grip handle. */
      return (
        <svg {...common} fill="currentColor">
          <circle cx="9" cy="6" r="1.2" />
          <circle cx="15" cy="6" r="1.2" />
          <circle cx="9" cy="12" r="1.2" />
          <circle cx="15" cy="12" r="1.2" />
          <circle cx="9" cy="18" r="1.2" />
          <circle cx="15" cy="18" r="1.2" />
        </svg>
      );
    case "more":
      /* 3 horizontal dots — row action menu trigger. */
      return (
        <svg {...common} fill="currentColor">
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
        </svg>
      );

    /* -------------------- upload / auto-detect -------------------- */
    case "zap":
      /* Lightning bolt — auto-detected indicator next to TEMPO / KEY /
         LENGTH / LOUDNESS labels on the Upload page. */
      return (
        <svg {...common} fill="currentColor">
          <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
        </svg>
      );

    case "info":
      /* Circled "i" — tooltip / contextual help affordance. */
      return (
        <svg {...common} {...lineProps}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v6" />
          <circle
            cx="12"
            cy="7.5"
            r="1"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );

    /* -------------------- library view toggle -------------------- */
    case "view-list":
      /* Three rows, each = bullet dot + horizontal line — reads as
         "list with leading thumbnails", matching what the library
         renders. */
      return (
        <svg {...common} fill="currentColor">
          <circle cx="5" cy="6.5" r="1.4" />
          <rect x="9" y="5.5" width="12" height="2" rx="1" />
          <circle cx="5" cy="12" r="1.4" />
          <rect x="9" y="11" width="12" height="2" rx="1" />
          <circle cx="5" cy="17.5" r="1.4" />
          <rect x="9" y="16.5" width="12" height="2" rx="1" />
        </svg>
      );
    case "view-grid":
      /* 2×2 squares — classic grid affordance. */
      return (
        <svg {...common} fill="currentColor">
          <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2" />
          <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.2" />
          <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.2" />
          <rect x="13" y="13" width="7.5" height="7.5" rx="1.2" />
        </svg>
      );

    /* -------------------- server detail actions -------------------- */
    case "copy":
      /* Two stacked rounded rectangles — clipboard duplicate. */
      return (
        <svg {...common} {...lineProps}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
        </svg>
      );
    case "share":
      /* Three nodes connected by two lines — generic share glyph. */
      return (
        <svg {...common} {...lineProps}>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="M8.25 10.75l7.5-4.5" />
          <path d="M8.25 13.25l7.5 4.5" />
        </svg>
      );
    case "edit":
      /* Pencil — classic edit affordance. */
      return (
        <svg {...common} {...lineProps}>
          <path d="M14.5 4.5l5 5L8 21l-5.5.5L3 16z" />
          <path d="M13 6l5 5" />
        </svg>
      );
    case "mail":
      /* Envelope. */
      return (
        <svg {...common} {...lineProps}>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="M3.5 7l8.5 6.5L20.5 7" />
        </svg>
      );

    /* -------------------- contact detail -------------------- */
    case "clock":
      return (
        <svg {...common} {...lineProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common} {...lineProps}>
          <path d="M5 4h3l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v3a2 2 0 01-2 2A14 14 0 013 6a2 2 0 012-2z" />
        </svg>
      );

    default:
      return null;
  }
}
