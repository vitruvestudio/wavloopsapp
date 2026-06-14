/**
 * IconButton — square/round icon-only action.
 *
 * Mirrors the prototype's IconButton (components.jsx) exactly:
 *   variant = "ghost" (default) | "solid"
 *     ghost → transparent bg, hover → bg-2
 *     solid → bg-2 bg + border-2, hover → bg-3
 *   active → accent-surface bg + accent-text (e.g. theme toggle on)
 *   round → border-radius pill (otherwise --r-md, 10px)
 *
 * Optional `dot` overlays a 7px accent indicator at the top-right
 * (used for "unread bell"). Sits above any border.
 */

import * as React from "react";
import { Icon, type IconName } from "./Icon";

type IconButtonVariant = "ghost" | "solid";

interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "name"> {
  name: IconName;
  size?: number;
  iconSize?: number;
  variant?: IconButtonVariant;
  active?: boolean;
  round?: boolean;
  dot?: boolean;
  label?: string;
}

export function IconButton({
  name,
  size = 38,
  iconSize,
  variant = "ghost",
  active = false,
  round = false,
  dot = false,
  label,
  className,
  style,
  ...rest
}: IconButtonProps) {
  // Resolve background + foreground per state (active > variant default)
  const bgClass = active
    ? "bg-accent-surface"
    : variant === "solid"
      ? "bg-bg-2 hover:bg-bg-3"
      : "hover:bg-bg-2";
  const fgClass = active
    ? "text-accent-text"
    : "text-fg-2 hover:text-fg-1";
  const borderClass =
    variant === "solid" ? "border border-border-2" : "border border-transparent";

  return (
    <button
      {...rest}
      aria-label={label ?? name}
      className={[
        "inline-flex shrink-0 items-center justify-center",
        "transition-all duration-fast",
        round ? "rounded-pill" : "rounded-md",
        bgClass,
        fgClass,
        borderClass,
        "relative",
        className ?? "",
      ].join(" ")}
      style={{ width: size, height: size, ...style }}
    >
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} />
      {dot && (
        <span
          aria-hidden
          className="absolute rounded-pill bg-accent"
          style={{
            top: 7,
            right: 8,
            width: 8,
            height: 8,
            border: "2px solid var(--bg-0)",
          }}
        />
      )}
    </button>
  );
}
