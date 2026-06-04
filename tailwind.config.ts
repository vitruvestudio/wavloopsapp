import type { Config } from "tailwindcss";

/**
 * Wavloops Design System 2026 — Tailwind config
 *
 * Aligned with docs/ds/wavloops-design-system.md and colors_and_type.css.
 * Token values mirror CSS variables in app/globals.css (single source of truth).
 *
 * Legacy radii (r-0/1/2/3) kept as deprecated aliases for backward-compat
 * with the live concierge-MVP landing. New work uses sm/cover/card/pill.
 */

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-deep": "var(--bg-deep)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        "text-1": "var(--text-1)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        "accent-line": "var(--accent-line)",
        danger: "var(--danger)",
        // legacy alias kept for components using `text-destructive` / `bg-destructive`
        destructive: "var(--danger)",

        // shadcn semantic aliases (mapped to Wavloops tokens)
        background: "var(--bg)",
        foreground: "var(--text-1)",
        border: "var(--line-strong)",
        input: "var(--line-strong)",
        ring: "var(--accent)",
        muted: { DEFAULT: "var(--surface-1)", foreground: "var(--text-2)" },
        card: { DEFAULT: "var(--surface-1)", foreground: "var(--text-1)" },
        popover: { DEFAULT: "var(--surface-2)", foreground: "var(--text-1)" },
        primary: { DEFAULT: "var(--accent)", foreground: "var(--accent-ink)" },
        secondary: { DEFAULT: "var(--text-1)", foreground: "#000000" },
        accent_ui: { DEFAULT: "var(--surface-2)", foreground: "var(--text-1)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // === DS 2026 scale ===
        "display-hero": ["96px", { lineHeight: "0.92", letterSpacing: "-0.05em" }],
        "display-h2": ["64px", { lineHeight: "0.95", letterSpacing: "-0.045em" }],
        "display-h3": ["34px", { lineHeight: "1.0", letterSpacing: "-0.04em" }],
        "display-metric": ["26px", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        title: ["20px", { lineHeight: "1.2" }],
        lead: ["18px", { lineHeight: "1.55" }],
        "lead-sm": ["16px", { lineHeight: "1.55" }],
        body: ["14px", { lineHeight: "1.55" }],
        caption: ["12px", { lineHeight: "1.5" }],
        "mono-eyebrow": ["11px", { lineHeight: "1.6", letterSpacing: "0.20em" }],
        "mono-data": ["10px", { lineHeight: "1.6", letterSpacing: "0.08em" }],
        "mono-tiny": ["9.5px", { lineHeight: "1.6", letterSpacing: "0.12em" }],

        // === Legacy tokens (kept for current landing components — deprecated) ===
        "display-h4": ["48px", { lineHeight: "0.9", letterSpacing: "-0.03em" }],
        "mono-caption": ["10px", { lineHeight: "1.6", letterSpacing: "0.18em" }],
        "button-lg": ["15px", { lineHeight: "1.0", letterSpacing: "0.02em" }],
        "button-sm": ["12px", { lineHeight: "1.0" }],
      },
      spacing: {
        "s-1": "4px",
        "s-2": "8px",
        "s-3": "12px",
        "s-4": "16px",
        "s-5": "24px",
        "s-6": "32px",
        "s-7": "48px",
        "s-8": "64px",
        "s-9": "96px",
      },
      borderRadius: {
        // === DS 2026 — premium rounded ===
        sm: "10px",          // small thumbs, inputs
        cover: "12px",       // cover art
        card: "16px",        // cards / panels
        pill: "999px",       // buttons, chips, tags, search

        // === Tailwind/shadcn defaults remapped to DS 2026 ===
        DEFAULT: "16px",
        lg: "16px",
        md: "12px",
        // (sm already declared above as 10px — matches new DS)

        // === Legacy tokens (kept for current landing — deprecated) ===
        "r-0": "0px",
        "r-1": "2px",
        "r-2": "4px",
        "r-3": "6px",
      },
      borderWidth: {
        hairline: "1px",
        strong: "2px",
      },
      letterSpacing: {
        "display-very-tight": "-0.05em",
        "display-tight": "-0.045em",
        "display-normal": "-0.04em",
        "display-loose": "-0.03em",
        subtitle: "-0.02em",
        body: "0em",
        button: "0.02em",
        "mono-data": "0.08em",
        "mono-eyebrow": "0.20em",
        "mono-tiny": "0.12em",
        // legacy tracking values (current landing uses these)
        "mono-data-loose": "0.14em",
        "mono-button": "0.16em",
        "mono-registration": "0.20em",
      },
      boxShadow: {
        // Reserved for floating overlays + primary CTA hover (DS 2026)
        pop: "var(--shadow-pop)",
        "glow-accent": "var(--glow-accent)",
      },
      transitionTimingFunction: {
        wav: "cubic-bezier(.2,.8,.2,1)",
      },
      transitionDuration: {
        wav: "120ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "wave-pulse": {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.15)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "wave-pulse": "wave-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
