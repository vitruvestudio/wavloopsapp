/**
 * PlayerContext — global currently-playing state, backed by a real
 * <audio> element managed inside the provider.
 *
 * Lives in the (app) route group layout so any screen can call
 * `toggle(beat)`, `pause()`, `resume()`, `seek(progress)` and surface
 * the dock at the bottom of the shell when a beat is playing.
 *
 * Architecture:
 *   - A single <audio preload="metadata"> is rendered as a sibling of
 *     `children` so play/pause/seek work even across navigations
 *     (the provider lives in the (app) layout which doesn't unmount).
 *   - `current` holds the Beat metadata; the audio src is bound to
 *     `current.audioUrl` via an effect.
 *   - `playing` + `progress` mirror the audio element's events
 *     (play/pause/timeupdate/ended) — no setInterval anymore.
 *
 * The Beat type:
 *   - `img` may be a blob: URL (Upload preview), a Storage URL, or
 *     null (fall back to the generative CoverArt seeded with `wave`).
 *   - `audioUrl` is the playback source. Without it, toggle() will
 *     still set `current` so the dock can show metadata, but `playing`
 *     stays false because there's nothing to decode.
 */

"use client";

import * as React from "react";

export interface Beat {
  id: string;
  title: string;
  bpm: number;
  key: string;
  /** Display duration string e.g. "2:48". */
  dur: string;
  /** Cover image URL — blob: / https: / null. */
  img: string | null;
  /** Stable seed for the Waveform component + generative CoverArt fallback. */
  wave: string;
  mood?: string[];
  /** Playback source. blob: URL from the Upload page, or a Storage URL
   *  in the rest of the app. Null = metadata-only (no playback). */
  audioUrl?: string | null;
}

interface PlayerState {
  current: Beat | null;
  playing: boolean;
  progress: number; // 0..1
}

interface PlayerCtx extends PlayerState {
  /** Toggle play/pause on the same beat, or switch + auto-play if different. */
  toggle(beat: Beat): void;
  pause(): void;
  resume(): void;
  seek(progress: number): void;
  /** Stop and clear the current beat. Used when its source goes away
   *  (e.g. the Upload page cancels and revokes the blob URL). */
  clear(): void;
}

const Ctx = React.createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = React.useState<Beat | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  /* Bind the audio src whenever the current beat changes */
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!current?.audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }
    if (audio.src !== current.audioUrl) {
      audio.src = current.audioUrl;
      audio.load();
    }
  }, [current]);

  /* Mirror playback events into React state */
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) {
        setProgress(audio.currentTime / d);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Read `current` via a ref so toggle doesn't have to rebuild every
  // render — the click handler stays stable. Same with `playing`.
  const currentRef = React.useRef<Beat | null>(null);
  React.useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const toggle = React.useCallback((beat: Beat) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Top-level play() / pause() — preserves the user-gesture context
    // for browser autoplay policies. (When called inside setState's
    // updater the gesture chain is technically intact in React 19, but
    // browsers occasionally heuristically reject it — top-level is the
    // safe form.)
    const prev = currentRef.current;
    if (prev && prev.id === beat.id) {
      if (audio.paused || audio.ended) {
        audio.play().catch((e) => {
          console.warn("[player] play failed", e);
        });
      } else {
        audio.pause();
      }
      return;
    }

    // Different beat — switch source and start over.
    setProgress(0);
    setCurrent(beat);
    if (beat.audioUrl) {
      audio.src = beat.audioUrl;
      audio.currentTime = 0;
      audio.play().catch((e) => {
        console.warn("[player] play failed on new beat", e);
      });
    }
  }, []);

  const pause = React.useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = React.useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const seek = React.useCallback((frac: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, frac));
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) {
      setProgress(clamped);
      return;
    }
    audio.currentTime = audio.duration * clamped;
    setProgress(clamped);
  }, []);

  const clear = React.useCallback(() => {
    audioRef.current?.pause();
    setCurrent(null);
    setPlaying(false);
    setProgress(0);
  }, []);

  const value: PlayerCtx = {
    current,
    playing,
    progress,
    toggle,
    pause,
    resume,
    seek,
    clear,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </Ctx.Provider>
  );
}

export function usePlayer(): PlayerCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx)
    throw new Error("usePlayer must be used inside <PlayerProvider />");
  return ctx;
}
