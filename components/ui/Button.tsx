/**
 * Button — Wavloops V3 primitive.
 *
 * Variants:
 *   primary    — accent fill (default action, 1 per screen ideally)
 *   secondary  — bg-2 fill, hairline border
 *   ghost      — transparent, used in topbars + cancel actions
 *   danger     — danger fill (destructive actions)
 *
 * Sizes:
 *   sm  → 32px height · 13px text
 *   md  → 38px height · 14px text (default)
 *   lg  → 44px height · 15px text
 *
 * Optional `icon` prefixes a 16px icon. Optional `full` makes
 * the button stretch to its container's width.
 */

import * as React from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: IconName;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-press shadow-glow/0 hover:shadow-[0_8px_24px_-6px_var(--accent-glow)]",
  secondary:
    "bg-bg-2 text-fg-1 border border-border-1 hover:bg-bg-3 active:translate-y-px",
  ghost:
    "bg-transparent text-fg-2 hover:bg-bg-2 hover:text-fg-1 active:translate-y-px",
  danger:
    "bg-danger text-white hover:opacity-90 active:opacity-80",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-sp-3 text-[13px] gap-sp-2 rounded-md",
  md: "h-[38px] px-sp-4 text-[14px] gap-sp-2 rounded-md",
  lg: "h-11 px-sp-5 text-[15px] gap-sp-3 rounded-md",
};

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

export function Button({
  variant = "primary",
  size = "md",
  full,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center font-body font-semibold whitespace-nowrap",
        "transition-[background-color,box-shadow,transform,color] duration-fast",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT[variant],
        SIZE[size],
        full ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && <Icon name={icon} size={ICON_SIZE[size]} />}
      {children}
    </button>
  );
}
