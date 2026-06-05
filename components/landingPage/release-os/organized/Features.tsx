/**
 * Features — Section 05 of the /organized variant landing.
 *
 * Four alternating feature blocks (text/visual). Same pattern as the root
 * landing's WhatYouGet — flip controls desktop side-swap, mobile stays
 * stacked text-then-visual:
 *
 *   01  Artist database          — sortable rows, filter chips
 *   02  Beat library (flipped)   — key/BPM/mood/genre tags
 *   03  Beat-to-artist matching  — source beat → matched contacts w/ fit%
 *   04  Send tracking (flipped)  — chronological send log w/ reply statuses
 */

import { Icon, type IconName } from "../Icon";

/* ============ shared card chrome ============ */

const FEAT_CARD_CLASS =
  "relative overflow-hidden rounded-card border border-line-strong bg-surface-1";
const FEAT_CARD_STYLE = { boxShadow: "var(--shadow-pop)" };

function FeatCardHeader({
  icon,
  title,
  pin,
}: {
  icon: IconName;
  title: React.ReactNode;
  pin: string;
}) {
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

/* ============ visual 01 — artist database ============ */

function DatabaseVisual() {
  const FILTERS = ["All", "R&B", "Trap", "L.A.", "Replied"];
  const ROWS: ReadonlyArray<{
    initials: string;
    name: string;
    meta: string;
    fit: number;
  }> = [
    { initials: "AK", name: "Ari Kova", meta: "R&B · LA · 124K", fit: 94 },
    { initials: "DJ", name: "Dae Jones", meta: "Singer · ATL · 86K", fit: 88 },
    { initials: "MC", name: "Marcus Cole", meta: "Trap · NYC · 198K", fit: 81 },
  ];

  return (
    <div className={FEAT_CARD_CLASS} style={FEAT_CARD_STYLE}>
      <FeatCardHeader
        icon="send"
        title={
          <>
            Contacts ·{" "}
            <b className="font-medium text-text-1">312 sorted</b>
          </>
        }
        pin="Live"
      />
      <div className="p-[16px]">
        {/* filters */}
        <div className="mb-[12px] flex flex-wrap gap-[5px]">
          {FILTERS.map((f, i) => (
            <span
              key={f}
              className={`inline-flex items-center rounded-pill px-[9px] py-[3px] font-mono text-[8.5px] uppercase tracking-[0.1em] ${
                i === 0
                  ? "border border-accent-line bg-accent-soft text-[#cfd0ff]"
                  : "border border-line-strong text-text-2"
              }`}
            >
              {f}
            </span>
          ))}
        </div>
        {/* rows */}
        <div className="flex flex-col gap-[7px]">
          {ROWS.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-[11px] rounded-[10px] border border-line bg-bg px-[11px] py-[9px]"
            >
              <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 font-mono text-[10px] text-text-2">
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-text-1">
                  {r.name}
                </div>
                <div className="truncate font-mono text-[8px] uppercase tracking-[0.05em] text-text-3">
                  {r.meta}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-[6px]">
                <span className="relative block h-[3px] w-[34px] overflow-hidden rounded-[3px] bg-surface-2">
                  <i
                    className="absolute inset-y-0 left-0 rounded-[3px] bg-accent"
                    style={{ width: `${r.fit}%` }}
                  />
                </span>
                <span className="w-[24px] text-right font-mono text-[8.5px] text-text-2">
                  {r.fit}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ visual 02 — beat library ============ */

function BeatLibraryVisual() {
  const BEATS: ReadonlyArray<{
    cover: string;
    title: string;
    tags: ReadonlyArray<string>;
  }> = [
    {
      cover: "/Photos/release-os/cover-1.jpg",
      title: "Rio Nights",
      tags: ["R&B", "88 BPM", "Gm", "moody"],
    },
    {
      cover: "/Photos/release-os/cover-2.jpg",
      title: "Midnight Oil",
      tags: ["Trap Soul", "142 BPM", "Am", "dark"],
    },
    {
      cover: "/Photos/release-os/cover-4.jpg",
      title: "Slow Bleed",
      tags: ["R&B", "75 BPM", "Dm", "intimate"],
    },
  ];

  return (
    <div className={FEAT_CARD_CLASS} style={FEAT_CARD_STYLE}>
      <FeatCardHeader
        icon="library"
        title={
          <>
            Beat library ·{" "}
            <b className="font-medium text-text-1">tagged</b>
          </>
        }
        pin="Auto"
      />
      <div className="p-[16px]">
        <div className="flex flex-col gap-[8px]">
          {BEATS.map((b) => (
            <div
              key={b.title}
              className="flex items-center gap-[12px] rounded-[11px] border border-line bg-bg px-[11px] py-[10px]"
            >
              <span className="block h-[40px] w-[40px] shrink-0 overflow-hidden rounded-[8px] border border-line-strong">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-text-1">
                  {b.title}
                </div>
                <div className="mt-[3px] flex flex-wrap gap-[4px]">
                  {b.tags.map((t, i) => (
                    <span
                      key={t}
                      className={`inline-flex items-center rounded-pill px-[6px] py-[1px] font-mono text-[7.5px] uppercase tracking-[0.1em] ${
                        i === 0
                          ? "border border-accent-line bg-accent-soft text-[#cfd0ff]"
                          : "border border-line text-text-3"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ visual 03 — matching ============ */

function MatchingVisual() {
  const MATCHES: ReadonlyArray<{ initials: string; name: string; role: string; fit: number }> =
    [
      { initials: "AK", name: "Ari Kova", role: "R&B · LA", fit: 94 },
      { initials: "DJ", name: "Dae Jones", role: "Singer · ATL", fit: 88 },
      { initials: "NV", name: "Nova V.", role: "Alt-R&B · LDN", fit: 81 },
    ];

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
              <div className="text-[13px] font-semibold text-white">Rio Nights</div>
              <div className="mt-[3px] font-mono text-[8.5px] uppercase tracking-[0.06em] text-[#cfd0ff]">
                Dark R&amp;B · 88 BPM · moody
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[9px] pl-[6px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-text-3">
            <span>matched to</span>
            <span aria-hidden className="h-px flex-1 bg-line-strong" />
            <Icon name="arrowDn" size={13} className="text-accent" />
          </div>
          {MATCHES.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-[11px] rounded-[11px] border border-line bg-bg px-[13px] py-[9px]"
            >
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 font-mono text-[11px] text-text-2">
                {c.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-text-1">{c.name}</div>
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

/* ============ visual 04 — send tracking ============ */

function TrackingVisual() {
  const SENT: ReadonlyArray<{
    cover: string;
    beat: string;
    name: string;
    when: string;
    status: "replied" | "sent" | "pending";
    statusLabel: string;
  }> = [
    {
      cover: "/Photos/release-os/cover-1.jpg",
      beat: "Rio Nights",
      name: "Ari Kova",
      when: "2h ago",
      status: "replied",
      statusLabel: "Replied",
    },
    {
      cover: "/Photos/release-os/cover-2.jpg",
      beat: "Midnight Oil",
      name: "Dae Jones",
      when: "1d ago",
      status: "sent",
      statusLabel: "Sent",
    },
    {
      cover: "/Photos/release-os/cover-4.jpg",
      beat: "Slow Bleed",
      name: "Nova V.",
      when: "3d ago",
      status: "pending",
      statusLabel: "Pending",
    },
  ];

  const TINT: Record<typeof SENT[number]["status"], string> = {
    replied:
      "border-[rgba(58,209,122,0.30)] bg-[rgba(58,209,122,0.12)] text-[#9be7bd]",
    sent: "border-accent-line bg-accent-soft text-[#cfd0ff]",
    pending: "border-line-strong text-text-2",
  };

  return (
    <div className={FEAT_CARD_CLASS} style={FEAT_CARD_STYLE}>
      <FeatCardHeader
        icon="cal"
        title={
          <>
            Send log · <b className="font-medium text-text-1">tracked</b>
          </>
        }
        pin="Auto"
      />
      <div className="p-[16px]">
        <div className="flex flex-col gap-[8px]">
          {SENT.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-[12px] rounded-[11px] border border-line bg-bg px-[11px] py-[9px]"
            >
              <span className="block h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[7px] border border-line-strong">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-text-1">
                  {row.beat}{" "}
                  <span className="font-normal text-text-3">→ {row.name}</span>
                </div>
                <div className="truncate font-mono text-[8px] uppercase tracking-[0.05em] text-text-3">
                  {row.when}
                </div>
              </div>
              <span
                className={`shrink-0 whitespace-nowrap rounded-pill border px-[9px] py-[4px] font-mono text-[8.5px] uppercase tracking-[0.07em] ${TINT[row.status]}`}
              >
                {row.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ feat block ============ */

interface MetaChip {
  icon: IconName;
  label: string;
  hl?: boolean;
}

interface FeatProps {
  ix: string;
  title: string;
  body: React.ReactNode;
  meta: ReadonlyArray<MetaChip>;
  visual: React.ReactNode;
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

/* ============ section ============ */

export function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-t border-line bg-bg-deep py-[clamp(84px,11vw,132px)]"
    >
      <div className="relative z-[2] mx-auto max-w-[1200px] px-5 sm:px-8">
        <header className="mb-[clamp(52px,6vw,80px)] max-w-[880px]">
          <div className="wv-eyebrow">
            <span className="slash">//</span> 005 — what you get
          </div>
          <h2 className="mt-[18px] max-w-[18ch] text-balance font-display text-[clamp(32px,4.6vw,62px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1">
            Your music career, in one screen.
          </h2>
        </header>

        <div>
          <Feat
            ix="01"
            title="Artist database"
            body={
              <>
                Every contact in one place. Sortable by{" "}
                <b className="font-semibold text-text-1">
                  genre, location, status, fit
                </b>{" "}
                — and searchable in two keystrokes.
              </>
            }
            meta={[
              { icon: "send", label: "Sortable rows", hl: true },
              { icon: "globe", label: "By location" },
              { icon: "tag", label: "Filterable" },
            ]}
            visual={<DatabaseVisual />}
          />
          <Feat
            flip
            ix="02"
            title="Beat library"
            body={
              <>
                Every beat tagged with{" "}
                <b className="font-semibold text-text-1">
                  key, BPM, mood, genre
                </b>{" "}
                — so the right one surfaces when the right artist needs it.
              </>
            }
            meta={[
              { icon: "library", label: "Key + BPM" },
              { icon: "tag", label: "Mood tags" },
              { icon: "image", label: "Cover preview" },
            ]}
            visual={<BeatLibraryVisual />}
          />
          <Feat
            ix="03"
            title="Beat-to-artist matching"
            body={
              <>
                Pick a beat, get the{" "}
                <b className="font-semibold text-text-1">
                  top 5 artists it fits
                </b>{" "}
                — scored by mood, genre and reach. No more guessing.
              </>
            }
            meta={[
              { icon: "target", label: "Fit score", hl: true },
              { icon: "bolt", label: "Style + mood" },
            ]}
            visual={<MatchingVisual />}
          />
          <Feat
            flip
            ix="04"
            title="Send tracking"
            body={
              <>
                Every reach-out logged.{" "}
                <b className="font-semibold text-text-1">
                  Who got what, when, who replied
                </b>{" "}
                — the trail never goes cold again.
              </>
            }
            meta={[
              { icon: "cal", label: "Chronological log" },
              { icon: "check", label: "Reply status" },
            ]}
            visual={<TrackingVisual />}
          />
        </div>
      </div>
    </section>
  );
}
