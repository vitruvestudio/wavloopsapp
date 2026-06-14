/**
 * PlayerDock — bottom-pinned 80px audio player.
 *
 * Renders only when `usePlayer().current` is non-null. Layout is a
 * 3-column grid (per DS spec):
 *   - Left  (260px) : cover + title + BPM/key
 *   - Center (1fr)  : prev/play/next transport + waveform with played glow
 *   - Right (200px) : key tag + volume toggle
 *
 * The dock is positioned via the parent (app) layout — it sits below
 * the scrollable content area so the producer can always trigger
 * playback from any screen without losing context.
 */

"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Tag } from "@/components/ui/Tag";
import { Waveform } from "@/components/ui/Waveform";
import { usePlayer } from "./PlayerContext";

export function PlayerDock() {
  const { current, playing, progress, toggle, seek } = usePlayer();
  if (!current) return null;

  return (
    <div
      className="z-30 grid w-full shrink-0 items-center border-t border-border-1 bg-bg-1 px-sp-6"
      style={{
        height: 80,
        gridTemplateColumns: "260px 1fr 200px",
        gap: 24,
      }}
    >
      {/* LEFT — cover + meta */}
      <div className="flex min-w-0 items-center gap-sp-3">
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
        <div className="flex items-center gap-sp-3">
          <IconButton name="skip-back" size={34} iconSize={18} label="Previous" />
          <button
            type="button"
            onClick={() => toggle(current)}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent text-accent-fg shadow-glow transition-transform hover:scale-[1.06] active:scale-100"
          >
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <IconButton name="skip-fwd" size={34} iconSize={18} label="Next" />
        </div>

        <div className="flex w-full max-w-[520px] items-center gap-sp-3">
          <span className="t-mono-s w-[34px] text-right">
            {Math.floor(progress * 100)}%
          </span>
          <div
            className="relative flex-1 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
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
      <div className="flex items-center justify-end gap-sp-3">
        <Tag variant="accent">{current.key}</Tag>
        <IconButton name="volume" size={34} iconSize={18} label="Volume" />
      </div>
    </div>
  );
}
