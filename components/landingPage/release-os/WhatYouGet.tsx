/**
 * WhatYouGet — Section 04 of the Release OS landing
 *
 * Three feature blocks stacked vertically, alternating text/visual sides:
 *   01  Auto YouTube              — left text / right visual (publishing queue mockup)
 *   02  Producer Wall   (flipped) — left visual (wall mockup) / right text
 *   03  Smart contact sending     — left text / right visual (matching card)
 *
 * Each feat is a 2-col grid above 860px, single column below. On flip,
 * CSS `order` swaps positions on desktop only; mobile DOM order (text → vis)
 * is preserved for natural reading flow.
 *
 * NOTE — "Gated downloads" chip is intentionally removed from Producer Wall
 * meta. Release OS pivots away from follow-to-unlock; the Wall is a direct-
 * sales store, not a gated download page.
 *
 * Assets: cover-1..6, vl-3, avatar-40mins in /Photos/release-os/.
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`.
 */

import { Icon, type IconName } from "./Icon";

/* ================================================================== */
/* DATA                                                                */
/* ================================================================== */

interface MetaChip {
  icon: IconName;
  label: string;
  /** When true, chip is filled accent-soft (a "primary" meta callout). */
  hl?: boolean;
}

const FEAT_01_META: ReadonlyArray<MetaChip> = [
  { icon: "cal", label: "Scheduled uploads" },
  { icon: "image", label: "Cover + video" },
  { icon: "tag", label: "Title & tags" },
];

// 🚫 Pre-pivot V1 had `{ icon: "lock", label: "Gated downloads" }` here.
// Removed for Release OS — see file header.
const FEAT_02_META: ReadonlyArray<MetaChip> = [
  { icon: "cart", label: "Direct sales", hl: true },
  { icon: "globe", label: "Your own page" },
];

const FEAT_03_META: ReadonlyArray<MetaChip> = [
  { icon: "target", label: "Style & mood match" },
  { icon: "send", label: "Sent on approval" },
];

const YT_SCHED: ReadonlyArray<{
  day: string;
  cover: string;
  title: string;
  meta: string;
  status: { type: "published" | "queued"; label: string };
}> = [
  {
    day: "Mon",
    cover: "/Photos/release-os/cover-2.jpg",
    title: "Midnight Oil",
    meta: "Trap Soul · 142 BPM",
    status: { type: "published", label: "Published" },
  },
  {
    day: "Wed",
    cover: "/Photos/release-os/cover-3.jpg",
    title: "Rio Nights",
    meta: "Dark R&B · 88 BPM",
    status: { type: "queued", label: "Tue 6 PM" },
  },
  {
    day: "Fri",
    cover: "/Photos/release-os/cover-5.jpg",
    title: "Heatwave",
    meta: "Trap Soul · 140 BPM",
    status: { type: "queued", label: "Fri 6 PM" },
  },
];

const WALL_BEATS: ReadonlyArray<{ cover: string; name: string; price: string }> = [
  { cover: "/Photos/release-os/cover-1.jpg", name: "Rio Nights", price: "$29" },
  { cover: "/Photos/release-os/cover-4.jpg", name: "Slow Bleed", price: "$25" },
  { cover: "/Photos/release-os/cover-6.jpg", name: "Loverboy", price: "$29" },
];

const MATCHES: ReadonlyArray<{
  initials: string;
  name: string;
  role: string;
  fit: number;
}> = [
  { initials: "AK", name: "Ari Kova", role: "R&B artist · LA", fit: 94 },
  { initials: "DJ", name: "Dae Jones", role: "Singer · Atlanta", fit: 88 },
  { initials: "NV", name: "Nova V.", role: "Alt-R&B · London", fit: 81 },
];

/* ================================================================== */
/* SHARED — feat card chrome (used by visual 01 and 03)                */
/* ================================================================== */

interface FeatCardHeaderProps {
  icon: IconName;
  title: React.ReactNode;
  pin: string;
}

function FeatCardHeader({ icon, title, pin }: FeatCardHeaderProps) {
  return (
    <div className="flex items-center gap-[10px] border-b border-line bg-bg-deep px-[16px] py-[13px]">
      <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] border border-line-strong text-text-1">
        <Icon name={icon} size={14} />
      </span>
      <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-text-2">
        {title}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-[5px] rounded-pill border border-[rgba(58,209,122,0.3)] bg-[rgba(58,209,122,0.12)] px-[9px] py-[4px] font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#9be7bd]">
        <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-[#3ad17a]" />
        {pin}
      </span>
    </div>
  );
}

const FEAT_CARD_CLASS =
  "relative overflow-hidden rounded-card border border-line-strong bg-surface-1";

const FEAT_CARD_STYLE = { boxShadow: "var(--shadow-pop)" };

/* ================================================================== */
/* VISUAL 01 — YouTube schedule mockup                                 */
/* ================================================================== */

function YouTubeScheduleVisual() {
  return (
    <div className={FEAT_CARD_CLASS} style={FEAT_CARD_STYLE}>
      <FeatCardHeader
        icon="youtube"
        title={
          <>
            Publishing queue ·{" "}
            <b className="font-medium text-text-1">YouTube</b>
          </>
        }
        pin="Auto"
      />
      <div className="p-[16px]">
        <div className="flex flex-col gap-[8px]">
          {YT_SCHED.map((row) => (
            <div
              key={row.day}
              className="flex items-center gap-[13px] rounded-[11px] border border-line bg-bg px-[12px] py-[10px]"
            >
              <span className="w-[54px] shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-text-3">
                {row.day}
              </span>
              <span className="block h-[30px] w-[46px] shrink-0 overflow-hidden rounded-[6px] border border-line-strong">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="truncate text-[12px] font-semibold text-text-1">
                  {row.title}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-text-3">
                  {row.meta}
                </span>
              </div>
              <span
                className={`shrink-0 whitespace-nowrap rounded-pill px-[9px] py-[4px] font-mono text-[8px] uppercase tracking-[0.06em] ${
                  row.status.type === "published"
                    ? "border border-[rgba(58,209,122,0.3)] bg-[rgba(58,209,122,0.12)] text-[#9be7bd]"
                    : "border border-accent-line bg-accent-soft text-[#cfd0ff]"
                }`}
              >
                {row.status.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* VISUAL 02 — Producer Wall mockup (banner + grid + 0% cut bar)       */
/* ================================================================== */

function ProducerWallVisual() {
  /* ============================================================
     ⚠️  HARDCODED "LIQUID GLASS — EDGE-LIT" TEST
     ------------------------------------------------------------
     Reference: iOS 26 / "Clypto" Behance card — the style where the
     EDGES of the card catch light like polished glass, with a subtle
     diagonal streak across the surface. Much clearer than the frosted-
     glass-dome variant — almost no tint, focus is the rim & reflection.
     Built from 3 layers:
       1. Blue-dominant glow behind so the card sits on a graded surface
          (without it, glass on flat dark = invisible).
       2. The card itself: rgba(255,255,255,0.02) — barely tinted — with
          a soft backdrop-blur(10px) for a hint of distortion.
       3. Two child overlays (`absolute inset-0`):
          a. Gradient ring around the border via `mask-composite: exclude`
             — only the outer 1.5px stripe shows the linear-gradient,
             cycling bright→dim→bright to fake light catching the edge.
          b. Diagonal light streak (linear-gradient at 105°, transparent →
             white 14% → transparent) — the "lens reflection" across the
             glass face.
     To revert: swap the wrapper back to `<div className={FEAT_CARD_CLASS} style={FEAT_CARD_STYLE}>`.
     ============================================================ */
  return (
    <div className="relative isolate">
      {/* blue-dominant glow behind — toned down, just enough to give the
          backdrop-filter something subtle to refract */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 25% 20%, rgba(43,37,255,0.18), transparent 70%), radial-gradient(70% 70% at 70% 90%, rgba(15,25,80,0.20), transparent 70%), radial-gradient(40% 40% at 90% 30%, rgba(80,120,255,0.10), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* THE GLASS CARD — barely tinted, edge-lit */}
      <div
        className="relative overflow-hidden rounded-card"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(10px) saturate(140%)",
          WebkitBackdropFilter: "blur(10px) saturate(140%)",
          boxShadow: [
            "0 30px 80px -20px rgba(43,37,255,0.35)",
            "0 10px 40px -10px rgba(0,0,0,0.70)",
          ].join(", "),
        }}
      >
        {/* ── gradient EDGE RING (rim light around the border) ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            borderRadius: "inherit",
            padding: "1.5px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.06) 28%, rgba(255,255,255,0.42) 55%, rgba(255,255,255,0.04) 78%, rgba(255,255,255,0.55) 100%)",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* ── diagonal LIGHT STREAK across the glass surface ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.14) 48%, rgba(255,255,255,0.04) 55%, transparent 68%)",
          }}
        />
        {/* cover banner with avatar overlay */}
        <div className="relative aspect-[21/9] overflow-hidden">
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
                "linear-gradient(180deg, rgba(5,5,7,0.10), rgba(5,5,7,0.78))",
            }}
          />
          <div className="absolute bottom-[13px] left-[16px] z-[2] flex items-center gap-[11px]">
            <span
              className="block h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full"
              style={{ border: "2px solid rgba(255,255,255,0.85)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Photos/release-os/avatar-40mins.jpeg"
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <div className="font-display text-[16px] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
                prod.40mins
              </div>
              <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-white/[0.65]">
                wavloops.com/40mins
              </div>
            </div>
          </div>
        </div>

        {/* beat grid — transparent so the glass shows through */}
        <div className="grid grid-cols-3 gap-[14px] p-[16px]">
          {WALL_BEATS.map((beat) => (
            <div key={beat.name} className="group cursor-pointer">
              <div className="relative mb-[9px] aspect-square overflow-hidden rounded-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={beat.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span
                  className="absolute right-[8px] top-[8px] rounded-pill border border-white/[0.12] px-[9px] py-[4px] font-mono text-[10px] font-medium text-white backdrop-blur-[6px]"
                  style={{ background: "rgba(8,8,10,0.7)" }}
                >
                  {beat.price}
                </span>
              </div>
              <div className="flex items-center justify-between gap-[8px]">
                <span className="truncate text-[12.5px] font-semibold tracking-[-0.01em] text-white">
                  {beat.name}
                </span>
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.06] text-white/[0.75] transition-colors duration-wav ease-wav group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                  <Icon name="cart" size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 0% cut bar — translucent dark for a unified glass feel */}
        <div
          className="flex items-center gap-[10px] px-[16px] py-[11px]"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <span className="font-display text-[22px] font-bold leading-none tracking-[-0.03em] text-white">
            0%
          </span>
          <span className="font-mono text-[8.5px] uppercase leading-[1.4] tracking-[0.1em] text-white/[0.55]">
            platform cut on the Wall.
            <br />
            <b className="text-accent">You keep 100%</b> of direct sales.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* VISUAL 03 — Smart contacts matching                                 */
/* ================================================================== */

function SmartContactsVisual() {
  return (
    <div className={FEAT_CARD_CLASS} style={FEAT_CARD_STYLE}>
      <FeatCardHeader
        icon="target"
        title={
          <>
            Matching · <b className="font-medium text-text-1">Rio Nights</b>
          </>
        }
        pin="3 fits"
      />
      <div className="p-[16px]">
        <div className="flex flex-col gap-[9px]">
          {/* source beat */}
          <div className="flex items-center gap-[12px] rounded-[11px] border border-accent-line bg-accent-soft px-[13px] py-[11px]">
            <span className="block h-[40px] w-[40px] shrink-0 overflow-hidden rounded-[8px] border border-line-strong">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Photos/release-os/cover-1.jpg"
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">
                Rio Nights
              </div>
              <div className="mt-[3px] font-mono text-[8.5px] uppercase tracking-[0.06em] text-[#cfd0ff]">
                Dark R&amp;B · 88 BPM · moody
              </div>
            </div>
          </div>

          {/* "matched to" connector line */}
          <div className="flex items-center gap-[9px] pl-[6px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-text-3">
            <span>matched to</span>
            <span aria-hidden className="h-px flex-1 bg-line-strong" />
            <Icon name="arrowDn" size={13} className="text-accent" />
          </div>

          {/* contacts */}
          {MATCHES.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-[11px] rounded-[11px] border border-line bg-bg px-[13px] py-[9px]"
            >
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 font-mono text-[11px] text-text-2">
                {c.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-text-1">
                  {c.name}
                </div>
                <div className="mt-[2px] font-mono text-[8px] uppercase tracking-[0.06em] text-text-3">
                  {c.role}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-[7px]">
                <span className="relative block h-[4px] w-[42px] overflow-hidden rounded-[4px] bg-surface-2">
                  <i
                    className="absolute inset-y-0 left-0 rounded-[4px] bg-accent"
                    style={{ width: `${c.fit}%` }}
                  />
                </span>
                <span className="w-[30px] text-right font-mono text-[9px] text-text-2">
                  {c.fit}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* FEAT BLOCK — text + visual side-by-side, alternating               */
/* ================================================================== */

interface FeatProps {
  ix: string;
  title: string;
  body: React.ReactNode;
  meta: ReadonlyArray<MetaChip>;
  visual: React.ReactNode;
  /** If true, swap text/visual order on desktop (vis-left / text-right). */
  flip?: boolean;
}

function Feat({ ix, title, body, meta, visual, flip }: FeatProps) {
  return (
    <div className="grid grid-cols-2 items-center gap-[clamp(36px,5vw,84px)] border-t border-line py-[clamp(46px,5vw,68px)] first:border-t-0 max-[860px]:grid-cols-1 max-[860px]:gap-[34px]">
      <div
        className={`max-w-[46ch] max-[860px]:max-w-none ${
          flip ? "max-[860px]:order-1 min-[861px]:order-2" : ""
        }`}
      >
        <div className="flex items-center gap-[9px] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
          <span className="text-accent">//</span>{" "}
          <span className="text-text-2">feature {ix}</span>
        </div>
        <h3 className="m-0 mt-[18px] font-display text-[clamp(24px,2.6vw,38px)] font-bold uppercase leading-[1.02] tracking-[-0.035em] text-text-1">
          {title}
        </h3>
        <p className="m-0 mt-[16px] text-pretty text-[clamp(15px,1.1vw,17px)] leading-[1.62] text-text-2">
          {body}
        </p>
        <div className="mt-[24px] flex flex-wrap gap-[9px]">
          {meta.map((chip) => (
            <span
              key={chip.label}
              className={`inline-flex items-center gap-[6px] rounded-pill px-[12px] py-[6px] font-mono text-[9px] uppercase tracking-[0.08em] ${
                chip.hl
                  ? "border border-accent-line bg-accent-soft text-[#cfd0ff]"
                  : "border border-line-strong text-text-2"
              }`}
            >
              <Icon name={chip.icon} size={12} className="text-accent" />
              {chip.label}
            </span>
          ))}
        </div>
      </div>
      <div className={flip ? "max-[860px]:order-2 min-[861px]:order-1" : ""}>
        {visual}
      </div>
    </div>
  );
}

/* ================================================================== */
/* SECTION                                                             */
/* ================================================================== */

export function WhatYouGet() {
  return (
    <section
      id="what-you-get"
      className="relative overflow-hidden border-t border-line bg-bg-deep py-[clamp(84px,11vw,132px)]"
    >
      <div className="relative z-[2] mx-auto max-w-[1200px] px-5 sm:px-8">
        <header className="mb-[clamp(52px,6vw,80px)] max-w-[880px]">
          <div className="wv-eyebrow">
            <span className="slash">//</span> 004 — what you get
          </div>
          <h2 className="mt-[18px] max-w-[18ch] text-balance font-display text-[clamp(32px,4.6vw,62px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1">
            Everything that turns a beat into a release.
          </h2>
        </header>

        <div>
          <Feat
            ix="01"
            title="Auto YouTube"
            body={
              <>
                Your beats posted on a schedule, with covers, titles, tags and
                video done for you. Stay{" "}
                <span className="wv-kw font-semibold">consistent</span> without
                lifting a finger.
              </>
            }
            meta={FEAT_01_META}
            visual={<YouTubeScheduleVisual />}
          />
          <Feat
            flip
            ix="02"
            title="Producer Wall"
            body={
              <>
                Your own page to sell your beats directly.{" "}
                <b className="font-semibold text-text-1">
                  No middleman, no platform cut.
                </b>{" "}
                100% yours.
              </>
            }
            meta={FEAT_02_META}
            visual={<ProducerWallVisual />}
          />
          <Feat
            ix="03"
            title="Smart contact sending"
            body={
              <>
                Your beats reach the right artists automatically —{" "}
                <b className="font-semibold text-text-1">
                  matched by style and mood
                </b>
                , sent on your approval.
              </>
            }
            meta={FEAT_03_META}
            visual={<SmartContactsVisual />}
          />
        </div>
      </div>
    </section>
  );
}
