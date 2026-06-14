import type { Config } from "tailwindcss";

/**
 * Wavloops V3 — Tailwind config
 *
 * Mirrors the CSS variables defined in `app/globals.css`.
 * Use semantic `.t-*` classes for typography (defined in globals.css),
 * and these utility tokens for layout / one-off styling.
 *
 * Source of truth: `Wavloops Servers 2026/DS/colors_and_type.css`.
 */

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "var(--sp-6)",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        /* Surfaces (cool-tinted neutrals, oklch hue ~265) */
        "bg-0": "var(--bg-0)",
        "bg-1": "var(--bg-1)",
        "bg-2": "var(--bg-2)",
        "bg-3": "var(--bg-3)",
        "bg-inset": "var(--bg-inset)",

        /* Borders */
        "border-1": "var(--border-1)",
        "border-2": "var(--border-2)",
        "border-strong": "var(--border-strong)",

        /* Foreground (4 levels) */
        "fg-1": "var(--fg-1)",
        "fg-2": "var(--fg-2)",
        "fg-3": "var(--fg-3)",
        "fg-4": "var(--fg-4)",

        /* Brand accent — electric indigo */
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-press": "var(--accent-press)",
        "accent-fg": "var(--accent-fg)",
        "accent-ring": "var(--accent-ring)",
        "accent-surface": "var(--accent-surface)",
        "accent-text": "var(--accent-text)",
        "accent-glow": "var(--accent-glow)",

        /* Semantic (muted so they never compete with the accent) */
        ok: "var(--ok)",
        "ok-surface": "var(--ok-surface)",
        warn: "var(--warn)",
        "warn-surface": "var(--warn-surface)",
        danger: "var(--danger)",
        "danger-surface": "var(--danger-surface)",
      },
      spacing: {
        /* 4px base scale — mirrors --sp-* CSS vars */
        "sp-1": "4px",
        "sp-2": "8px",
        "sp-3": "12px",
        "sp-4": "16px",
        "sp-5": "20px",
        "sp-6": "24px",
        "sp-8": "32px",
        "sp-10": "40px",
        "sp-12": "48px",
        "sp-16": "64px",
        "sp-20": "80px",
      },
      borderRadius: {
        /* 10px default (DS spec) */
        xs: "4px",
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        pill: "999px",
      },
      borderWidth: {
        hairline: "1px",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        /* Mono caps tracking — DS standard */
        mono: "0.09em",
        "mono-s": "0.1em",
        "mono-lg": "0.06em",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        pop: "var(--shadow-pop)",
        /* Accent glow used on play button, played waveform bars, focus ring */
        glow: "0 0 0 6px var(--accent-ring), 0 8px 24px -6px var(--accent-glow)",
      },
      transitionDuration: {
        fast: "120ms",
        DEFAULT: "200ms",
        slow: "360ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        /* Equalizer bars on currently-playing rows */
        "wl-bar": {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "wl-bar": "wl-bar 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
