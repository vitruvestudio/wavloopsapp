/**
 * Field — Wavloops V3 labeled text input primitive.
 *
 * Mirrors the prototype's inline `Field` definition (screens_producer_a.jsx)
 * exactly:
 *   - Label : .t-mono-s, fg-3, marginBottom 8
 *   - Input : h46, padding "0 14px", gap 10, bg-inset, r-md,
 *             border-2 default → border-accent + accent-ring shadow on focus
 *   - Input text : fontSize 14.5, fg-1
 *   - Optional 17px prefix icon (fg-3)
 *   - Optional hint below (.t-body-s, marginTop 7)
 *
 * Behaviour:
 *   - Focus emphasis driven by CSS `:focus-within` (no React state required —
 *     keeps the component cheap to render in long forms).
 *   - Supports both controlled (value/onChange) and uncontrolled
 *     (defaultValue) usage so it can be dropped into raw forms or wired to
 *     react-hook-form later without changes.
 *
 * Used by: AuthScreen, OnboardingScreen, EditServerScreen, Settings.
 */

"use client";

import * as React from "react";
import { Icon, type IconName } from "./Icon";

interface FieldProps {
  /** Mono uppercase label sitting above the input (e.g. "EMAIL"). */
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  name?: string;
  /** Optional 17px prefix icon, fg-3 colour. */
  icon?: IconName;
  /** Optional helper line under the input. */
  hint?: React.ReactNode;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  id?: string;
}

export function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  defaultValue,
  name,
  icon,
  hint,
  required,
  autoComplete,
  disabled,
  id,
}: FieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <div className="t-mono-s" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div
        className={[
          "flex items-center rounded-md border border-border-2 bg-bg-inset",
          "transition-all duration-fast",
          "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]",
          disabled ? "opacity-50" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ height: 46, padding: "0 14px", gap: 10 }}
      >
        {icon && <Icon name={icon} size={17} className="text-fg-3" />}
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-body)", fontSize: 14.5 }}
        />
      </div>
      {hint && (
        <div className="t-body-s" style={{ marginTop: 7 }}>
          {hint}
        </div>
      )}
    </label>
  );
}
