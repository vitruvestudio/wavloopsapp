/**
 * Browser-side audio analysis — BPM + Key detection via essentia.js.
 *
 * essentia.js ships a ~10 MB WASM blob, so we lazy-load it inside
 * `getEssentia()` instead of `import`ing at module top-level. Only the
 * UploadBeatPage triggers it, so the rest of the app stays small.
 *
 * Pipeline:
 *   1. Read file → ArrayBuffer
 *   2. AudioContext.decodeAudioData → AudioBuffer (PCM, native sample rate)
 *   3. Mono down-mix (channel 0)
 *   4. essentia.PercivalBpmEstimator → bpm
 *   5. essentia.KeyExtractor → { key, scale }
 *   6. Normalise key string ("A#" → "BB", scale → "MAJ"/"MIN")
 *
 * Failure modes — all graceful:
 *   - WASM module fails to load → throws; the hook switches to "failed"
 *     and the producer fills the cells by hand
 *   - decodeAudioData fails (unsupported codec) → same
 *   - Individual extractor errors are caught — partial results are
 *     returned (e.g. bpm 0 if PercivalBpmEstimator fell over but
 *     KeyExtractor succeeded)
 */

import * as React from "react";

export interface AudioAnalysisResult {
  bpm: number;
  /** Normalised "C MAJ" / "EB MIN" / null. Maps to KEY_OPTIONS. */
  key: string | null;
  /** Integrated loudness in LUFS (EBU R 128). Range ~ -70..0. NULL
   *  if extraction failed or audio was silence. */
  loudnessLufs: number | null;
}

let essentiaPromise: Promise<unknown> | null = null;

/**
 * Loads essentia.js by injecting the CDN script tags. We can't
 * `import("essentia.js")` directly because the package's index.js
 * pulls in `require("fs")` / `require("path")` from its UMD bundle —
 * the browser bundler chokes on those Node-only modules.
 *
 * The CDN UMD build sets `window.Essentia` + `window.EssentiaWASM`,
 * which we then instantiate. The .wasm binary is loaded by the UMD's
 * own fetch (same CDN origin) and cached aggressively by jsDelivr.
 *
 * Trade-off: hard dep on jsDelivr at runtime in V1. Pre-launch we'll
 * self-host the WASM files in /public with proper Cache-Control so
 * we don't ship a CDN dep to production users.
 */
async function getEssentia(): Promise<EssentiaApi> {
  if (essentiaPromise) return essentiaPromise as Promise<EssentiaApi>;

  essentiaPromise = (async () => {
    const v = "0.1.3";
    await Promise.all([
      loadScript(
        `https://cdn.jsdelivr.net/npm/essentia.js@${v}/dist/essentia-wasm.web.js`,
      ),
      loadScript(
        `https://cdn.jsdelivr.net/npm/essentia.js@${v}/dist/essentia.js-core.js`,
      ),
    ]);

    const w = window as unknown as {
      Essentia: new (wasm: unknown) => EssentiaApi;
      EssentiaWASM: unknown;
    };
    if (!w.Essentia || !w.EssentiaWASM) {
      throw new Error("essentia.js failed to attach to window");
    }

    // The web build's `EssentiaWASM` is an emscripten factory that returns
    // a Promise<Module>. We need to await it before passing the resolved
    // module to the Essentia constructor (which then reaches for
    // `.EssentiaJS` on it). Some build variants expose the module directly
    // — handle both shapes defensively.
    const rawWasm = w.EssentiaWASM;
    const wasmModule =
      typeof rawWasm === "function"
        ? await (rawWasm as () => Promise<unknown>)()
        : rawWasm;

    return new w.Essentia(wasmModule);
  })();

  return essentiaPromise as Promise<EssentiaApi>;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-essentia-src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.essentiaSrc = src;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/** Minimal slice of the essentia.js API we touch. The package ships
 *  loose `any` types, so we keep just what we need. */
interface EssentiaApi {
  arrayToVector(input: Float32Array): EssentiaVector;
  PercivalBpmEstimator(signal: EssentiaVector): { bpm: number };
  KeyExtractor(audio: EssentiaVector): {
    key: string;
    scale: string;
    strength: number;
  };
  LoudnessEBUR128(
    signal_l: EssentiaVector,
    signal_r: EssentiaVector,
    hopSize?: number,
    sampleRate?: number,
    startAtZero?: boolean,
  ): {
    integratedLoudness: number;
    loudnessRange: number;
  };
}

interface EssentiaVector {
  delete(): void;
}

const SHARP_TO_FLAT: Record<string, string> = {
  "A#": "BB",
  "D#": "EB",
  "G#": "AB",
};

function formatKey(rawKey: string, scale: string): string | null {
  if (!rawKey) return null;
  const upper = rawKey.toUpperCase().trim();
  const normalised = SHARP_TO_FLAT[upper] ?? upper;
  const scaleStr =
    scale.toLowerCase().startsWith("maj") ? "MAJ" : "MIN";
  return `${normalised} ${scaleStr}`;
}

export async function analyzeAudio(
  file: File,
): Promise<AudioAnalysisResult> {
  if (typeof window === "undefined") {
    throw new Error("analyzeAudio must run in the browser");
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API not supported in this browser");
  }

  const audioContext = new AudioContextClass();

  let bpm = 0;
  let key: string | null = null;
  let loudnessLufs: number | null = null;
  let monoVector: EssentiaVector | null = null;
  let leftVector: EssentiaVector | null = null;
  let rightVector: EssentiaVector | null = null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const leftData = audioBuffer.getChannelData(0);
    const rightData =
      audioBuffer.numberOfChannels > 1
        ? audioBuffer.getChannelData(1)
        : leftData;
    const sampleRate = audioBuffer.sampleRate;

    const essentia = await getEssentia();

    // Separate vectors per algorithm — essentia.js consumes them.
    monoVector = essentia.arrayToVector(leftData);

    try {
      const bpmResult = essentia.PercivalBpmEstimator(monoVector);
      bpm = Math.round(bpmResult.bpm);
    } catch (e) {
      console.warn("[audio-analysis] BPM extractor failed", e);
    }

    try {
      const keyResult = essentia.KeyExtractor(monoVector);
      key = formatKey(keyResult.key, keyResult.scale);
    } catch (e) {
      console.warn("[audio-analysis] Key extractor failed", e);
    }

    // LoudnessEBUR128 wants stereo L + R.
    leftVector = essentia.arrayToVector(leftData);
    rightVector = essentia.arrayToVector(rightData);

    try {
      const loud = essentia.LoudnessEBUR128(
        leftVector,
        rightVector,
        0.1,
        sampleRate,
        false,
      );
      const raw = loud.integratedLoudness;
      // Sanity-check the result. Anything outside real-music range
      // (≈ -70 LUFS digital silence … 0 LUFS full-scale) is treated as
      // a failed extraction.
      if (Number.isFinite(raw) && raw > -70 && raw <= 0) {
        loudnessLufs = Math.round(raw * 10) / 10;
      }
    } catch (e) {
      console.warn("[audio-analysis] Loudness extractor failed", e);
    }
  } finally {
    try {
      monoVector?.delete();
    } catch {
      /* */
    }
    try {
      leftVector?.delete();
    } catch {
      /* */
    }
    try {
      rightVector?.delete();
    } catch {
      /* */
    }
    try {
      await audioContext.close();
    } catch {
      /* context already closed */
    }
  }

  return { bpm, key, loudnessLufs };
}

/* ============================================================
   React hook
   ============================================================ */

export type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "done"; result: AudioAnalysisResult }
  | { status: "failed"; error: string };

/**
 * Runs `analyzeAudio(file)` exactly once when a non-null File arrives.
 * Strict-mode-safe via a ref guard so the analysis doesn't fire twice
 * in dev. Subsequent file changes do NOT re-trigger — the upload flow
 * is single-file, single-shot.
 */
export function useAudioAnalysis(file: File | null): AnalysisState {
  const [state, setState] = React.useState<AnalysisState>({ status: "idle" });
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!file || startedRef.current) return;
    startedRef.current = true;

    setState({ status: "analyzing" });

    analyzeAudio(file)
      .then((result) => setState({ status: "done", result }))
      .catch((err: unknown) => {
        console.error("[audio-analysis] failed", err);
        const message =
          err instanceof Error ? err.message : "Analysis failed";
        setState({ status: "failed", error: message });
      });
  }, [file]);

  return state;
}
