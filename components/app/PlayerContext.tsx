/**
 * PlayerContext — global currently-playing state.
 *
 * Lives in the (app) route group layout so any nested screen
 * (Dashboard, ServerView, Library, BeatDetail, ContactDetail) can
 * call `play(beat)` / `pause()` / `seek(progress)` and surface the
 * dock at the bottom of the shell when a beat is playing.
 *
 * V1 progress is faked via setInterval — a real <audio> element +
 * Web Audio listeners will replace the timer in a later commit.
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
  /** Cover image URL. */
  img: string;
  /** Stable seed for the Waveform component. */
  wave: string;
  mood?: string[];
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
}

const Ctx = React.createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = React.useState<Beat | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Fake playback timer — replace with <audio> + timeupdate in V1.1.
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= 1 ? 0 : p + 0.0035));
    }, 80);
    return () => clearInterval(id);
  }, [playing]);

  const toggle = React.useCallback(
    (beat: Beat) => {
      setCurrent((prev) => {
        if (prev && prev.id === beat.id) {
          setPlaying((p) => !p);
          return prev;
        }
        setProgress(0);
        setPlaying(true);
        return beat;
      });
    },
    []
  );

  const pause = React.useCallback(() => setPlaying(false), []);
  const resume = React.useCallback(() => {
    if (current) setPlaying(true);
  }, [current]);

  const value: PlayerCtx = {
    current,
    playing,
    progress,
    toggle,
    pause,
    resume,
    seek: setProgress,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx)
    throw new Error("usePlayer must be used inside <PlayerProvider />");
  return ctx;
}
