# Wavloops Design System — Canva Cheatsheet

Everything you need to design on-brand in Canva.
Paste hex codes into the Canva color picker, install the 3 Google Fonts once, and you're done.

---

## 1. Colors

### Primary

| Role | Hex | Use for |
|---|---|---|
| Bg 0 — canvas | `#0c0c0e` | Main background of every dark asset |
| Bg 1 — surface | `#16161a` | Cards, containers, elevated blocks |
| Bg 2 — card | `#101013` | Nested cards inside a container |
| Bg 3 — hover | `#1c1c22` | Hover states, subtle elevation |

### Accent (the ONE color)

| Role | Hex | Use for |
|---|---|---|
| Accent | `#2b25ff` | Buttons, highlighted words, key links |
| Accent surface | `rgba(43,37,255,0.14)` | Subtle backgrounds behind accent text |
| Accent glow | `rgba(43,37,255,0.35)` | Halo behind CTA buttons |

**Rule** — use `#2b25ff` on **at most one word or one element per composition**. It's the punch. Overuse kills it.

### Text

| Role | Hex | Use for |
|---|---|---|
| fg 1 — primary | `#ffffff` | Main text on dark backgrounds |
| fg 2 — secondary | `#c5c5cc` | Sub-headings, meta info |
| fg 3 — muted | `#8e8e98` | Captions, hints |
| fg 4 — subtle | `#6e6e78` | Small mono tags, timestamps |

### Semantic (use sparingly)

| Role | Hex | Use for |
|---|---|---|
| Danger red | `#ff3b30` | Strikethroughs, "STOP" moments, warnings |
| Success green | `#10b981` | Confirmations, approved states |
| Amber warning | `#f59e0b` | Attention, pending state |

### Light mode variants (for social where dark won't cut through)

| Role | Hex |
|---|---|
| Light bg | `#f5f5f7` |
| Light surface | `#ffffff` |
| Light text | `#0c0c0e` |
| Light muted | `#5e5e6a` |

---

## 2. Typography

Install these 3 fonts once in Canva (Text → Fonts → search + add to Brand Kit):

### Display — Unbounded
- Google Fonts URL: https://fonts.google.com/specimen/Unbounded
- Weights to add: **700** and **800**
- Use for: headlines, big statements, key numbers
- Letter-spacing: always tight (`-0.02em` in CSS, in Canva slide the letter-spacing slider LEFT ~2 clicks)

### Body — Hanken Grotesk
- Google Fonts URL: https://fonts.google.com/specimen/Hanken+Grotesk
- Weights to add: **500** and **600**
- Use for: descriptions, subtitles, longer copy
- Letter-spacing: default

### Mono caps — JetBrains Mono
- Google Fonts URL: https://fonts.google.com/specimen/JetBrains+Mono
- Weight to add: **500**
- Use for: uppercase labels, timestamps, technical tags
- Letter-spacing: WIDE (~0.15em in CSS, slide RIGHT ~3 clicks in Canva)
- Always ALL CAPS when using this font

### Size scale by format

| Format | Headline (Unbounded 800) | Body (Hanken 500) | Tag (JBM caps) |
|---|---|---|---|
| **IG feed 1:1** (1080×1080) | 78-90px | 22px | 15px |
| **IG feed 4:5** (1080×1350) | 68-80px | 20px | 14px |
| **IG story / Reel 9:16** (1080×1920) | 100-140px | 26px | 18px |
| **X post image 16:9** (1600×900) | 60px | 20px | 14px |
| **LinkedIn 1.91:1** (1200×627) | 54px | 18px | 12px |

---

## 3. Composition rules

### The 4 always-present elements

Every branded asset must have these in this order:

1. **wavloops wordmark** — top-left corner, ~28px, Unbounded 700 lowercase, white
2. **The headline** — center or top-left, Unbounded 800, max 2 lines
3. **The subject-matter** — either a product mockup or a supporting quote
4. **WAVLOOPS.CO tag** — bottom center, JetBrains Mono 15px caps, muted gray

### The visual grammar

- **Dark background** — always. Use `#0c0c0e` with a subtle radial gradient glow at 25%/15% position (`rgba(43,37,255,0.14)` fading to transparent at 55%).
- **The strike** — when saying "stop / no / don't", cross out the negation word with a red bar (#ff3b30, 8px thick, -4deg rotation).
- **The underline** — when highlighting a positive keyword, underline it in accent blue (#2b25ff, 8px thick, 12px offset below).
- **Whitespace is oxygen** — leave at least 40-60px padding on all sides of a 1080px poster.

### The device mockup pattern

When showing the product:

- Wrap the screenshot in a **browser frame**: 42px chrome bar, 3 macOS dots (`#ff5f57` / `#ffbd2e` / `#28c93f`), centered URL in JetBrains Mono `#6e6e78`
- Frame background: `#101013`, border `1px solid rgba(255,255,255,0.08)`, border-radius: 20px
- Add a strong drop shadow: `0 40px 80px -20px rgba(0,0,0,0.7)`

---

## 4. Ready-to-use templates

### 1:1 feed post (1080×1080)

```
┌──────────────────────────────────────┐
│ wavloops                             │  ← top-left, y=44, Unbounded 700, 28px
│                                      │
│                                      │
│ STOP sending beats.                  │  ← Unbounded 800, 78px, y=130
│ Start sharing one link.              │     "STOP" struck red, "one link" blue underline
│                                      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ● ● ● wavloops.co/dashboard    │  │  ← browser mockup, y=670, h=420
│  ├────────────────────────────────┤  │
│  │                                │  │
│  │      [ APP SCREENSHOT ]        │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│           WAVLOOPS.CO                │  ← bottom center, y=1040, JBM caps 15px
└──────────────────────────────────────┘
```

### 4:5 feed portrait (1080×1350)

Same as 1:1 but the mockup section goes taller (~600px). More vertical breathing room for the headline. Ideal for longer taglines that need 3 lines.

### 9:16 story / reel (1080×1920)

- Headline goes MUCH bigger (100-140px Unbounded 800), takes top 40%
- Product mockup takes middle 40%
- "Swipe up" style CTA at bottom 15%
- Add motion cues (a small arrow, a hand icon) at the very bottom

### Carousel slide (1080×1350, 3-5 slides)

- **Slide 1** — hook (big statement, no mockup): "Your beats deserve better than a dead WeTransfer link."
- **Slide 2** — the problem (dark bg, red accents): "Right now: 47 unopened files in an artist's inbox."
- **Slide 3** — the shift (accent color explosion): "One link. Every artist. Full tracking."
- **Slide 4** — the product (device mockup fills the slide)
- **Slide 5** — CTA: "wavloops.co · start free"

---

## 5. Voice & tone

### Do

- **Sentence case** for headlines and buttons ("Start your first server", not "Start Your First Server")
- **Contractions** ("can't", "won't", "you'll")
- **Verbs first** ("Ship your beat", not "Beat shipping")
- **Concrete producer language** ("placement", "beat pack", "artist DM", "waveform")
- **The producer speaks** ("Your artists", never "our artists")

### Don't

- **ALL CAPS** except for the JBM mono tags (they're always caps by convention)
- **Emoji** in headlines (rare exception: one strategic 🎧 or 🇫🇷 in flavor lines)
- **Corporate filler** — no "leverage", "seamless", "unlock", "empower", "streamline"
- **Exclamation marks** on every sentence — save the ! for the ONE punchline
- **Marketing-speak clichés** — no "revolutionize", "next-gen", "the future of..."

### The Wavloops sentence pattern

Most on-brand headlines follow one of these 4 patterns:

1. **STOP / START** — "Stop sending beats. Start sharing one link."
2. **From / To** — "From beat drop to placement — in one link."
3. **Every / No** — "Every beat you send. Zero contacts lost."
4. **One / Many** — "One link for your beats. One dashboard for your artists."

---

## 6. What NOT to do

Common brand traps to avoid:

- ❌ **Gradients everywhere** — use ONE radial glow max, always subtle
- ❌ **Multiple accent colors** — Wavloops is monochromatic dark + ONE blue. Not two, not three.
- ❌ **Stock photos of hip-hop / studios** — feels generic. Use real product screenshots or clean typography.
- ❌ **Rounded corner overload** — cards use 12-20px radius. Buttons use pill (999px). Nothing else gets rounded.
- ❌ **Drop shadows on text** — never. Text stays flat.
- ❌ **Google Sans / Roboto** — always Unbounded / Hanken / JBM.
- ❌ **Filling with icons** — one icon max per composition, only when it clarifies (not decoration).

---

## 7. Ready-to-copy color swatches for Canva Brand Kit

Paste this block into your Canva Brand Kit → Colors:

```
Bg 0        #0c0c0e
Bg 1        #16161a
Bg 2        #101013
Accent      #2b25ff
White       #ffffff
Muted 3     #8e8e98
Muted 4     #6e6e78
Danger red  #ff3b30
Success     #10b981
```

---

## 8. Where these tokens live in code (for reference)

- **Full CSS variables:** `app/globals.css` in the repo
- **Landing components using them:** `components/landing/*`
- **Email template using them:** `lib/resend/emails.ts` (`brandShell()`)
- **The typographic voice on Instagram post 1** — see `app/marketing/ig-post-stop-sending-beats/page.tsx`

Any brand update should start in `app/globals.css` (CSS custom properties) and cascade from there — the Canva assets are the outbound copy of what already lives in the code.
