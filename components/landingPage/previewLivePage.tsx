import {
  InstagramIcon,
  LockIcon,
  YoutubeIcon,
} from "@/components/landingPage/icons";

const KIT = {
  name: "Night / Shift 03",
  subtitle: "Layers of Trap",
  producer: "40minsmusic",
  producerAvatar: "/Photos/40mins_img.jpeg",
  duration: "0:48",
  cover: "/Photos/preview_image.jpg",
  chips: ["Hip-hop", "Sample pack"],
  contents: "24 samples · 4 loops · 3 MIDI · WAV 24-bit",
};

const ACTIONS: { icon: typeof YoutubeIcon; label: string; sub: string }[] = [
  {
    icon: YoutubeIcon,
    label: "Subscribe to channel",
    sub: "Youtube · 40minsmusic",
  },
  {
    icon: InstagramIcon,
    label: "Follow @40minsmusic",
    sub: "Instagram",
  },
];

// 48 bars — drum loop visual pattern with peaks on beats
const WAVE_BARS = [
  24, 8, 10, 6, 22, 8, 12, 6, 18, 6, 10, 4, 20, 8, 14, 8, 26, 10, 12, 6, 22, 10,
  8, 4, 16, 6, 8, 4, 24, 8, 12, 6, 22, 6, 14, 8, 18, 4, 10, 6, 24, 8, 12, 4, 20,
  6, 14, 8,
];

function PlayTriangle({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ width: size, height: size }}
    >
      <path d="M5 3 L12 8 L5 13 Z" />
    </svg>
  );
}

function CoverWithAudio() {
  return (
    <button
      type="button"
      aria-label={`Play ${KIT.name} preview`}
      className="group relative block aspect-square w-full overflow-hidden rounded-r-2 border border-line bg-bg-deep"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KIT.cover}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-all duration-wav ease-wav group-hover:scale-[1.02] group-hover:brightness-75"
      />

      {/* Gradient fade for waveform legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[80px]"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)",
        }}
      />

      {/* Waveform + duration overlay on bottom */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-s-2 px-s-3 py-s-3">
        <div className="flex h-[28px] flex-1 items-end gap-[1px]">
          {WAVE_BARS.map((h, i) => (
            <span
              key={i}
              aria-hidden
              className="flex-1 origin-bottom rounded-t-[1px] bg-white/80 motion-safe:animate-wave-pulse"
              style={{
                height: `${h * 0.6}px`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
        <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-mono-data text-white/90">
          {KIT.duration}
        </span>
      </div>

      {/* Play overlay (hover/focus) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-wav ease-wav group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-r-1 bg-text-1 text-bg">
          <PlayTriangle size={18} />
        </div>
      </div>
    </button>
  );
}

export function PreviewLivePage() {
  return (
    <div className="mx-auto w-full max-w-[352px]">
      <div className="overflow-hidden rounded-r-3 border border-line-strong bg-surface-1">
        {/* Producer header */}
        <div className="flex items-center gap-s-3 border-b border-line px-s-5 py-s-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={KIT.producerAvatar}
            alt=""
            loading="lazy"
            className="h-[32px] w-[32px] flex-shrink-0 rounded-r-1 border border-line-strong object-cover"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-semibold leading-tight text-text-1">
              {KIT.producer}
            </span>
            <span className="truncate font-mono text-mono-tiny uppercase tracking-mono-data text-text-3">
              @{KIT.producer}
            </span>
          </div>
        </div>

        <div className="p-s-4">
          {/* Cover with embedded audio preview */}
          <CoverWithAudio />

          {/* Title block */}
          <h1 className="mt-s-5 font-display text-[26px] font-extrabold uppercase leading-[0.92] tracking-[-0.04em] text-text-1 sm:text-[30px]">
            {KIT.name}
          </h1>
          <p className="mt-s-2 text-[13px] leading-snug text-text-2">
            {KIT.subtitle}
          </p>

          {/* Chips */}
          <div className="mt-s-3 flex flex-wrap gap-s-1">
            {KIT.chips.map((c) => (
              <span
                key={c}
                className="inline-flex h-[20px] items-center rounded-r-1 border border-line-strong px-s-2 font-mono text-[10px] uppercase tracking-mono-data text-text-2"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Pack contents */}
          <div className="mt-s-3">
            <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
              Pack contents
            </span>
            <p className="mt-s-1 font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-1">
              {KIT.contents}
            </p>
          </div>

          {/* Action prompt */}
          <div className="mt-s-4 flex items-center justify-between gap-s-2 border-y border-line py-s-2">
            <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-1">
              Complete the actions to unlock
            </span>
            <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
              2 steps
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-s-3 flex flex-col gap-s-2">
            {ACTIONS.map(({ icon: Icon, label, sub }) => (
              <button
                key={label}
                type="button"
                className="group/action flex items-center gap-s-3 rounded-r-1 border border-line-strong bg-surface-2 px-s-3 py-s-3 text-left transition-colors duration-wav ease-wav hover:border-accent"
              >
                <div className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-r-1 border border-line-strong bg-bg-deep text-text-1 transition-colors duration-wav ease-wav group-hover/action:border-accent group-hover/action:text-accent">
                  <Icon />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-semibold leading-tight text-text-1">
                    {label}
                  </span>
                  <span className="truncate font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                    {sub}
                  </span>
                </div>
                <span
                  aria-hidden
                  className="flex-shrink-0 font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3 transition-colors duration-wav ease-wav group-hover/action:text-text-1"
                >
                  →
                </span>
              </button>
            ))}
          </div>

          {/* Progress */}
          <div className="mt-s-4">
            <div className="flex items-center justify-between gap-s-2">
              <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                Unlock progress
              </span>
              <span className="inline-flex h-[22px] items-center rounded-r-1 border border-line-strong px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-1">
                0/{ACTIONS.length} done
              </span>
            </div>
            <div className="mt-s-2 h-[3px] w-full overflow-hidden bg-line-strong">
              <div
                aria-hidden
                className="h-full bg-accent"
                style={{ width: "0%" }}
              />
            </div>
          </div>

          {/* Unlock button (locked) */}
          <button
            type="button"
            disabled
            aria-disabled
            className="mt-s-4 flex w-full cursor-not-allowed items-center justify-center gap-s-2 rounded-r-1 border border-line-strong bg-surface-2 px-s-4 py-s-3 text-[14px] font-semibold uppercase leading-none tracking-button text-text-3"
          >
            <LockIcon />
            Unlock free kit
          </button>
        </div>
      </div>
    </div>
  );
}
