# Wavloops — Design System

> Drop-in design system for **Wavloops** (gated downloads / sales pages for music producers).
> Dark-only, editorial, brutalist-clean, premium-rounded. One accent: electric blue `#2B25FF`.
>
> **For Cursor:** keep this file in your repo (e.g. `docs/wavloops-design-system.md` or as a
> `.cursor/rules/*.mdc`) so the agent has the full system in context. Link `colors_and_type.css`
> once and build with the `var(--*)` tokens and `.wv-*` helper classes below.

---

## 1. Setup

```html
<!-- tokens + fonts + helper classes (single source of truth) -->
<link rel="stylesheet" href="colors_and_type.css" />
```

`colors_and_type.css` imports the three brand fonts from Google Fonts and declares every token
on `:root`. For production, self-host the `.woff2` files in `/fonts/` and replace the `@import`.

If you use Tailwind, map the tokens in `theme.extend` (colors → CSS vars, fontFamily → the three
families, borderRadius → the radii scale). Do **not** invent new colors or radii — extend from these.

---

## 2. Foundations (the non-negotiables)

| Rule | Detail |
| --- | --- |
| **Dark only** | `color-scheme: dark`. Page bg `--bg #0A0A0A`. No light mode. |
| **One accent** | Electric blue `--accent #2B25FF`, hover `#4A45FF`. Use with restraint — primary CTA, focus, active waveform, selection, one full-bleed blue "manifesto" block. Never decorative. |
| **Display = Unbounded** | H1–H4, metrics, wordmark only. Very tight tracking (`-0.045 to -0.05em`). Never below H4. |
| **Body = Hanken Grotesk** | All UI + running copy. |
| **Mono = JetBrains Mono** | Eyebrows, data strings, labels, captions. UPPERCASE, wide tracking (`.08–.20em`). Never in running body. |
| **Premium-rounded** | Interactive elements are **pills** (`--r-pill` 999px). Cards `--r-card` 16px, covers `--r-cover` 12px, inputs/thumbs `--r-sm` 10px. Circles only for play buttons + avatars. |
| **Borders not boxes** | Hairlines (`1px --line`) define structure — row separators, spec bars, section rules. Inputs/chips use `--line-strong`. |
| **Elevation is tonal** | Lift via surface tiers (`--surface-1 → --surface-3`), not shadows. Real shadow reserved for floating overlays + the blue glow on primary hover. |
| **No** | No gradients (except the one blue block + a faint hero glow), no stock photos, no illustration, no emoji. |
| **Grain** | Subtle 6% film-grain overlay (`.wv-grain`) on material surfaces + the blue block only. |
| **Motion** | `--ease cubic-bezier(.2,.8,.2,1)` ("ease-wav"), `--dur 120ms`. Hover lifts buttons `-1px`+glow, press scales `.98`, cards lift `-3/-4px`. No bounce, no spring. |

---

## 3. Color tokens

```
--bg            #0A0A0A   page background
--bg-deep       #050505   deepest sections
--surface-1     #131314   cards / panels
--surface-2     #1A1A1C   popovers / hover fills
--surface-3     #242427   elevation +1 / tracks
--line          #222224   hairline
--line-strong   #323235   borders, inputs, chips

--text-1        #F7F7F5   primary
--text-2        #9A9A97   secondary / muted
--text-3        #5A5A58   tertiary / hints, mono captions

--accent        #2B25FF   electric blue
--accent-hover  #4A45FF
--accent-soft   rgba(64,58,255,.16)   washes, active chips
--accent-line   rgba(96,90,255,.40)   active borders
--danger        #FF453A
```

---

## 4. Type scale

Display + metrics use **Unbounded**; body uses **Hanken Grotesk**; eyebrows/data/labels use **JetBrains Mono**.

```
--display-hero    96px / .92 / -.05em
--display-h2      64px / .95 / -.045em
--display-h3      34px / 1.0 / -.04em
--display-metric  26px / 1.0 / -.03em
--title           20px / 1.2
--lead            18px / 1.55   (color: --text-2)
--body            14px / 1.55
--caption         12px / 1.5
--mono-eyebrow    11px  tracking .20em  UPPERCASE
--mono-data       10px  tracking .08em  UPPERCASE
--mono-tiny       9.5px tracking .12em  UPPERCASE
```

Helper classes: `.wv-display-hero` `.wv-display-h2` `.wv-display-h3` `.wv-metric` `.wv-title`
`.wv-lead` `.wv-body` `.wv-caption` `.wv-eyebrow` `.wv-data`.

---

## 5. Signature patterns

**Eyebrow** — the brand's loudest tell. Prefix a label with `//` (accent blue) and a zero-padded
section number, set in mono uppercase, directly above a big Unbounded headline.

```html
<div class="wv-eyebrow"><span class="slash">//</span> 002 — The model</div>
<h2 class="wv-display-h2">Free, but on your terms.</h2>
```

**Data string** — mono, uppercase, dot-separated. Real numbers, typeset large where they're stats.

```html
<span class="wv-data">124 BPM · B MINOR · WAV · STEMS</span>
```

**Numbers as display** — `<span class="wv-metric">12,480</span>` with a small mono unit beside it.

**Typographic marks** — `·  //  ™  →  °  ′` are part of the voice (e.g. registration marks like
`N 38°43′ / SYSTEM 001` add editorial texture). **Never emoji.**

---

## 6. Components

### Buttons (pills)
```html
<button class="wv-btn wv-btn-primary">Start free</button>
<button class="wv-btn wv-btn-ghost">View all</button>
<button class="wv-btn wv-btn-primary wv-btn-sm">Buy license</button>
```
- `wv-btn-primary` — accent fill, white ink; hover lifts `-1px` + blue glow.
- `wv-btn-ghost` — transparent, `--line-strong` border; hover fills `--surface-2`.
- `wv-btn-sm` — compact padding.

### Tags / chips (pills)
```html
<span class="wv-tag">WAV · STEMS</span>
<span class="wv-tag wv-tag-accent">Active</span>
```

### Card
```html
<article style="background:var(--surface-1); border:1px solid var(--line);
  border-radius:var(--r-card); overflow:hidden;">
  <!-- cover art (radius --r-cover) fills the top -->
  <!-- mono meta + title below -->
</article>
```
`--surface-1` fill, `1px --line`, no drop shadow. Hover = border brightens + lift `-3/-4px`.

### Play indicators & waveforms
- Play = filled triangle. Active state = filled circle (white on dark, or accent-blue with glow).
- Waveform = bar array. Neutral bars `--line-strong`; played/active portion `--accent`.

### Floating chrome (glass)
Sticky top bar + player only: `background:rgba(8–10,8–10,8–10,.85)` + `backdrop-filter:blur(18–20px)`.
Inline content stays solid.

---

## 7. Iconography

The brand ships its **own icon set** — `wavloops-icons.js` — drawn in the Wavloops style:
geometric, editorial, 24px grid, **1.7px** stroke, round caps/joins, `currentColor` (so icons
inherit text color and the accent on active states). ~55 icons covering nav, playback,
audio/metadata, commerce, workflow, people/social, platform marks, and the brand glyph.

```html
<!-- load once -->
<script src="wavloops-icons.js"></script>

<!-- inline attribute (auto-hydrates on load) -->
<span data-wv-icon="upload"></span>
<span data-wv-icon="play" data-size="32" data-stroke="2"></span>

<!-- web component -->
<wv-icon name="cart" size="20"></wv-icon>
```
```js
// programmatic — returns an SVG string
el.innerHTML = WavloopsIcons.svg('youtube', { size: 18 });
WavloopsIcons.names();   // list every icon name
```

Open `Wavloops Icons.html` for the full searchable grid (click any icon to copy its name).

**Naming (groups):** nav — `upload library visual-library producer-wall queue calendar settings home search bell grid` · playback — `play pause skip-back skip-forward shuffle repeat volume` · audio — `waveform bpm key mood file-audio file-wave file-stems zip download cover` · commerce — `cart price-tag link lock unlock store wallet` · status — `check check-circle x plus minus chevron-right chevron-down arrow-right arrow-up-right bolt spark target clock send` · people — `user user-add heart eye more edit share filter` · platforms — `youtube soundcloud discord instagram email` · brand — `wavloops-mark`.

Conventions: **`bolt`** = "automatic", **`spark`** = AI/auto-prepared, **`target`** = matching,
filled triangle `play`, half-filled disc `mood`, heartbeat `bpm`. If you build in React, you can
keep using `lucide-react` for generic glyphs — but prefer the Wavloops set for anything brand-facing.

---

## 8. Voice & copy

- **Tone:** confident, technical, editorial. Short declaratives. Producer-native, never corporate.
  ("Gate your sound." "Free, but on your terms.")
- **Person:** "you/your" for product copy; "we" only for brand/trust lines.
- **Casing:** sentence case for headlines + buttons. UPPERCASE + wide tracking for eyebrows, data,
  labels (mono only) — never for running copy.

---

## 9. Files in this export

| File | What it is |
| --- | --- |
| `colors_and_type.css` | All tokens + `.wv-*` helper classes. Link this. The single source of truth. |
| `wavloops-icons.js` | The brand icon set (~55 icons). Load once; use `data-wv-icon`, `<wv-icon>`, or `WavloopsIcons.svg()`. |
| `wavloops-design-system.md` | This document. Keep it in-repo as agent context / Cursor rules. |
| `Wavloops Design System.html` | The system shown in context. Open in a browser as the canonical visual reference. |
| `Wavloops Icons.html` | Searchable icon grid — click any icon to copy its name. |
