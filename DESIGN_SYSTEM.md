# Wavloops — Design System

> Single-source-of-truth pour un agent externe (Claude.ai). Upload ce fichier dans le Project Knowledge.
> Tout ce qu'il faut pour reproduire fidèlement l'UI Wavloops : tokens, fonts, configs, primitives shadcn, helpers.

---

## 0. Contexte produit

**Wavloops** — Gated downloads for music producers. Les producteurs gatent leurs drum kits / loops / presets derrière un follow, un email ou un Discord join.

**Esthétique** : éditorial sombre, brutalist-clean, typographie display très serrée (Unbounded), mono pour eyebrows/data, grain subtil sur les matières, bleu électrique `#2B25FF` comme accent.

---

## 1. Stack

- **Framework** : Next.js `16.2.6` (App Router, RSC, `next/font/google`)
- **React** : `19.2.4`
- **Styling** : Tailwind CSS `3.4.17` + `tailwindcss-animate`
- **UI primitives** : shadcn/ui (style `new-york`), Radix primitives
- **Forms** : `react-hook-form` + `zod` + `@hookform/resolvers`
- **Icons** : `lucide-react`
- **Toasts** : `sonner` + `next-themes`
- **Utils** : `clsx`, `tailwind-merge`, `class-variance-authority`

Path aliases : `@/components`, `@/lib`, `@/lib/utils`, `@/components/ui`, `@/hooks`.

---

## 2. Design tokens

### 2.1 Couleurs (HSL/HEX bruts — dark only, `color-scheme: dark`)

| Token             | Valeur     | Rôle                           |
| ----------------- | ---------- | ------------------------------ |
| `--bg`            | `#0A0A0A`  | Background principal           |
| `--bg-deep`       | `#050505`  | Background profond (sections) |
| `--surface-1`     | `#111111`  | Cartes / muted                 |
| `--surface-2`     | `#181818`  | Popovers / accent UI           |
| `--surface-3`     | `#1F1F1F`  | Élévation +1                   |
| `--line`          | `#262626`  | Hairline subtile               |
| `--line-strong`   | `#333333`  | Bordures / inputs              |
| `--text-1`        | `#FAFAFA`  | Texte principal                |
| `--text-2`        | `#9A9A9A`  | Texte secondaire / muted-fg    |
| `--text-3`        | `#5C5C5C`  | Texte tertiaire / hint         |
| `--accent`        | `#2B25FF`  | Bleu Wavloops (primary)        |
| `--accent-ink`    | `#FFFFFF`  | Texte sur accent               |
| `accent-hover`    | `#3D38FF`  | Hover du bleu accent           |
| `--destructive`   | `#FF3B30`  | Erreur / danger                |

**Aliases sémantiques shadcn** (mappés sur les tokens ci-dessus) : `background`, `foreground`, `border`, `input`, `ring`, `muted{.foreground}`, `card{.foreground}`, `popover{.foreground}`, `primary{.foreground}`, `secondary{.foreground}`, `accent_ui{.foreground}`.

### 2.2 Typographie

**Familles** (chargées via `next/font/google` dans `layout.tsx`) :

- **Display** — `Unbounded` (400/500/600/700/800) → `var(--font-display)` → `font-display`
- **Body** — `Hanken Grotesk` (300/400/500/600/700) → `var(--font-body)` → `font-sans` (default)
- **Mono** — `JetBrains Mono` (300/400/500/600) → `var(--font-mono)` → `font-mono`

**Échelle typographique custom** (toutes dispo en classes Tailwind `text-{key}`) :

| Classe                | Size  | Line-height | Letter-spacing |
| --------------------- | ----- | ----------- | -------------- |
| `text-display-hero`   | 138px | 0.82        | -0.05em        |
| `text-display-h2`     | 96px  | 0.85        | -0.045em       |
| `text-display-h3`     | 64px  | 0.85        | -0.045em       |
| `text-display-h4`     | 48px  | 0.9         | -0.03em        |
| `text-display-metric` | 36px  | 1.0         | -0.02em        |
| `text-title`          | 28px  | 1.2         | —              |
| `text-lead`           | 18px  | 1.55        | —              |
| `text-lead-sm`        | 16px  | 1.55        | —              |
| `text-button-lg`      | 15px  | 1.0         | 0.02em         |
| `text-body`           | 14px  | 1.55        | —              |
| `text-button-sm`      | 12px  | 1.0         | —              |
| `text-caption`        | 12px  | 1.5         | —              |
| `text-mono-eyebrow`   | 11px  | 1.6         | 0.18em         |
| `text-mono-caption`   | 10px  | 1.6         | 0.18em         |
| `text-mono-tiny`      | 9px   | 1.6         | 0.18em         |

**Letter-spacing tokens additionnels** : `display-very-tight` (-0.05), `display-tight` (-0.045), `display-normal` (-0.04), `display-loose` (-0.03), `subtitle` (-0.02), `body` (0), `button` (0.02), `mono-data` (0.04), `mono-data-loose` (0.14), `mono-button` (0.16), `mono-eyebrow` (0.18), `mono-registration` (0.2).

### 2.3 Spacing (8-pt scale)

| Token | Valeur |
| ----- | ------ |
| `s-1` | 4px    |
| `s-2` | 8px    |
| `s-3` | 12px   |
| `s-4` | 16px   |
| `s-5` | 24px   |
| `s-6` | 32px   |
| `s-7` | 48px   |
| `s-8` | 64px   |
| `s-9` | 96px   |

Usage : `p-s-5`, `gap-s-3`, `mt-s-8`, etc.

### 2.4 Border radius

| Token | Valeur |
| ----- | ------ |
| `r-0` | 0px    |
| `r-1` | 2px    |
| `r-2` | 4px    |
| `r-3` | 6px    |
| `sm`  | 2px    |
| `md`  | 4px    |
| `lg`  | 6px    |

**Note design** : Wavloops privilégie les angles vifs ou très peu arrondis (max 6px). Pas de `rounded-full` sauf cas exceptionnel (avatars).

### 2.5 Border width

- `border-hairline` → 1px
- `border-strong` → 2px

### 2.6 Motion

- **Easing** : `ease-wav` → `cubic-bezier(.2,.8,.2,1)` (aussi exposé en CSS var `--ease-wav`)
- **Duration** : `duration-wav` → `120ms` (interactions micro)
- **Animations Tailwind dispo** :
  - `animate-accordion-down` / `animate-accordion-up` (Radix accordion)
  - `animate-wave-pulse` : scaleY 1 ↔ 1.15, 1.6s infinite (idéal pour visualiseur audio)

### 2.7 Container

- Centré, padding `1.5rem`, `2xl` breakpoint à `1280px`.

---

## 3. Configs sources

### 3.1 `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

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
        "accent-hover": "#3D38FF",
        destructive: "var(--destructive)",

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
        "display-hero": ["138px", { lineHeight: "0.82", letterSpacing: "-0.05em" }],
        "display-h2": ["96px", { lineHeight: "0.85", letterSpacing: "-0.045em" }],
        "display-h3": ["64px", { lineHeight: "0.85", letterSpacing: "-0.045em" }],
        "display-h4": ["48px", { lineHeight: "0.9", letterSpacing: "-0.03em" }],
        "display-metric": ["36px", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
        title: ["28px", { lineHeight: "1.2" }],
        lead: ["18px", { lineHeight: "1.55" }],
        "lead-sm": ["16px", { lineHeight: "1.55" }],
        "button-lg": ["15px", { lineHeight: "1.0", letterSpacing: "0.02em" }],
        body: ["14px", { lineHeight: "1.55" }],
        "button-sm": ["12px", { lineHeight: "1.0" }],
        caption: ["12px", { lineHeight: "1.5" }],
        "mono-eyebrow": ["11px", { lineHeight: "1.6", letterSpacing: "0.18em" }],
        "mono-caption": ["10px", { lineHeight: "1.6", letterSpacing: "0.18em" }],
        "mono-tiny": ["9px", { lineHeight: "1.6", letterSpacing: "0.18em" }],
      },
      spacing: {
        "s-1": "4px", "s-2": "8px", "s-3": "12px", "s-4": "16px",
        "s-5": "24px", "s-6": "32px", "s-7": "48px", "s-8": "64px", "s-9": "96px",
      },
      borderRadius: {
        "r-0": "0px", "r-1": "2px", "r-2": "4px", "r-3": "6px",
        lg: "6px", md: "4px", sm: "2px",
      },
      borderWidth: { hairline: "1px", strong: "2px" },
      letterSpacing: {
        "display-very-tight": "-0.05em",
        "display-tight": "-0.045em",
        "display-normal": "-0.04em",
        "display-loose": "-0.03em",
        subtitle: "-0.02em",
        body: "0em",
        button: "0.02em",
        "mono-data": "0.04em",
        "mono-data-loose": "0.14em",
        "mono-button": "0.16em",
        "mono-eyebrow": "0.18em",
        "mono-registration": "0.2em",
      },
      transitionTimingFunction: { wav: "cubic-bezier(.2,.8,.2,1)" },
      transitionDuration: { wav: "120ms" },
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
```

### 3.2 `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Surfaces */
    --bg: #0a0a0a;
    --bg-deep: #050505;
    --surface-1: #111111;
    --surface-2: #181818;
    --surface-3: #1f1f1f;
    --line: #262626;
    --line-strong: #333333;

    /* Text */
    --text-1: #fafafa;
    --text-2: #9a9a9a;
    --text-3: #5c5c5c;

    /* Accent */
    --accent: #2b25ff;
    --accent-ink: #ffffff;
    --destructive: #ff3b30;

    /* Motion */
    --ease-wav: cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  html { color-scheme: dark; }

  body {
    background-color: var(--bg);
    color: var(--text-1);
    font-family: var(--font-body), system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background: var(--accent);
    color: var(--accent-ink);
  }
}

@layer components {
  /* Grain overlay — applique sur tout container "matière". 0.06 opacity. */
  .wav-grain { position: relative; isolation: isolate; }
  .wav-grain::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.55;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    background-size: 200px 200px;
    z-index: 1;
  }
  .wav-grain > * { position: relative; z-index: 2; }

  /* Eyebrow utilitaire mono uppercase */
  .wav-eyebrow {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.6;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-2);
  }
}
```

### 3.3 `components.json` (shadcn config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 3.4 `postcss.config.mjs`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 3.5 `app/layout.tsx` (chargement fonts)

```tsx
import type { Metadata } from "next";
import { Unbounded, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wavloops — Gated downloads for producers",
  description:
    "Turn your free kits into a growth engine. Gate your drum kits, loops, and presets behind a follow, email, or Discord join.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${unbounded.variable} ${hanken.variable} ${jetbrains.variable}`}>
      <body className="bg-bg">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 4. Utility helper

### `lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 5. UI Primitives (shadcn — style new-york)

Toutes les primitives vivent dans `components/ui/`. Elles consomment les **alias sémantiques** (`bg-primary`, `text-foreground`, `border-border`, etc.) qui sont mappés sur les tokens Wavloops via `tailwind.config.ts`. Donc changer un token = se répercute partout.

### 5.1 `components/ui/button.tsx`

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 5.2 `components/ui/badge.tsx`

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

### 5.3 `components/ui/card.tsx`

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### 5.4 `components/ui/input.tsx`

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

### 5.5 `components/ui/label.tsx`

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

### 5.6 `components/ui/separator.tsx`

```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

### 5.7 `components/ui/accordion.tsx`

```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

### 5.8 `components/ui/dialog.tsx`

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
}
```

### 5.9 `components/ui/form.tsx`

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller, FormProvider, useFormContext,
  type ControllerProps, type FieldPath, type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = { name: TName }

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ ...props }: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) throw new Error("useFormField should be used within <FormField>")
  if (!itemContext) throw new Error("useFormField should be used within <FormItem>")

  const fieldState = getFieldState(fieldContext.name, formState)
  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = { id: string }
const FormItemContext = React.createContext<FormItemContextValue | null>(null)

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId()
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()
  return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField()
    return <p ref={ref} id={formDescriptionId} className={cn("text-[0.8rem] text-muted-foreground", className)} {...props} />
  }
)
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField()
    const body = error ? String(error?.message ?? "") : children
    if (!body) return null
    return (
      <p ref={ref} id={formMessageId} className={cn("text-[0.8rem] font-medium text-destructive", className)} {...props}>
        {body}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

export {
  useFormField, Form, FormItem, FormLabel, FormControl,
  FormDescription, FormMessage, FormField,
}
```

### 5.10 `components/ui/sonner.tsx`

```tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

---

## 6. Guide d'usage rapide (cheat-sheet pour l'agent)

### Surfaces & élévation

```tsx
<section className="bg-bg">              {/* fond global */}
<section className="bg-bg-deep">         {/* hero, sections sombres */}
<div className="bg-surface-1 border-hairline border-line">  {/* carte */}
<div className="bg-surface-2">           {/* popover / overlay UI */}
```

### Typographie type "Wavloops voice"

```tsx
{/* Eyebrow mono uppercase au-dessus d'un H */}
<span className="wav-eyebrow">// 001 — Manifesto</span>

{/* Display hero (landing) */}
<h1 className="font-display text-display-hero text-text-1">
  Gate your sound.
</h1>

{/* Body */}
<p className="text-lead text-text-2 max-w-prose">…</p>

{/* Data / metric en mono */}
<span className="font-mono text-mono-caption tracking-mono-data-loose text-text-3">
  ⏱ 03:47 · 124 BPM
</span>
```

### Bouton CTA Wavloops standard

```tsx
<Button size="lg" className="font-mono tracking-mono-button uppercase">
  Get early access
</Button>
```

### Grain de matière

Wrap n'importe quel container "physique" pour ajouter le grain :

```tsx
<div className="wav-grain bg-surface-1 border-hairline border-line p-s-7">
  …
</div>
```

### Motion micro-interactions

Toutes les transitions hover/state utilisent `duration-wav ease-wav` :

```tsx
<button className="transition-colors duration-wav ease-wav hover:bg-accent-hover">
```

### Règles d'or visuelles

1. **Toujours dark.** Pas de mode clair prévu.
2. **Pas de gradient** (sauf cas exceptionnel et discret). Couleurs plates uniquement.
3. **Pas de shadow flashy.** Soit `shadow` (subtil shadcn), soit rien. L'élévation se fait par `surface-1/2/3` + `border-hairline`.
4. **Radius max = 6px** (`r-3` / `lg`). Préférer 0/2/4. Jamais `rounded-full` hors avatars.
5. **Accent `#2B25FF` = parcimonie.** CTA principal, focus ring, sélection texte, accents data. Pas de grands aplats.
6. **Hiérarchie texte** : `text-1` (titres + body important) → `text-2` (body secondaire, descriptions) → `text-3` (hints, captions mono, métadonnées).
7. **Mono = data, eyebrows, buttons techniques.** Jamais en body courant.
8. **Display Unbounded** : uniquement pour H1/H2/H3/H4 et metrics. Le reste en Hanken Grotesk.
9. **Spacing** : utilise `s-*` (échelle 4/8) plutôt que les valeurs Tailwind par défaut, pour rester cohérent.
10. **Eyebrows** : préfixer par `// XXX —` ou un numéro de section pour le style éditorial.

---

## 7. Dépendances clés (`package.json` extract)

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "next": "16.2.6",
    "next-themes": "^0.4.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.76.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "autoprefixer": "^10.5.0",
    "postcss": "^8.5.14",
    "tailwindcss": "3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5"
  }
}
```

---

## 8. Arborescence des fichiers DS

```
.
├── app/
│   ├── globals.css          # CSS vars + base layer + .wav-grain / .wav-eyebrow
│   └── layout.tsx           # fonts (Unbounded / Hanken Grotesk / JetBrains Mono)
├── components/
│   └── ui/                  # primitives shadcn (new-york)
│       ├── accordion.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       └── sonner.tsx
├── lib/
│   └── utils.ts             # cn() helper
├── components.json          # shadcn config
├── postcss.config.mjs
└── tailwind.config.ts       # tokens + theme extend
```

---

**Fin du Design System Wavloops.**
Pour l'agent externe : si tu génères du code Wavloops, respecte strictement les tokens et règles d'or de la section 6. N'invente pas de couleurs, n'ajoute pas de gradients, n'arrondis pas au-delà de 6px.
