/**
 * ProducerWall — Section 05 of the Release OS landing
 *
 * The "0% commission, your own store" pitch. Two-column section with
 * marketing copy on the left and a full Producer Wall window mockup on
 * the right.
 *
 * LEFT
 *   - eyebrow `// 005 — producer wall`
 *   - H2: "Your beats. Your store. [Your money.]"  (last span in accent blue)
 *   - 2 paragraphs of body copy
 *   - Highlights list (hairline-separated):
 *       0%   · Commission · "You keep 100% of every sale."
 *       link · Your own link · "Share it anywhere — bio, DMs, socials."
 *       bolt · Instant delivery · "Files sent automatically on purchase."
 *
 * RIGHT — the wall window mockup
 *   - Cover banner (vl-7) with avatar + handle + Follow CTA
 *   - Tabs bar: All beats (active) · Dark R&B · Trap Soul · [search]
 *   - 4 beat rows (Rio Nights is `featured` w/ accent gradient bg):
 *       play · cover · title+meta · waveform (played %) · license pill · price+BUY
 *   - Footer: 🔒 Secure checkout · Powered by Wavloops
 *
 * Layout breakpoints:
 *   - default       : 2-col grid (0.86fr text / 1.14fr visual)
 *   - max-[960px]   : single column, text-then-visual stacked
 *   - max-[560px]   : drop waveform + license pill + search box in rows
 *
 * Assets: vl-7, avatar-40mins, cover-1/2/4/6.
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`.
 */

import { Icon, type IconName } from "./Icon";

/* ================================================================== */
/* DATA                                                                */
/* ================================================================== */

interface Highlight {
  /** Either an accent-blue display number (e.g. "0%") or an icon as figure. */
  figure: { kind: "number"; value: string } | { kind: "icon"; name: IconName };
  title: string;
  description: React.ReactNode;
}

const HIGHLIGHTS: ReadonlyArray<Highlight> = [
  {
    figure: { kind: "number", value: "0%" },
    title: "Commission",
    description: (
      <>
        You keep <b className="font-semibold text-text-1">100%</b> of every
        sale.
      </>
    ),
  },
  {
    figure: { kind: "icon", name: "link" },
    title: "Your own link",
    description: <>Share it anywhere — bio, DMs, socials.</>,
  },
  {
    figure: { kind: "icon", name: "bolt" },
    title: "Instant delivery",
    description: (
      <>
        Files sent <b className="font-semibold text-text-1">automatically</b>{" "}
        on purchase.
      </>
    ),
  },
];

interface WallBeat {
  cover: string;
  title: string;
  meta: string;
  license: string;
  price: string;
  /** Highlight row with accent-gradient bg (only one featured at a time). */
  featured?: boolean;
  /** Played fraction 0..1 — drives how many waveform bars are accent vs grey. */
  played: number;
}

const WALL_BEATS: ReadonlyArray<WallBeat> = [
  {
    cover: "/Photos/release-os/cover-1.jpg",
    title: "Rio Nights",
    meta: "Dark R&B · 88 BPM",
    license: "MP3 + WAV",
    price: "$29",
    featured: true,
    played: 0.42,
  },
  {
    cover: "/Photos/release-os/cover-4.jpg",
    title: "Slow Bleed",
    meta: "Dark R&B · 75 BPM",
    license: "MP3 + WAV",
    price: "$25",
    played: 0,
  },
  {
    cover: "/Photos/release-os/cover-2.jpg",
    title: "Midnight Oil",
    meta: "Trap Soul · 142 BPM",
    license: "Exclusive",
    price: "$120",
    played: 0,
  },
  {
    cover: "/Photos/release-os/cover-6.jpg",
    title: "Loverboy",
    meta: "Dark R&B · 82 BPM",
    license: "MP3 + WAV",
    price: "$29",
    played: 0,
  },
];

const TABS = ["All beats", "Dark R&B", "Trap Soul"] as const;

/** Pure waveform generator — formula from the HTML JS (wwbars), 0.7 / 0.31. */
function makeWallWaveform(n: number, played: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.31));
    return { height: 3 + t * 18, active: i / n < played };
  });
}

/* ================================================================== */
/* SUB-COMPONENTS                                                      */
/* ================================================================== */

function WallBeatRow({ beat }: { beat: WallBeat }) {
  return (
    <div
      className={`flex items-center gap-[14px] rounded-[13px] border px-[13px] py-[11px] transition-[border-color] duration-wav ease-wav hover:border-accent-line ${
        beat.featured ? "border-accent-line" : "border-line bg-surface-1"
      }`}
      style={
        beat.featured
          ? {
              background:
                "linear-gradient(180deg, var(--accent-soft), transparent 80%), var(--surface-1)",
            }
          : undefined
      }
    >
      {/* play button */}
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-bg text-text-1">
        <Icon name="play" size={12} />
      </span>

      {/* cover */}
      <span className="block h-[42px] w-[42px] shrink-0 overflow-hidden rounded-[9px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beat.cover}
          alt=""
          className="h-full w-full object-cover"
        />
      </span>

      {/* title + meta */}
      <div className="flex w-[142px] shrink-0 flex-col gap-[4px] max-[560px]:w-auto max-[560px]:flex-1">
        <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-text-1">
          {beat.title}
        </span>
        <span className="whitespace-nowrap font-mono text-[8.5px] uppercase tracking-[0.06em] text-text-3">
          {beat.meta}
        </span>
      </div>

      {/* waveform (hidden on small) */}
      <div className="flex h-[22px] min-w-0 flex-1 items-center gap-[2px] max-[560px]:hidden">
        {makeWallWaveform(32, beat.played).map((bar, i) => (
          <i
            key={i}
            className={`w-[2.5px] shrink-0 rounded-[2px] ${
              bar.active ? "bg-accent" : "bg-[#3a3a40]"
            }`}
            style={{ height: `${bar.height}px` }}
          />
        ))}
      </div>

      {/* license pill (hidden on small) */}
      <span className="shrink-0 whitespace-nowrap rounded-pill border border-line px-[8px] py-[4px] font-mono text-[8px] uppercase tracking-[0.07em] text-text-3 max-[560px]:hidden">
        {beat.license}
      </span>

      {/* price + BUY */}
      <div className="flex shrink-0 items-center gap-[8px]">
        <span className="font-mono text-[13px] font-medium text-text-1">
          {beat.price}
        </span>
        <button
          type="button"
          className="rounded-pill bg-accent px-[14px] py-[7px] font-mono text-[9px] uppercase tracking-[0.08em] text-white transition-colors duration-wav ease-wav hover:bg-accent-hover"
        >
          Buy
        </button>
      </div>
    </div>
  );
}

function WallWindow() {
  return (
    <div
      className="relative overflow-hidden rounded-[16px] border border-line-strong bg-bg-deep"
      style={{
        boxShadow:
          "0 50px 110px -45px rgba(43,37,255,0.4), 0 30px 70px -30px rgba(0,0,0,0.85)",
      }}
    >
      {/* ====== cover banner ====== */}
      <div className="relative aspect-[24/8] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Photos/release-os/vl-3.jpg"
          alt=""
          className="block h-full w-full object-cover"
          style={{ filter: "saturate(1.05)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,5,7,0.15) 30%, rgba(5,5,7,0.85))",
          }}
        />

        {/* avatar + handle + Follow */}
        <div className="absolute bottom-[15px] left-[20px] right-[20px] z-[2] flex items-end gap-[14px]">
          <span
            className="block h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full"
            style={{ border: "2px solid rgba(255,255,255,0.9)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Photos/release-os/avatar-40mins.jpeg"
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[20px] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
              prod.40mins
            </div>
            <div className="mt-[4px] inline-flex items-center gap-[6px] font-mono text-[9.5px] uppercase tracking-[0.08em] text-white/[0.7]">
              <Icon name="link" size={11} />
              wavloops.com/40mins
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-pill bg-accent px-[16px] py-[8px] font-mono text-[9.5px] uppercase tracking-[0.06em] text-white transition-colors duration-wav ease-wav hover:bg-accent-hover"
          >
            Follow
          </button>
        </div>
      </div>

      {/* ====== tabs bar ====== */}
      <div className="flex items-center gap-[10px] border-b border-line bg-bg-deep px-[16px] py-[12px]">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={`rounded-pill px-[12px] py-[6px] font-mono text-[9.5px] uppercase tracking-[0.1em] ${
              i === 0 ? "bg-surface-2 text-text-1" : "text-text-3"
            }`}
          >
            {tab}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-[8px] rounded-pill border border-line bg-surface-1 px-[14px] py-[6px] text-text-3 max-[560px]:hidden">
          <Icon name="search" size={12} />
          <span className="font-mono text-[9px] uppercase tracking-[0.06em]">
            Search the wall
          </span>
        </span>
      </div>

      {/* ====== beat rows ====== */}
      <div className="flex flex-col gap-[8px] p-[12px]">
        {WALL_BEATS.map((beat) => (
          <WallBeatRow key={beat.title} beat={beat} />
        ))}
      </div>

      {/* ====== footer ====== */}
      <div className="flex items-center gap-[12px] border-t border-line bg-bg-deep px-[18px] py-[13px]">
        <span className="inline-flex items-center gap-[7px] font-mono text-[8.5px] uppercase tracking-[0.08em] text-text-3">
          <Icon name="lock" size={12} className="text-[#3ad17a]" />
          Secure checkout
        </span>
        <span className="ml-auto inline-flex items-center gap-[7px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Photos/wavloops-icon.png"
            alt=""
            className="h-[14px] w-auto"
          />
          <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-text-3">
            Powered by Wavloops
          </span>
        </span>
      </div>
    </div>
  );
}

function HighlightsList() {
  return (
    <div className="mt-[30px] flex flex-col gap-[2px]">
      {HIGHLIGHTS.map((hl, i) => (
        <div
          key={hl.title}
          className={`flex items-center gap-[18px] border-t border-line px-[4px] py-[18px] ${
            i === HIGHLIGHTS.length - 1 ? "border-b border-line" : ""
          }`}
        >
          {/* figure column */}
          <span className="flex w-[78px] shrink-0 items-center">
            {hl.figure.kind === "number" ? (
              <span className="font-display text-[38px] font-bold leading-none tracking-[-0.04em] text-accent">
                {hl.figure.value}
              </span>
            ) : (
              <Icon name={hl.figure.name} size={30} className="text-text-1" />
            )}
          </span>
          {/* text column */}
          <div className="flex min-w-0 flex-col">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-text-1">
              {hl.title}
            </span>
            <span className="mt-[5px] text-[13.5px] leading-[1.45] text-text-2">
              {hl.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* SECTION                                                             */
/* ================================================================== */

export function ProducerWall() {
  return (
    <section
      id="wall"
      className="relative overflow-hidden border-t border-line bg-bg py-[clamp(84px,11vw,132px)]"
    >
      {/* soft bottom-left blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-280px] left-[-200px] z-0 h-[760px] w-[760px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(43,37,255,0.12), transparent 62%)",
        }}
      />

      <div className="relative z-[2] mx-auto grid max-w-[1200px] grid-cols-[0.86fr_1.14fr] items-center gap-[clamp(44px,5vw,80px)] px-5 sm:px-8 max-[960px]:grid-cols-1 max-[960px]:gap-[48px]">
        {/* ===== left text ===== */}
        <div>
          <div className="wv-eyebrow">
            <span className="slash">//</span> 005 — producer wall
          </div>
          {/* Explicit <br/> per line — the HTML's max-w-[13ch] + text-balance
              was wrapping word-by-word inside the 0.86fr column. Forcing
              breaks guarantees the intended 3-line stack at every viewport. */}
          <h2 className="mt-[18px] font-display text-[clamp(30px,4vw,54px)] font-bold uppercase leading-[1.0] tracking-[-0.045em] text-text-1">
            Your beats.
            <br />
            Your store.
            <br />
            <span className="text-accent">Your money.</span>
          </h2>
          <div className="mt-[24px] flex max-w-[48ch] flex-col gap-[15px] max-[960px]:max-w-none">
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17px)] leading-[1.62] text-text-2">
              Every beat you upload lands on your own Producer Wall — a clean
              page where artists can{" "}
              <b className="font-semibold text-text-1">
                listen and buy directly
              </b>{" "}
              from you.
            </p>
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17px)] leading-[1.62] text-text-2">
              No platform taking a cut. No marketplace burying you under 10,000
              other beats. Just your sound, your link, your sales.
            </p>
          </div>

          <HighlightsList />
        </div>

        {/* ===== right wall mockup ===== */}
        <div>
          <WallWindow />
        </div>
      </div>
    </section>
  );
}
