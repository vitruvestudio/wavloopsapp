/**
 * Button — Wavloops V3 primitive.
 *
 * Mirrors the prototype's Button (components.jsx) exactly:
 *   - Heights:   sm 32 · md 40 · lg 48
 *   - Padding:   sm "0 12" · md "0 16" · lg "0 22"
 *   - FontSize:  sm 13 · md 14 · lg 15  (semibold, letter-spacing -0.005em)
 *   - Hover: lifts by 1px (translateY(-1px)) + bg shifts to *-hover
 *   - Border: 1px solid (transparent on primary, --border-2 on secondary/outline)
 *
 * NO outer glow on the regular Button — that's reserved for PlayButton
 * (signature, in PlayerDock) and the Quick add sidebar pill. Regular
 * primary CTAs are flat-filled accent.
 *
 * Variants:
 *   primary    — accent fill (default CTA)
 *   secondary  — bg-2 fill, border, used in toolbars (e.g. Preview Server Page)
 *   ghost      — transparent, used in topbars + cancel actions
 *   outline    — transparent fill, border, used in less-prominent toggles
 *   danger     — danger fill (destructive actions)
 */

import * as React from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: IconName;
  iconRight?: IconName;
}

const HEIGHTS: Record<Size, number> = { sm: 32, md: 40, lg: 48 };
const PADDINGS: Record<Size, string> = {
  sm: "0 12px",
  md: "0 16px",
  lg: "0 22px",
};
const FONT_SIZES: Record<Size, number> = { sm: 13, md: 14, lg: 15 };
const ICON_SIZES: Record<Size, number> = { sm: 17, md: 17, lg: 19 };

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg border border-transparent hover:bg-accent-hover active:bg-accent-press",
  secondary:
    "bg-bg-2 text-fg-1 border border-border-2 hover:bg-bg-3",
  ghost:
    "bg-transparent text-fg-2 border border-transparent hover:bg-bg-2 hover:text-fg-1",
  outline:
    "bg-transparent text-fg-2 border border-border-2 hover:text-fg-1",
  danger:
    "bg-danger text-white border border-transparent hover:opacity-90 active:opacity-80",
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  icon,
  iconRight,
  className,
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={[
        "group inline-flex items-center justify-center whitespace-nowrap rounded-md",
        "transition-[background-color,transform,color] duration-fast",
        "hover:-translate-y-px active:translate-y-0",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:transform-none",
        VARIANT_CLASS[variant],
        full ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        height: HEIGHTS[size],
        padding: PADDINGS[size],
        gap: 8,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: FONT_SIZES[size],
        letterSpacing: "-0.005em",
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={ICON_SIZES[size]} />}
      {children}
      {iconRight && <Icon name={iconRight} size={ICON_SIZES[size]} />}
    </button>
  );
}
