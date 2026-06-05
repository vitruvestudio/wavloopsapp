/**
 * HeroMockup — CRM-style app screenshot for the /organized variant.
 *
 * Same browser-chrome frame as the root landing's HeroAppMockup (visual
 * consistency across variants), but the inner content is a contacts board
 * instead of a publishing queue:
 *
 *   - left sidebar with "Contacts" highlighted (not "Library")
 *   - main column: contacts table (Artist · Genre · Location · Status · Last beat)
 *   - right activity feed: matches, replies, sends
 *   - same 3D rotateX + drop shadow as root mockup, same play overlay
 *
 * Click play → poster fades, you see the same demo video as the root
 * landing (we don't have a CRM-specific demo recorded yet — placeholder).
 */

"use client";

import { useRef, useState } from "react";
import { Icon, type IconName } from "../Icon";

/* ============ data ============ */

const SIDEBAR_NAV: ReadonlyArray<{
  icon: IconName;
  label: string;
  active?: boolean;
}> = [
  { icon: "library", label: "Library" },
  { icon: "send", label: "Contacts", active: true },
  { icon: "target", label: "Matching" },
  { icon: "cal", label: "Sent log" },
  { icon: "youtube", label: "YouTube Settings" },
];

type ContactStatus = "replied" | "sent" | "pending" | "new";

interface Contact {
  initials: string;
  name: string;
  meta: string;
  status: ContactStatus;
  statusLabel: string;
}

const CONTACTS: ReadonlyArray<Contact> = [
  {
    initials: "AK",
    name: "Ari Kova",
    meta: "R&B · Los Angeles · 124K",
    status: "replied",
    statusLabel: "Replied · 2h",
  },
  {
    initials: "DJ",
    name: "Dae Jones",
    meta: "Singer · Atlanta · 86K",
    status: "sent",
    statusLabel: "Sent · 1d",
  },
  {
    initials: "NV",
    name: "Nova V.",
    meta: "Alt-R&B · London · 42K",
    status: "pending",
    statusLabel: "Pending · 3d",
  },
  {
    initials: "MC",
    name: "Marcus Cole",
    meta: "Trap · NYC · 198K",
    status: "replied",
    statusLabel: "Replied · 5d",
  },
  {
    initials: "SR",
    name: "Sienna Ray",
    meta: "R&B · Miami · 31K",
    status: "new",
    statusLabel: "New match",
  },
];

const STATUS_TINT: Record<ContactStatus, string> = {
  replied:
    "border-[rgba(58,209,122,0.30)] bg-[rgba(58,209,122,0.12)] text-[#9be7bd]",
  sent: "border-accent-line bg-accent-soft text-[#cfd0ff]",
  pending: "border-line-strong text-text-2",
  new: "border-[rgba(202,163,106,0.42)] bg-[rgba(202,163,106,0.06)] text-[#caa36a]",
};

const ACTIVITY: ReadonlyArray<{ html: React.ReactNode; ago: string; live?: boolean }> = [
  {
    html: (
      <>
        <b className="font-semibold text-text-1">5 new matches</b> for Rio Nights
      </>
    ),
    ago: "just now",
    live: true,
  },
  {
    html: (
      <>
        <b className="font-semibold text-text-1">Ari Kova</b> replied to your DM
      </>
    ),
    ago: "12s ago",
  },
  {
    html: (
      <>
        Beat <b className="font-semibold text-text-1">Heatwave</b> sent · Dae Jones
      </>
    ),
    ago: "28s ago",
  },
  {
    html: (
      <>
        Imported <b className="font-semibold text-text-1">312 contacts</b> · Instagram
      </>
    ),
    ago: "1m ago",
  },
];

/* ============ component ============ */

export function HeroMockup() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    queueMicrotask(() => {
      videoRef.current?.play().catch(() => {});
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
    <div id="demo" className="relative z-[2] mt-16 w-full pb-24">
      {/* fade-to-bg at the bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[200px]"
        style={{ background: "linear-gradient(180deg, transparent, var(--bg))" }}
      />

      <div
        className="relative overflow-hidden rounded-[18px] border border-line-strong bg-bg-deep max-[860px]:[transform:none]"
        style={{
          transform: "perspective(2400px) rotateX(2.4deg)",
          transformOrigin: "center top",
          boxShadow:
            "0 50px 120px -40px rgba(43,37,255,0.4), 0 30px 80px -30px rgba(0,0,0,0.9)",
        }}
      >
        {/* browser chrome */}
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
              <b className="font-medium text-text-1">contacts</b>
            </span>
          </div>
          <div className="w-[54px]" aria-hidden />
        </div>

        {/* poster */}
        <div className="relative flex overflow-hidden bg-bg aspect-[16/9.2] max-[860px]:aspect-auto">
          {/* sidebar */}
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
              <Icon name="send" size={13} />
              Import contacts
            </div>

            <nav className="mt-[2px] flex flex-col gap-[3px]">
              {SIDEBAR_NAV.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-[9px] rounded-[9px] px-[10px] py-[8px] text-[12px] ${
                    item.active ? "bg-surface-2 text-text-1" : "text-text-3"
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

          {/* main — contacts table */}
          <div className="flex min-w-0 flex-1 flex-col px-[22px] py-[20px]">
            <div className="mb-[16px] flex items-baseline gap-[11px]">
              <span className="font-display text-[17px] font-semibold tracking-[-0.025em]">
                Your contacts
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-3">
                <span className="text-accent">//</span> 312 sorted
              </span>
            </div>

            <div className="flex flex-col gap-[9px]">
              {CONTACTS.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-[13px] rounded-[13px] border border-line bg-surface-1 px-[13px] py-[11px]"
                >
                  {/* avatar initials */}
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 font-mono text-[11px] text-text-2">
                    {c.initials}
                  </span>

                  {/* name + meta */}
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="truncate text-[12.5px] font-semibold tracking-[-0.01em] text-text-1">
                      {c.name}
                    </span>
                    <span className="truncate font-mono text-[8.5px] uppercase tracking-[0.06em] text-text-3">
                      {c.meta}
                    </span>
                  </div>

                  {/* status pill */}
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-pill border px-[9px] py-[4px] font-mono text-[8.5px] uppercase tracking-[0.07em] ${STATUS_TINT[c.status]}`}
                  >
                    {c.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* activity feed */}
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
                      ev.live ? { boxShadow: "0 0 0 3px var(--accent-soft)" } : undefined
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

          {/* video element + close button (same pattern as root mockup) */}
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

          {isPlaying && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close demo"
              className="absolute right-[16px] top-[16px] z-[6] flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/[0.18] bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}

          {/* poster overlays — scrim + play + scrubber */}
          <div
            className={`pointer-events-none absolute inset-0 z-[7] transition-opacity duration-300 ${
              isPlaying ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              aria-hidden
              className="absolute inset-0 z-[3]"
              style={{
                background:
                  "radial-gradient(60% 70% at 50% 42%, rgba(5,5,7,0.28), rgba(5,5,7,0.62))",
              }}
            />

            <div className="pointer-events-auto absolute left-1/2 top-[46%] z-[4] -translate-x-1/2 -translate-y-1/2">
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

            <div
              className="absolute inset-x-0 bottom-0 z-[4] flex items-center gap-[16px] px-[22px] py-[20px]"
              style={{
                background: "linear-gradient(180deg, transparent, rgba(5,5,7,0.85))",
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
