/**
 * HeroAppMockup — the app screenshot sitting below the Hero copy.
 *
 * A faux browser window framing a 3-column Wavloops Publish dashboard:
 *   - left sidebar with Upload button + 5 nav items (Library highlighted)
 *   - main column with "Recent tracks" + 3 track rows (Processing / Scheduled / Published)
 *   - right activity feed with 4 live events
 *   - on top: scrim + 84px pulsing play button + bottom scrubber labelled "// demo"
 *
 * Click the play button → the real demo video replaces the mockup poster.
 * Click the small close (×) in the top-right while playing → reverts to the
 * poster. The video uses `preload="metadata"` so the bytes only download on
 * demand (keeps the Hero LCP fast).
 *
 * Layout breakpoints (max-width):
 *   - 860px → drop the 3D rotateX, hide right activity panel, shrink sidebar
 *   - 620px → hide sidebar entirely, shrink play button, simplify rows
 *
 * Cover/avatar art is loaded from /Photos/release-os/. If iCloud hasn't synced
 * the assets yet the <img>s will 404 briefly, but the layout is intact.
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`
 */

"use client";

import { useRef, useState } from "react";
import { Icon, type IconName } from "./Icon";

/** Sidebar nav items (the leftmost column of the mockup). */
const SIDEBAR_NAV: ReadonlyArray<{
  icon: IconName;
  label: string;
  active?: boolean;
}> = [
  { icon: "library", label: "Library", active: true },
  { icon: "grid", label: "Visual Library" },
  { icon: "globe", label: "Producer Wall" },
  { icon: "cal", label: "Publishing Queue" },
  { icon: "youtube", label: "YouTube Settings" },
];

/** Beat rows displayed under "Recent tracks". */
type RowStatus = "proc" | "sched" | "pub";
const ROWS: ReadonlyArray<{
  cover: string;
  title: string;
  meta: string;
  status: RowStatus;
  statusLabel: string;
  played: number;
}> = [
  {
    cover: "/Photos/release-os/cover-1.jpg",
    title: "Rio Nights",
    meta: "Dark R&B · 88 BPM · Gm",
    status: "proc",
    statusLabel: "Processing",
    played: 0,
  },
  {
    cover: "/Photos/release-os/cover-2.jpg",
    title: "Midnight Oil",
    meta: "Trap Soul · 142 BPM · Am",
    status: "sched",
    statusLabel: "Scheduled",
    played: 0.55,
  },
  {
    cover: "/Photos/release-os/cover-4.jpg",
    title: "Slow Bleed",
    meta: "Dark R&B · 75 BPM · Dm",
    status: "pub",
    statusLabel: "Published",
    played: 1,
  },
];

/** Right-side activity feed events. */
const ACTIVITY: ReadonlyArray<{ html: React.ReactNode; ago: string; live?: boolean }> = [
  {
    html: (
      <>
        <b className="font-semibold text-text-1">Sales page</b> created for Rio Nights
      </>
    ),
    ago: "just now",
    live: true,
  },
  {
    html: (
      <>
        <b className="font-semibold text-text-1">Cover</b> auto-selected
      </>
    ),
    ago: "12s ago",
  },
  {
    html: (
      <>
        <b className="font-semibold text-text-1">Metadata</b> generated · YT
      </>
    ),
    ago: "28s ago",
  },
  {
    html: (
      <>
        Scheduled for <b className="font-semibold text-text-1">Tomorrow 6 PM</b>
      </>
    ),
    ago: "1m ago",
  },
];

/** Pure waveform generator — mirrors the HTML reference's wbars() formula. */
function makeWaveform(n: number, played: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.33));
    return { height: 3 + t * 18, active: i / n < played };
  });
}

/** Per-row status badge tinting. */
const BADGE_STYLES: Record<RowStatus, string> = {
  proc: "border border-accent-line bg-accent-soft text-[#cfd0ff]",
  sched: "border border-line-strong text-text-2",
  pub: "border border-[rgba(58,209,122,0.3)] bg-[rgba(58,209,122,0.12)] text-[#9be7bd]",
};

export function HeroAppMockup() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    // play() in a microtask so the <video> element is visible first —
    // some browsers reject play() calls on hidden elements.
    queueMicrotask(() => {
      videoRef.current?.play().catch(() => {
        // play() can reject if the user navigated away mid-click; safe to ignore
      });
    });
  };

  const handleClose = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return (
    <div
      id="demo"
      className="relative z-[2] mt-16 w-full pb-24"
    >
      {/* fade-to-bg at the bottom — softens the join with section 02 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[200px]"
        style={{ background: "linear-gradient(180deg, transparent, var(--bg))" }}
      />

      {/* the framed window */}
      <div
        className="relative overflow-hidden rounded-[18px] border border-line-strong bg-bg-deep max-[860px]:[transform:none]"
        style={{
          transform: "perspective(2400px) rotateX(2.4deg)",
          transformOrigin: "center top",
          boxShadow:
            "0 50px 120px -40px rgba(43,37,255,0.4), 0 30px 80px -30px rgba(0,0,0,0.9)",
        }}
      >
        {/* ====== browser chrome ====== */}
        <div className="flex items-center gap-[14px] border-b border-line bg-[#0d0d0f] px-[18px] py-[11px]">
          <div className="flex gap-[7px]">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex max-w-[440px] flex-1 items-center gap-[9px] rounded-pill border border-line bg-[#19191c] px-[14px] py-[6px]">
            <Icon name="lock" size={13} className="text-text-3" />
            <span className="font-mono text-[11.5px] text-text-2">
              app.wavloops.com/
              <b className="font-medium text-text-1">library</b>
            </span>
          </div>
          <div className="w-[54px]" aria-hidden />
        </div>

        {/* ====== poster (the app screen) ====== */}
        <div className="relative flex overflow-hidden bg-bg aspect-[16/9.2] max-[860px]:aspect-auto">
          {/* ---- sidebar ---- */}
          <aside className="flex w-[188px] shrink-0 flex-col gap-[16px] border-r border-line bg-bg-deep px-[14px] py-[18px] max-[860px]:w-[140px] max-[620px]:hidden">
            <div className="flex items-center gap-[8px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Photos/wavloops-icon.png"
                alt=""
                className="h-[17px] w-auto"
              />
              <span className="font-display text-[13px] font-bold tracking-[-0.01em]">
                WAVLOOPS
              </span>
            </div>

            <div className="flex items-center justify-center gap-[7px] rounded-pill bg-accent px-[10px] py-[9px] text-[12px] font-semibold text-white">
              <Icon name="upload" size={13} />
              Upload beats
            </div>

            <nav className="mt-[2px] flex flex-col gap-[3px]">
              {SIDEBAR_NAV.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-[9px] rounded-[9px] px-[10px] py-[8px] text-[12px] ${
                    item.active
                      ? "bg-surface-2 text-text-1"
                      : "text-text-3"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={14}
                    className={item.active ? "text-accent" : "text-text-3"}
                  />
                  {item.label}
                </div>
              ))}
            </nav>
          </aside>

          {/* ---- main column ---- */}
          <div className="flex min-w-0 flex-1 flex-col px-[22px] py-[20px]">
            <div className="mb-[16px] flex items-baseline gap-[11px]">
              <span className="font-display text-[17px] font-semibold tracking-[-0.025em]">
                Recent tracks
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-3">
                <span className="text-accent">//</span> auto-prepared
              </span>
            </div>

            <div className="flex flex-col gap-[9px]">
              {ROWS.map((row) => (
                <div
                  key={row.title}
                  className="flex items-center gap-[13px] rounded-[13px] border border-line bg-surface-1 px-[13px] py-[11px]"
                >
                  {/* play icon */}
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-line-strong text-text-2">
                    <Icon name="play" size={12} />
                  </span>

                  {/* cover */}
                  <span className="block h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[8px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>

                  {/* meta */}
                  <div className="flex w-[150px] shrink-0 flex-col gap-[3px] max-[620px]:w-auto max-[620px]:flex-1">
                    <span className="text-[12.5px] font-semibold tracking-[-0.01em]">
                      {row.title}
                    </span>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] text-text-3">
                      {row.meta}
                    </span>
                  </div>

                  {/* waveform */}
                  <div className="flex h-[22px] min-w-0 flex-1 items-center gap-[2px] max-[560px]:hidden">
                    {makeWaveform(34, row.played).map((bar, i) => (
                      <i
                        key={i}
                        className={`w-[2.5px] shrink-0 rounded-[2px] ${
                          bar.active ? "bg-accent" : "bg-[#3a3a40]"
                        }`}
                        style={{ height: `${bar.height}px` }}
                      />
                    ))}
                  </div>

                  {/* status badge */}
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-pill px-[9px] py-[4px] font-mono text-[8.5px] uppercase tracking-[0.07em] ${BADGE_STYLES[row.status]}`}
                  >
                    {row.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ---- activity feed ---- */}
          <aside className="flex w-[212px] shrink-0 flex-col gap-[14px] border-l border-line bg-bg-deep px-[16px] py-[18px] max-[860px]:hidden">
            <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-text-3">
              <span className="text-accent">//</span> Wavloops activity
            </div>
            <div className="flex flex-col gap-[13px]">
              {ACTIVITY.map((ev, i) => (
                <div key={i} className="flex gap-[10px]">
                  <span
                    className={`mt-[4px] h-[7px] w-[7px] shrink-0 rounded-full ${
                      ev.live ? "bg-accent" : "bg-line-strong"
                    }`}
                    style={
                      ev.live
                        ? { boxShadow: "0 0 0 3px var(--accent-soft)" }
                        : undefined
                    }
                  />
                  <div>
                    <div className="text-[11px] leading-[1.4] text-text-2">
                      {ev.html}
                    </div>
                    <div className="mt-[2px] font-mono text-[8.5px] tracking-[0.05em] text-text-3">
                      {ev.ago}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ====== video (lazy — only bytes download when user clicks play) ====== */}
          <video
            ref={videoRef}
            src="/Videos/Demo_Video_ReleaseOS.mp4"
            preload="metadata"
            playsInline
            controls={isPlaying}
            onEnded={handleClose}
            className={`absolute inset-0 z-[5] h-full w-full bg-black object-cover transition-opacity duration-300 ${
              isPlaying ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />

          {/* Close (×) button — only when playing. Sits above native controls. */}
          {isPlaying && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close demo"
              className="absolute right-[16px] top-[16px] z-[6] flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/[0.18] bg-black/60 text-white backdrop-blur-md transition-colors duration-wav ease-wav hover:bg-black/80"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}

          {/* ====== poster overlays (scrim + play + bottom scrubber) ====== */}
          {/* Hidden whilst the video plays via opacity + pointer-events. */}
          <div
            className={`pointer-events-none absolute inset-0 z-[7] transition-opacity duration-300 ${
              isPlaying ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* scrim */}
            <div
              aria-hidden
              className="absolute inset-0 z-[3]"
              style={{
                background:
                  "radial-gradient(60% 70% at 50% 42%, rgba(5,5,7,0.28), rgba(5,5,7,0.62))",
              }}
            />

            {/* play button + pulsing ring */}
            <div className="absolute left-1/2 top-[46%] z-[4] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button
                type="button"
                onClick={handlePlay}
                aria-label="Play demo"
                className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full border-none bg-accent text-white transition-transform duration-wav ease-wav hover:scale-[1.06] max-[620px]:h-[64px] max-[620px]:w-[64px]"
                style={{
                  boxShadow:
                    "0 0 0 10px rgba(43,37,255,0.16), 0 20px 50px -12px rgba(43,37,255,0.9)",
                }}
              >
                <Icon name="play" size={30} />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-[10px] rounded-full border border-[rgba(96,90,255,0.5)] motion-safe:[animation:wv-play-ring_2.4s_ease-out_infinite]"
                />
              </button>
            </div>

            {/* bottom scrubber (decorative — real controls appear on the
                video element itself once playback starts) */}
            <div
              className="absolute inset-x-0 bottom-0 z-[4] flex items-center gap-[16px] px-[22px] py-[20px]"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(5,5,7,0.85))",
              }}
            >
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.13em] text-[#dcdcff]">
                <span className="text-accent">//</span> Demo — see it work
              </span>
              <span className="relative h-[4px] flex-1 overflow-hidden rounded-[4px] bg-white/[0.16]">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-[34%] rounded-[4px] bg-accent"
                />
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-text-2">
                0:00 / 1:24
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
