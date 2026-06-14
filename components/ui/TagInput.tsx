/**
 * TagInput — pixel-ported from prototype `screen_upload.jsx` lines 5-50.
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ [PLATINUM ×] [GOLD ×] [ type here…              ]         │  ← container
 *   └──────────────────────────────────────────────────────────┘
 *   [+ DIAMOND] [+ RIAA CERTIFIED] [+ BMI AWARD] [+ …]    2/8
 *     ↑ suggestion pills (hidden when value is full)       ↑ counter
 *
 * Behaviours:
 *   - Enter adds the current input as a tag (de-duped, case-insensitive).
 *   - Backspace on empty input pops the last tag.
 *   - Click on a suggestion pill adds it.
 *   - Click ✕ inside a chip removes it.
 *   - When value.length === max, the input + suggestions hide and the
 *     counter switches to accent-text.
 *
 * Optional `accent` prop swaps chip surface from bg-3/fg-1 to
 * accent-surface/accent-text — used in the onboarding certifications
 * step (prestige feel).
 *
 * Used by: OnboardingWizard step 4, Upload Beat (moods + artist types),
 * Settings (skills + genres).
 */

"use client";

import * as React from "react";
import { Icon } from "./Icon";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Maximum tags allowed. Once reached, the input + suggestions hide. */
  max?: number;
  /** Suggestion pills shown below the container (filtered against `value`). */
  suggestions?: string[];
  placeholder?: string;
  /** If true, chips use accent-surface / accent-text instead of bg-3 / fg-1. */
  accent?: boolean;
}

export function TagInput({
  value,
  onChange,
  max = 3,
  suggestions = [],
  placeholder,
  accent,
}: TagInputProps) {
  const [input, setInput] = React.useState("");
  const full = value.length >= max;

  const add = (raw: string) => {
    const v = raw.trim().replace(/\s+/g, " ");
    if (!v || full) return;
    if (value.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...value, v]);
    setInput("");
  };

  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  const avail = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div>
      {/* Container — same focus emphasis pattern as Field */}
      <div
        className="flex flex-wrap items-center rounded-md border border-border-2 bg-bg-inset transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
        style={{ minHeight: 46, padding: "7px 10px", gap: 8 }}
      >
        {value.map((t) => (
          <span
            key={t}
            className="t-mono-s inline-flex items-center"
            style={{
              height: 26,
              padding: "0 6px 0 10px",
              gap: 6,
              borderRadius: "var(--r-sm)",
              background: accent ? "var(--accent-surface)" : "var(--bg-3)",
              color: accent ? "var(--accent-text)" : "var(--fg-1)",
            }}
          >
            {t.toUpperCase()}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remove ${t}`}
              className="inline-flex cursor-pointer border-0 bg-transparent p-[2px]"
              style={{ color: "inherit" }}
            >
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
        {!full && (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={value.length ? "" : placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(input);
              } else if (e.key === "Backspace" && !input && value.length) {
                remove(value[value.length - 1]);
              }
            }}
            className="min-w-[90px] flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
            style={{
              height: 28,
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
          />
        )}
      </div>

      {/* Suggestions row + counter */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: 8 }}
      >
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          {!full &&
            avail.slice(0, 7).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="t-mono-s cursor-pointer border border-border-2 text-fg-3 transition-colors hover:bg-bg-3 hover:text-fg-1"
                style={{
                  height: 26,
                  padding: "0 10px",
                  borderRadius: "var(--r-pill)",
                  background: "transparent",
                }}
              >
                + {s.toUpperCase()}
              </button>
            ))}
        </div>
        <span
          className="t-mono-s shrink-0"
          style={{
            color: full ? "var(--accent-text)" : "var(--fg-4)",
            marginLeft: 10,
          }}
        >
          {value.length}/{max}
        </span>
      </div>
    </div>
  );
}
