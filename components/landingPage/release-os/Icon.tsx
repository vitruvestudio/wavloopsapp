/**
 * Wavloops Release OS — Icon system
 *
 * Single-component icon registry that mirrors the SVG paths from the canonical
 * landing reference (`Wavloops - OS Release 2026/Pages/Wavloops Landing.html`).
 *
 * Usage:  <Icon name="play" size={12} className="text-accent" />
 *
 * All icons share a 24×24 viewBox. Stroke-style icons inherit `currentColor`
 * via `stroke`; solid icons override with `fill="currentColor"`.
 * Add a new entry only when a new section needs it — keep the registry lean.
 */

import * as React from "react";

export type IconName =
  | "arrowR"
  | "play"
  | "check"
  | "lock"
  | "upload"
  | "youtube"
  | "menu"
  | "library"
  | "grid"
  | "globe"
  | "cal"
  | "drive"
  | "clock"
  | "image"
  | "type"
  | "tag"
  | "cart"
  | "cloud"
  | "bolt"
  | "chev"
  | "send"
  | "target"
  | "arrowDn"
  | "shield"
  | "search"
  | "link"
  | "plus"
  | "claude";

interface IconProps {
  name: IconName;
  /** Pixel size of the rendered svg (width === height). Defaults to 16. */
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
  } as const;

  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "arrowR":
      return (
        <svg {...common} {...stroke}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} {...stroke}>
          <path d="M5 12l4 4 10-10" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common} {...stroke}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common} {...stroke}>
          <path d="M12 16V5M7 10l5-5 5 5" />
          <path d="M5 19h14" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} {...stroke}>
          <rect x="3" y="6" width="18" height="12" rx="3.5" />
          <path
            d="M11 9.5l4 2.5-4 2.5z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "menu":
      return (
        <svg {...common} {...stroke}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "library":
      return (
        <svg {...common} {...stroke}>
          <path d="M4 19V5l7 2v14l-7-2Z" />
          <path d="M13 7l7-2v14l-7 2V7Z" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common} {...stroke}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common} {...stroke}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.3 2.4 2.3 14.6 0 17M12 3.5c-2.3 2.4-2.3 14.6 0 17" />
        </svg>
      );
    case "cal":
      return (
        <svg {...common} {...stroke}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M4 9h16M8 3v4M16 3v4" />
        </svg>
      );
    case "drive":
      return (
        <svg {...common} {...stroke}>
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M3 13h18" />
          <circle cx="17" cy="15.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common} {...stroke}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case "image":
      return (
        <svg {...common} {...stroke}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <circle cx="9" cy="10" r="1.7" />
          <path d="M5 18l4.5-4.5 3 3L16 13l3.5 3.5" />
        </svg>
      );
    case "type":
      return (
        <svg {...common} {...stroke}>
          <path d="M5 6h14M12 6v13M9 19h6" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common} {...stroke}>
          <path d="M4 12.5V5a1 1 0 011-1h7.5L20 11.5a1.5 1.5 0 010 2.1l-6.4 6.4a1.5 1.5 0 01-2.1 0L4 12.5Z" />
          <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "cart":
      return (
        <svg {...common} {...stroke}>
          <circle cx="9.5" cy="20" r="1.3" />
          <circle cx="17" cy="20" r="1.3" />
          <path d="M3 4h2l2.2 11h10l1.8-8H6" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common} {...stroke}>
          <path d="M7.5 18a4 4 0 01-.3-8 5 5 0 019.6-1A3.5 3.5 0 0117 18H7.5Z" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13 3L5 13h5l-1 8 8-10h-5l1-8Z" />
        </svg>
      );
    case "chev":
      return (
        <svg {...common} {...stroke}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case "send":
      return (
        <svg {...common} {...stroke}>
          <path d="M4.5 12L20 5l-6.2 14.5-2.6-6.4L4.5 12Z" />
        </svg>
      );
    case "target":
      return (
        <svg {...common} {...stroke}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "arrowDn":
      return (
        <svg {...common} {...stroke}>
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common} {...stroke}>
          <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common} {...stroke}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
      );
    case "link":
      return (
        <svg {...common} {...stroke}>
          <path d="M9.5 14.5l5-5M8 11l-2 2a3.5 3.5 0 005 5l2-2M16 13l2-2a3.5 3.5 0 00-5-5l-2 2" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} {...stroke}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "claude":
      // Closer approximation of the Anthropic / Claude burst — two
      // interlocking petals (vertical + horizontal) that meet at the centre,
      // mimicking the multi-armed curved-rosette shape of the official mark.
      // Flat-fill via `currentColor` so the icon recolors anywhere it's used.
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 1.2 C 12.7 7.2 13.9 10.1 16.8 12 C 13.9 13.9 12.7 16.8 12 22.8 C 11.3 16.8 10.1 13.9 7.2 12 C 10.1 10.1 11.3 7.2 12 1.2 Z M1.2 12 C 7.2 11.3 10.1 10.1 12 7.2 C 13.9 10.1 16.8 11.3 22.8 12 C 16.8 12.7 13.9 13.9 12 16.8 C 10.1 13.9 7.2 12.7 1.2 12 Z" />
        </svg>
      );
    default:
      return null;
  }
}
