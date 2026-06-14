/**
 * IconButton — square icon-only action. Used in topbars, rows,
 * player controls. Hover lifts a tonal step (bg-2). Active states
 * (e.g. notifications open, theme toggled) get `active=true` → accent-surface fill.
 */

import * as React from "react";
import { Icon, type IconName } from "./Icon";

interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "name"> {
  name: IconName;
  size?: number;
  iconSize?: number;
  active?: boolean;
  /** Optional small dot indicator (e.g. unread bell). */
  dot?: boolean;
  label?: string;
}

export function IconButton({
  name,
  size = 36,
  iconSize,
  active,
  dot,
  label,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label ?? name}
      className={[
        "relative inline-flex shrink-0 items-center justify-center rounded-md",
        "transition-[background-color,color] duration-fast",
        active
          ? "bg-accent-surface text-accent-text"
          : "text-fg-2 hover:bg-bg-2 hover:text-fg-1",
        className ?? "",
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} />
      {dot && (
        <span
          aria-hidden
          className="absolute top-[8px] right-[8px] h-[7px] w-[7px] rounded-full bg-accent"
          style={{ boxShadow: "0 0 0 2px var(--bg-0)" }}
        />
      )}
    </button>
  );
}
