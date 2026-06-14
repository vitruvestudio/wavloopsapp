/**
 * PlayerDock — bottom-pinned audio player (responsive).
 *
 * Desktop (md+) : 80px height, 3-column grid
 *   [Left 260px : cover + title + BPM/key]
 *   [Center 1fr : prev/play/next + waveform + times]
 *   [Right 200px : key tag + volume]
 *
 * Mobile (< md) : 64px height, compact layout
 *   [Cover 40px] [Title + meta, truncated] [Play button]
 *   No waveform · no skip · no volume — saving screen real estate.
 *   A thin 1px progress bar runs along the TOP of the dock.
 *
 * Renders only when `usePlayer().current` is non-null.
 * Uses safe-area-inset-bottom so the dock doesn't tuck under the iOS home indicator.
 */

"use client";

import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { PlayButton } from "@/components/ui/PlayButton";
import { Tag } from "@/components/ui/Tag";
import { Waveform } from "@/components/ui/Waveform";
import { usePlayer } from "./PlayerContext";

export function PlayerDock() {
  const { current, playing, progress, toggle, seek } = usePlayer();
  if (!current) return null;

  return (
    <div
      className="z-30 w-full shrink-0 border-t border-border-1 bg-bg-1"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Mobile-only thin progress bar at the top */}
      <div
        aria-hidden
        className="relative h-[2px] w-full bg-bg-inset md:hidden"
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent"
          style={{
            width: `${progress * 100}%`,
            boxShadow: "0 0 8px var(--accent-glow)",
          }}
        />
      </div>

      {/* === MOBILE LAYOUT (< md) === */}
      <div
        className="grid items-center gap-[10px] px-[14px] md:hidden"
        style={{ height: 64, gridTemplateColumns: "40px 1fr auto" }}
      >
        {/* Cover */}
        <Image
          src={current.img}
          alt=""
          width={40}
          height={40}
          className="block shrink-0 rounded-sm object-cover"
        />

        {/* Title + meta — truncate */}
        <div className="min-w-0">
          <div className="t-title truncate" style={{ fontSize: 13.5 }}>
            {current.title}
          </div>
          <div className="t-mono-s truncate" style={{ fontSize: 9, marginTop: 2 }}>
            {current.bpm} BPM · {current.key}
          </div>
        </div>

        {/* Play / pause */}
        <PlayButton size={40} playing={playing} onClick={() => toggle(current)} />
      </div>

      {/* === DESKTOP LAYOUT (md+) === */}
      <div
        className="hidden items-center gap-[24px] px-[24px] md:grid"
        style={{ height: 80, gridTemplateColumns: "260px 1fr 200px" }}
      >
        {/* LEFT — cover + meta */}
        <div className="flex min-w-0 items-center gap-[12px]">
          <Image
            src={current.img}
            alt=""
            width={50}
            height={50}
            className="block shrink-0 rounded-sm object-cover"
          />
          <div className="min-w-0">
            <div className="t-title truncate" style={{ fontSize: 14 }}>
              {current.title}
            </div>
            <div className="t-mono-s mt-[3px]">
              {current.bpm} BPM · {current.key}
            </div>
          </div>
        </div>

        {/* CENTER — transport + waveform */}
        <div className="flex flex-col items-center gap-[6px]">
          <div className="flex items-center gap-[12px]">
            <IconButton
              name="skip-back"
              size={34}
              iconSize={18}
              label="Previous"
            />
            <PlayButton size={40} playing={playing} onClick={() => toggle(current)} />
            <IconButton name="skip-fwd" size={34} iconSize={18} label="Next" />
          </div>

          <div className="flex w-full max-w-[520px] items-center gap-[12px]">
            <span className="t-mono-s w-[34px] text-right">
              {Math.floor(progress * 100)}%
            </span>
            <div
              className="relative flex-1 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seek(
                  Math.max(
                    0,
                    Math.min(1, (e.clientX - rect.left) / rect.width)
                  )
                );
              }}
            >
              <Waveform
                seed={current.wave}
                bars={110}
                progress={progress}
                height={26}
                glow
              />
            </div>
            <span className="t-mono-s w-[34px]">{current.dur}</span>
          </div>
        </div>

        {/* RIGHT — key + volume */}
        <div className="flex items-center justify-end gap-[12px]">
          <Tag variant="accent">{current.key}</Tag>
          <IconButton name="volume" size={34} iconSize={18} label="Volume" />
        </div>
      </div>
    </div>
  );
}
