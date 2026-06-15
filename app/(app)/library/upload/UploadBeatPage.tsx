/**
 * UploadBeatPage — client component, 2-column setup form.
 *
 * Reached from the UploadModal on /library after a file has been
 * picked. The File object is handed over via the pending-upload module
 * singleton (see lib/pending-upload.ts) — refresh = back to /library.
 *
 *   ┌─ PageHeader: ◂ "Upload a beat" ─────── [ Cancel ] [ Upload beat ] ┐
 *   │
 *   │  ┌─ left col ─────────────┐  ┌─ right col ──────────────┐
 *   │  │ 1:1 CoverArt            │  │ AUTO-DETECTED kicker    │
 *   │  │ + "ARTWORK" overlay     │  │ TEMPO · KEY · LENGTH    │
 *   │  │                         │  │ · AUTOTUNE KEY (4 cells)│
 *   │  │ audio file row          │  │                         │
 *   │  │   "filename.wav · ✓READY│  │ BEAT NAME field          │
 *   │  │ waveform preview        │  │ TYPE Segmented           │
 *   │  └─────────────────────────┘  │ PRODUCED BY TagInput     │
 *   │                               │ MOOD TagInput            │
 *   │                               │ ARTIST TYPE TagInput     │
 *   │                               │ DESCRIPTION textarea     │
 *   │                               │ ADD TO SERVERS multi-card│
 *   │                               └──────────────────────────┘
 *   └────────────────────────────────────────────────────────────┘
 *
 * Lifecycle:
 *   1. Mount → consumePendingFile() once (ref-guarded against strict
 *      mode double-invoke)
 *   2. If null → router.replace("/library") and bail
 *   3. Else → kick off background upload to Storage + pre-fill title
 *      + auto-detect length
 *   4. While the audio uploads in the background the producer fills
 *      the form; "Upload beat" stays disabled until upload.status === "ready"
 *
 * V1 scope (this commit):
 *   - Length auto-detect from the audio file's metadata (cheap, native).
 *   - BPM / KEY / AUTOTUNE KEY are MANUAL inputs — auto-detect ships in
 *     J4.3 with essentia.js.
 *   - Title auto-extracted from filename (Title-Cased).
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { CoverArt } from "@/components/ui/CoverArt";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { PlayButton } from "@/components/ui/PlayButton";
import { Segmented } from "@/components/ui/Segmented";
import { TagInput } from "@/components/ui/TagInput";
import { Tooltip } from "@/components/ui/Tooltip";
import { VisBadge } from "@/components/ui/VisBadge";
import { usePlayer, type Beat } from "@/components/app/PlayerContext";
import {
  ARTIST_TYPE_SUGGEST,
  COPRODUCER_SUGGEST,
  KEY_OPTIONS,
  MOOD_SUGGEST,
  decodeFilenameTitle,
  getAudioDurationSeconds,
} from "@/lib/audio";
import { useAudioAnalysis } from "@/lib/audio-analysis";
import { fmtDuration } from "@/lib/fmt";
import { consumePendingFile } from "@/lib/pending-upload";
import { createClient } from "@/lib/supabase/client";
import { saveBeatAction } from "./actions";
import type { BeatType, ServerRow } from "@/lib/supabase/database.types";

interface UploadBeatPageProps {
  userId: string;
  producerName: string;
  servers: ServerRow[];
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; pct: number }
  | { status: "ready"; path: string }
  | { status: "failed"; message: string };

export function UploadBeatPage({
  userId,
  producerName,
  servers,
}: UploadBeatPageProps) {
  const router = useRouter();

  /* ============================================================
     File + form state
     ============================================================ */

  const [file, setFile] = React.useState<File | null>(null);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [upload, setUpload] = React.useState<UploadState>({ status: "idle" });

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<BeatType>("comp");
  const [bpm, setBpm] = React.useState<string>("");
  const [key, setKey] = React.useState<string>("");
  const [loudnessLufs, setLoudnessLufs] = React.useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = React.useState<number | null>(
    null,
  );
  const [coProducers, setCoProducers] = React.useState<string[]>([
    producerName,
  ]);
  const [mood, setMood] = React.useState<string[]>([]);
  const [artistTypes, setArtistTypes] = React.useState<string[]>([]);
  const [description, setDescription] = React.useState("");
  const [hasStems, setHasStems] = React.useState(false);
  const [serverIds, setServerIds] = React.useState<string[]>([]);

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const beatIdRef = React.useRef<string>(crypto.randomUUID());
  /** Strict-mode double-invoke guard for the consume on mount. */
  const consumedRef = React.useRef(false);

  /* ============================================================
     Artwork (optional custom cover image)
     ============================================================ */

  const [artworkFile, setArtworkFile] = React.useState<File | null>(null);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = React.useState<
    string | null
  >(null);
  const artworkInputRef = React.useRef<HTMLInputElement>(null);

  const onPickArtwork = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setServerError("Cover must be an image (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setServerError("Cover image is over 5 MB. Compress and try again.");
      return;
    }
    setServerError(null);
    if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl);
    setArtworkFile(f);
    setArtworkPreviewUrl(URL.createObjectURL(f));
  };

  const removeArtwork = () => {
    if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl);
    setArtworkFile(null);
    setArtworkPreviewUrl(null);
  };

  const uploadArtwork = async (): Promise<string | null> => {
    if (!artworkFile) return null;
    const supabase = createClient();
    const ext = (artworkFile.name.split(".").pop() ?? "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${beatIdRef.current}.${ext}`;
    const { error } = await supabase.storage
      .from("beat-covers")
      .upload(path, artworkFile, {
        contentType: artworkFile.type,
        upsert: true,
      });
    if (error) {
      console.warn("[upload-beat] artwork upload failed", error);
      return null;
    }
    const { data } = supabase.storage
      .from("beat-covers")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  /* ============================================================
     Audio playback — routed through the global PlayerDock.
     We build a Beat object from the current form state and ship it
     to PlayerContext on cover click. The dock at the bottom of the
     shell takes over from there (play/pause/seek/skip).
     ============================================================ */

  const player = usePlayer();

  const previewBeat: Beat | null = React.useMemo(() => {
    if (!file || !fileUrl) return null;
    return {
      id: beatIdRef.current,
      title: title || file.name,
      bpm: bpm ? Number(bpm) : 0,
      key: key || "",
      dur: fmtDuration(durationSeconds),
      img: artworkPreviewUrl,
      wave: beatIdRef.current,
      mood,
      audioUrl: fileUrl,
    };
  }, [
    file,
    fileUrl,
    title,
    bpm,
    key,
    durationSeconds,
    artworkPreviewUrl,
    mood,
  ]);

  const isCurrent =
    previewBeat != null && player.current?.id === previewBeat.id;
  const togglePreview = () => {
    if (previewBeat) player.toggle(previewBeat);
  };

  /* ============================================================
     File handling
     ============================================================ */

  const uploadFile = React.useCallback(
    async (f: File) => {
      setUpload({ status: "uploading", pct: 0 });
      const supabase = createClient();
      const ext = (f.name.split(".").pop() ?? "mp3").toLowerCase();
      const path = `${userId}/${beatIdRef.current}.${ext}`;

      const { error } = await supabase.storage
        .from("beat-audio")
        .upload(path, f, {
          contentType: f.type || "audio/mpeg",
          upsert: false,
        });

      if (error) {
        setUpload({ status: "failed", message: error.message });
        return;
      }
      setUpload({ status: "ready", path });
    },
    [userId],
  );

  const handleFile = React.useCallback(
    async (f: File) => {
      setServerError(null);
      setFile(f);
      setFileUrl(URL.createObjectURL(f));
      setTitle((cur) => cur || decodeFilenameTitle(f.name));

      try {
        const d = await getAudioDurationSeconds(f);
        setDurationSeconds(d);
      } catch {
        // length auto-detect failed — user can still submit without it
      }

      // Background upload — by the time the producer finishes filling
      // the form the audio is already in Storage.
      void uploadFile(f);
    },
    [uploadFile],
  );

  /* ============================================================
     Mount: consume the file the modal handed over via the singleton.
     Strict mode runs this twice in dev — the ref guard makes it idempotent.
     ============================================================ */

  React.useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;

    const f = consumePendingFile();
    if (!f) {
      router.replace("/library");
      return;
    }
    void handleFile(f);
  }, [handleFile, router]);

  const cancelUpload = () => {
    // Stop any preview playing through the dock — the blob URL is
    // about to be revoked, the dock would error otherwise.
    if (isCurrent) player.clear();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    router.push("/library");
  };

  /* ============================================================
     Auto-detect BPM + Key via essentia.js (lazy-loaded WASM).
     Populates the empty cells when analysis completes — never
     overwrites whatever the producer has manually typed.
     ============================================================ */

  const analysis = useAudioAnalysis(file);
  const analyzing = analysis.status === "analyzing";

  React.useEffect(() => {
    if (analysis.status !== "done") return;
    const {
      bpm: detectedBpm,
      key: detectedKey,
      loudnessLufs: detectedLufs,
    } = analysis.result;
    if (detectedBpm > 0) {
      setBpm((prev) => prev || String(detectedBpm));
    }
    if (detectedKey) {
      setKey((prev) => prev || detectedKey);
    }
    if (detectedLufs != null) {
      // Loudness is read-only; replace whatever was there.
      setLoudnessLufs(detectedLufs);
    }
  }, [analysis]);

  /* ============================================================
     Submit
     ============================================================ */

  const canSubmit =
    file !== null &&
    upload.status === "ready" &&
    title.trim().length > 0 &&
    !submitting &&
    !pending;

  const submit = () => {
    if (!canSubmit || upload.status !== "ready") return;
    setSubmitting(true);
    setServerError(null);

    startTransition(async () => {
      // Upload the custom artwork now (if any). Failure is non-fatal —
      // the beat falls back to the generative CoverArt seeded from
      // wave_seed.
      const artworkUrl = await uploadArtwork();

      const result = await saveBeatAction({
        title,
        type,
        bpm: bpm ? Number(bpm) : null,
        key: key || null,
        autotune_key: null,
        loudness_lufs: loudnessLufs,
        duration_seconds: durationSeconds,
        mood,
        artist_types: artistTypes,
        co_producers: coProducers,
        description: description || null,
        has_stems: hasStems,
        audio_path: upload.path,
        artwork_url: artworkUrl,
        wave_seed: beatIdRef.current,
        server_ids: serverIds,
      });

      if (result?.error) {
        setServerError(result.error);
        setSubmitting(false);
      }
    });
  };

  /* ============================================================
     Render
     ============================================================ */

  return (
    <>
      <PageHeader
        title="Upload a beat"
        back
        onBack={cancelUpload}
        right={
          <div className="flex items-center" style={{ gap: 10 }}>
            <span
              onClick={cancelUpload}
              className="hidden sm:inline-block cursor-pointer"
            >
              <Button variant="ghost">Cancel</Button>
            </span>
            <Button
              icon="upload"
              onClick={submit}
              disabled={!canSubmit}
              size="sm"
              className="lg:!h-[38px] lg:!text-[14px]"
            >
              {submitting || pending
                ? "Uploading…"
                : upload.status === "uploading"
                  ? "Preparing…"
                  : "Upload beat"}
            </Button>
          </div>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[60px] lg:pt-[28px]">
        {/* Server-action error */}
        {serverError && (
          <div
            role="alert"
            className="t-body-s"
            style={{
              marginBottom: 20,
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--danger-surface)",
              color: "var(--danger)",
              border: "1px solid var(--danger)",
              lineHeight: 1.4,
            }}
          >
            {serverError}
          </div>
        )}

        {/* file is non-null whenever we reach this branch — the mount
            effect redirects to /library otherwise.

            Grid: stacked on mobile, asymmetric on lg+ (left column is
            ~340px wide — exactly the artwork's footprint — and the
            form takes the rest of the constrained 1440px column).
            The left column is `position: sticky` at lg+ so when the
            form on the right scrolls past the page header, the artwork
            + audio file + waveform stay in view — matches the proto
            screen 3 anchored-pack pattern. */}
        {file == null ? null : (
          <div
            className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]"
            style={{ gap: 32 }}
          >
            {/* ============================================================
                LEFT — artwork + audio file + waveform (sticky on lg+)
               ============================================================ */}
            <div
              className="flex flex-col lg:sticky lg:self-start"
              style={{ gap: 16, top: 92 }}
            >
              <input
                ref={artworkInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickArtwork}
              />
              <ArtworkBlock
                seed={beatIdRef.current}
                previewUrl={artworkPreviewUrl}
                onPick={() => artworkInputRef.current?.click()}
                onRemove={removeArtwork}
                onPlay={togglePreview}
                isCurrent={isCurrent}
                playing={isCurrent && player.playing}
              />

              <AudioFileRow
                file={file}
                upload={upload}
                onRemove={cancelUpload}
              />
            </div>

            {/* ============================================================
                RIGHT — form
               ============================================================ */}
            <div className="flex flex-col" style={{ gap: 24 }}>
              {/* AUTO-DETECTED panel */}
              <AutoDetectedPanel
                bpm={bpm}
                setBpm={setBpm}
                keyValue={key}
                setKey={setKey}
                loudnessLufs={loudnessLufs}
                durationSeconds={durationSeconds}
                analyzing={analyzing}
              />

              <Field
                label="BEAT NAME"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled track"
                hint="Pulled from the file name — edit freely."
                required
              />

              <div>
                <div className="t-mono-s" style={{ marginBottom: 10 }}>
                  TYPE
                </div>
                <Segmented<BeatType>
                  options={[
                    { value: "comp", label: "Composition" },
                    { value: "loop", label: "Loop" },
                  ]}
                  value={type}
                  onChange={setType}
                />
              </div>

              <div>
                <div className="t-mono-s" style={{ marginBottom: 10 }}>
                  PRODUCED BY · ADD CO-PRODUCERS
                </div>
                <TagInput
                  value={coProducers}
                  onChange={setCoProducers}
                  max={5}
                  suggestions={COPRODUCER_SUGGEST as string[]}
                  placeholder="Add co-producers…"
                  accent
                />
                <div
                  className="t-body-s"
                  style={{ marginTop: 8 }}
                >
                  You&rsquo;re credited by default. Add co-producers to split
                  the credit on this beat.
                </div>
              </div>

              <div>
                <div className="t-mono-s" style={{ marginBottom: 10 }}>
                  MOOD · MAX 3
                </div>
                <TagInput
                  value={mood}
                  onChange={setMood}
                  max={3}
                  suggestions={MOOD_SUGGEST as string[]}
                  placeholder="Add a mood and press Enter…"
                  accent
                />
              </div>

              <div>
                <div className="t-mono-s" style={{ marginBottom: 10 }}>
                  ARTIST TYPE · MAX 3
                </div>
                <TagInput
                  value={artistTypes}
                  onChange={setArtistTypes}
                  max={3}
                  suggestions={ARTIST_TYPE_SUGGEST as string[]}
                  placeholder="e.g. Drake, Travis Scott…"
                  accent
                />
              </div>

              <div>
                <div className="t-mono-s" style={{ marginBottom: 8 }}>
                  DESCRIPTION · OPTIONAL
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add notes for artists — vibe, reference, exclusivity, lease terms…"
                  className="w-full bg-bg-inset border border-border-2 text-fg-1 outline-none placeholder:text-fg-4 transition-all duration-fast focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--r-md)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14.5,
                    lineHeight: 1.5,
                    resize: "vertical",
                  }}
                />
              </div>

              {servers.length > 0 && (
                <AddToServers
                  servers={servers}
                  serverIds={serverIds}
                  setServerIds={setServerIds}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   ArtworkBlock — square-cropped generative CoverArt OR uploaded
   image. Hover the cover to reveal a centred play overlay that
   feeds the global PlayerDock at the bottom of the shell — the
   producer previews the beat in the same player surface artists
   will use.

   Two stop-propagation pills sit bottom-right (REMOVE + CHANGE /
   ARTWORK). They never trigger the play overlay.
   ============================================================ */

function ArtworkBlock({
  seed,
  previewUrl,
  onPick,
  onRemove,
  onPlay,
  isCurrent,
  playing,
}: {
  seed: string;
  previewUrl: string | null;
  onPick: () => void;
  onRemove: () => void;
  onPlay: () => void;
  isCurrent: boolean;
  playing: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  // Show the play button when the producer hovers OR when this beat is
  // the one currently driving the dock — same logic as Spotify's grid.
  const showButton = hovered || isCurrent;

  return (
    <div
      className="relative cursor-pointer overflow-hidden group"
      style={{
        aspectRatio: "1 / 1",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
    >
      {/* Cover surface — uploaded image (object-fit: cover crops to
          the 1:1 container) or generative CoverArt. */}
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <CoverArt seed={seed} fill radius={0} />
      )}

      {/* Subtle darken so the floating play button reads well against
          any cover. Fades in on hover / current beat. */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-fast"
        style={{
          background:
            "linear-gradient(180deg, oklch(0 0 0 / 0.12), oklch(0 0 0 / 0.32))",
          opacity: showButton ? 1 : 0,
          pointerEvents: "none",
        }}
      />

      {/* Floating PlayButton — accent circle, lives at the bottom-left
          of the cover (Spotify-style). Visual only — the wrapper handles
          the click via event bubbling, so we still get one trigger per
          tap. */}
      <div
        aria-hidden
        className="absolute transition-all duration-fast"
        style={{
          left: 16,
          bottom: 16,
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0)" : "translateY(8px)",
          pointerEvents: "none",
        }}
      >
        <PlayButton size={52} playing={isCurrent && playing} />
      </div>

      {/* REMOVE / CHANGE pills — bottom-right, stop propagation so
          clicking them doesn't also toggle playback. */}
      <div
        className="absolute flex items-center"
        style={{ right: 14, bottom: 14, gap: 8, zIndex: 2 }}
      >
        {previewUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="t-mono-s inline-flex items-center cursor-pointer"
            style={{
              height: 30,
              padding: "0 12px",
              borderRadius: "var(--r-pill)",
              background: "oklch(0 0 0 / 0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid oklch(1 0 0 / 0.2)",
              color: "oklch(1 0 0 / 0.85)",
            }}
          >
            REMOVE
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPick();
          }}
          className="t-mono-s inline-flex items-center cursor-pointer"
          style={{
            height: 30,
            padding: "0 12px",
            gap: 6,
            borderRadius: "var(--r-pill)",
            background: "oklch(0 0 0 / 0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid oklch(1 0 0 / 0.2)",
            color: "oklch(1 0 0 / 0.85)",
          }}
        >
          <Icon name="plus" size={13} />
          {previewUrl ? "CHANGE" : "ARTWORK"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   AudioFileRow — filename + status badge + delete button
   ============================================================ */

function AudioFileRow({
  file,
  upload,
  onRemove,
}: {
  file: File;
  upload: UploadState;
  onRemove: () => void;
}) {
  let badge: React.ReactNode = null;
  if (upload.status === "uploading") {
    badge = (
      <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
        UPLOADING…
      </span>
    );
  } else if (upload.status === "ready") {
    badge = (
      <span
        className="t-mono-s inline-flex items-center"
        style={{ gap: 6, color: "var(--ok)" }}
      >
        <Icon name="check" size={13} />
        READY
      </span>
    );
  } else if (upload.status === "failed") {
    badge = (
      <span className="t-mono-s" style={{ color: "var(--danger)" }}>
        FAILED · RETRY?
      </span>
    );
  }

  return (
    <div
      className="flex items-center rounded-md border border-border-1 bg-bg-1"
      style={{ padding: "10px 12px", gap: 12 }}
    >
      <div
        className="flex items-center justify-center shrink-0 text-accent-text"
        style={{
          width: 38,
          height: 38,
          borderRadius: "var(--r-sm)",
          background: "var(--accent-surface)",
        }}
      >
        <Icon name="note" size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="t-title truncate"
          style={{ fontSize: 13.5 }}
        >
          {file.name}
        </div>
        <div style={{ marginTop: 2 }}>{badge}</div>
      </div>
      <IconButton
        name="trash"
        size={34}
        iconSize={16}
        onClick={onRemove}
        label="Remove file"
      />
    </div>
  );
}

/* ============================================================
   AutoDetectedPanel — 4 cells (TEMPO / KEY / LENGTH / AUTOTUNE)
   ============================================================ */

function AutoDetectedPanel({
  bpm,
  setBpm,
  keyValue,
  setKey,
  loudnessLufs,
  durationSeconds,
  analyzing,
}: {
  bpm: string;
  setBpm: (v: string) => void;
  keyValue: string;
  setKey: (v: string) => void;
  loudnessLufs: number | null;
  durationSeconds: number | null;
  analyzing: boolean;
}) {
  return (
    <div>
      <div
        className="t-mono-s inline-flex items-center"
        style={{ marginBottom: 12, gap: 6, color: "var(--accent-text)" }}
      >
        <Icon name="zap" size={12} />
        {analyzing ? "ANALYZING TEMPO + KEY + LOUDNESS…" : "AUTO-DETECTED"}
      </div>
      <div
        className="grid grid-cols-2 xl:grid-cols-4"
        style={{ gap: 10 }}
      >
        <NumberCell
          label="TEMPO"
          value={bpm}
          onChange={setBpm}
          placeholder="—"
          suffix="BPM"
          analyzing={analyzing}
        />
        <KeyCell
          label="KEY"
          value={keyValue}
          onChange={setKey}
          analyzing={analyzing}
        />
        <LengthCell durationSeconds={durationSeconds} />
        <LoudnessCell loudnessLufs={loudnessLufs} analyzing={analyzing} />
      </div>
      <div className="t-body-s" style={{ marginTop: 10 }}>
        Tempo, key and loudness are detected automatically — adjust tempo
        or key if needed. Loudness is read-only.
      </div>
    </div>
  );
}

/* ============================================================
   Cell primitives — bg-2 elevated, border-2, with `zap` indicator
   ============================================================ */

function CellShell({
  label,
  children,
  analyzing,
  labelTooltip,
}: {
  label: string;
  children: React.ReactNode;
  /** During analysis: hide the zap (it lights up when detected
   *  arrives) and replace `children` with a pulsing skeleton. */
  analyzing?: boolean;
  /** Optional explanation popover shown when hovering the info icon
   *  next to the label. Currently only used by LoudnessCell. */
  labelTooltip?: React.ReactNode;
}) {
  return (
    <div
      className="border border-border-2 bg-bg-2"
      style={{
        padding: "12px 14px",
        borderRadius: "var(--r-md)",
      }}
    >
      <div
        className="t-mono-s inline-flex items-center"
        style={{ gap: 5, color: "var(--fg-4)" }}
      >
        {label}
        {!analyzing && (
          <Icon
            name="zap"
            size={11}
            style={{ color: "var(--accent-text)" }}
          />
        )}
        {labelTooltip && (
          <Tooltip content={labelTooltip}>
            <span
              tabIndex={0}
              role="button"
              aria-label={`What is ${label}?`}
              className="inline-flex items-center cursor-help text-fg-3 hover:text-fg-1 transition-colors"
              style={{ marginLeft: 2 }}
            >
              <Icon name="info" size={12} />
            </span>
          </Tooltip>
        )}
      </div>
      <div style={{ marginTop: 6 }}>
        {analyzing ? <CellShimmer /> : children}
      </div>
    </div>
  );
}

function CellShimmer() {
  return (
    <div
      aria-hidden
      className="animate-pulse"
      style={{
        height: 17,
        width: 58,
        borderRadius: 4,
        background: "var(--bg-3)",
      }}
    />
  );
}

function NumberCell({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  analyzing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
  analyzing?: boolean;
}) {
  return (
    <CellShell label={label} analyzing={analyzing}>
      <div className="flex items-baseline" style={{ gap: 6 }}>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={placeholder}
          className="bg-transparent outline-none text-fg-1 placeholder:text-fg-4 t-mono-lg min-w-0 flex-1"
          style={{ border: "none", padding: 0 }}
        />
        {suffix && (
          <span className="t-mono-s shrink-0" style={{ color: "var(--fg-3)" }}>
            {suffix}
          </span>
        )}
      </div>
    </CellShell>
  );
}

function KeyCell({
  label,
  value,
  onChange,
  analyzing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  analyzing?: boolean;
}) {
  return (
    <CellShell label={label} analyzing={analyzing}>
      <div className="flex items-center" style={{ gap: 6 }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none t-mono-lg cursor-pointer min-w-0 flex-1"
          style={{
            color: value ? "var(--fg-1)" : "var(--fg-4)",
            border: "none",
            appearance: "none",
            WebkitAppearance: "none",
            paddingRight: 0,
          }}
        >
          <option value="" style={{ background: "var(--bg-2)" }}>
            —
          </option>
          {KEY_OPTIONS.map((k) => (
            <option key={k} value={k} style={{ background: "var(--bg-2)" }}>
              {k}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={14}
          style={{ color: "var(--fg-3)" }}
        />
      </div>
    </CellShell>
  );
}

function LengthCell({ durationSeconds }: { durationSeconds: number | null }) {
  return (
    <CellShell label="LENGTH">
      <div className="t-mono-lg" style={{ color: "var(--fg-1)" }}>
        {fmtDuration(durationSeconds)}
      </div>
    </CellShell>
  );
}

/* ============================================================
   LoudnessCell — integrated LUFS, read-only.
   ============================================================ */

function loudnessTag(lufs: number): {
  label: string;
  color: string;
} {
  // Thresholds tuned for trap/hip-hop/R&B in 2026. Streaming targets
  // sit around -14 LUFS (Spotify) → -16 LUFS (Apple). Modern trap
  // masters push to -7 to -9 LUFS.
  if (lufs > -9) return { label: "LOUD", color: "var(--warn)" };
  if (lufs > -15) return { label: "MASTERED", color: "var(--ok)" };
  return { label: "DEMO", color: "var(--fg-3)" };
}

function LoudnessCell({
  loudnessLufs,
  analyzing,
}: {
  loudnessLufs: number | null;
  analyzing: boolean;
}) {
  const tag = loudnessLufs != null ? loudnessTag(loudnessLufs) : null;

  return (
    <CellShell
      label="LOUDNESS"
      analyzing={analyzing}
      labelTooltip={<LoudnessTooltipContent />}
    >
      <div className="flex items-baseline" style={{ gap: 6 }}>
        <span
          className="t-mono-lg"
          style={{
            color: loudnessLufs == null ? "var(--fg-4)" : "var(--fg-1)",
          }}
        >
          {loudnessLufs == null ? "—" : loudnessLufs.toFixed(1)}
        </span>
        <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
          LUFS
        </span>
        {tag && (
          <span
            className="t-mono-s"
            style={{
              marginLeft: 4,
              color: tag.color,
            }}
          >
            · {tag.label}
          </span>
        )}
      </div>
    </CellShell>
  );
}

function LoudnessTooltipContent() {
  return (
    <div>
      <div
        className="t-mono-s"
        style={{ color: "var(--accent-text)", marginBottom: 8 }}
      >
        LOUDNESS · LUFS
      </div>
      <p
        className="t-body-s"
        style={{ marginBottom: 10, lineHeight: 1.45 }}
      >
        Standardised perceived volume — what Spotify, Apple Music and
        YouTube use to normalise every track they stream.
      </p>
      <div className="flex flex-col" style={{ gap: 5 }}>
        <LoudnessLegendRow
          dotColor="var(--warn)"
          label="LOUD"
          range="> −9 LUFS"
          desc="limited, will be turned down"
        />
        <LoudnessLegendRow
          dotColor="var(--ok)"
          label="MASTERED"
          range="−9 to −15"
          desc="industry standard"
        />
        <LoudnessLegendRow
          dotColor="var(--fg-3)"
          label="DEMO"
          range="< −15"
          desc="needs a mastering pass"
        />
      </div>
    </div>
  );
}

function LoudnessLegendRow({
  dotColor,
  label,
  range,
  desc,
}: {
  dotColor: string;
  label: string;
  range: string;
  desc: string;
}) {
  return (
    <div className="t-body-s" style={{ display: "flex", gap: 7 }}>
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dotColor,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div>
        <span className="t-mono-s" style={{ color: "var(--fg-1)" }}>
          {label}
        </span>
        <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
          {" "}
          {range}
        </span>
        <span style={{ display: "block", color: "var(--fg-3)" }}>
          {desc}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   AddToServers — multi-select cards
   ============================================================ */

function AddToServers({
  servers,
  serverIds,
  setServerIds,
}: {
  servers: ServerRow[];
  serverIds: string[];
  setServerIds: (next: string[]) => void;
}) {
  const toggle = (id: string) => {
    setServerIds(
      serverIds.includes(id)
        ? serverIds.filter((x) => x !== id)
        : [...serverIds, id],
    );
  };

  return (
    <div>
      <div className="t-mono-s" style={{ marginBottom: 10 }}>
        ADD TO SERVERS · OPTIONAL
      </div>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {servers.map((s) => {
          const checked = serverIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className="flex items-center text-left border bg-bg-1 transition-colors duration-fast"
              style={{
                gap: 12,
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                borderColor: checked ? "var(--accent)" : "var(--border-1)",
                background: checked ? "var(--accent-surface)" : "var(--bg-1)",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 42, height: 42, flexShrink: 0 }}>
                <CoverArt
                  seed={s.slug}
                  hue={s.accent_hue ?? undefined}
                  fill
                  radius="var(--r-sm)"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="t-title" style={{ fontSize: 14 }}>
                  {s.name}
                </div>
                <div
                  className="t-mono-s inline-flex items-center"
                  style={{ marginTop: 3, gap: 10 }}
                >
                  <VisBadge visibility={s.visibility} size="sm" />
                </div>
              </div>
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `1.5px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
                  background: checked ? "var(--accent)" : "transparent",
                  color: "#fff",
                }}
              >
                {checked && <Icon name="check" size={14} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="t-body-s" style={{ marginTop: 8 }}>
        You can also add it to a server later from the library.
      </div>
    </div>
  );
}
