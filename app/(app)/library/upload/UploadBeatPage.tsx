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
import { Segmented } from "@/components/ui/Segmented";
import { TagInput } from "@/components/ui/TagInput";
import { VisBadge } from "@/components/ui/VisBadge";
import { Waveform } from "@/components/ui/Waveform";
import {
  ARTIST_TYPE_SUGGEST,
  COPRODUCER_SUGGEST,
  KEY_OPTIONS,
  MOOD_SUGGEST,
  decodeFilenameTitle,
  getAudioDurationSeconds,
} from "@/lib/audio";
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
  const [autotuneKey, setAutotuneKey] = React.useState<string>("");
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
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    router.push("/library");
  };

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
      const result = await saveBeatAction({
        title,
        type,
        bpm: bpm ? Number(bpm) : null,
        key: key || null,
        autotune_key: autotuneKey || null,
        duration_seconds: durationSeconds,
        mood,
        artist_types: artistTypes,
        co_producers: coProducers,
        description: description || null,
        has_stems: hasStems,
        audio_path: upload.path,
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
            effect redirects to /library otherwise. */}
        {file == null ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 32 }}>
            {/* ============================================================
                LEFT — artwork + audio file + waveform
               ============================================================ */}
            <div className="flex flex-col" style={{ gap: 16 }}>
              <ArtworkBlock seed={beatIdRef.current} />

              <AudioFileRow
                file={file}
                upload={upload}
                onRemove={cancelUpload}
              />

              <div
                className="rounded-md border border-border-1 bg-bg-1"
                style={{ padding: "14px 16px" }}
              >
                <Waveform
                  seed={beatIdRef.current}
                  bars={90}
                  height={48}
                  glow
                />
              </div>
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
                autotuneKey={autotuneKey}
                setAutotuneKey={setAutotuneKey}
                durationSeconds={durationSeconds}
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
   ArtworkBlock — big generative CoverArt with overlay action
   ============================================================ */

function ArtworkBlock({ seed }: { seed: string }) {
  return (
    <div className="relative" style={{ aspectRatio: "1 / 1" }}>
      <CoverArt seed={seed} fill radius="var(--r-lg)" />
      <button
        type="button"
        disabled
        title="Custom artwork upload — coming soon"
        className="absolute t-mono-s inline-flex items-center cursor-not-allowed"
        style={{
          right: 14,
          bottom: 14,
          height: 30,
          padding: "0 12px",
          gap: 6,
          borderRadius: "var(--r-pill)",
          background: "oklch(0 0 0 / 0.5)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: "1px solid oklch(1 0 0 / 0.2)",
          color: "oklch(1 0 0 / 0.85)",
          opacity: 0.65,
        }}
      >
        <Icon name="plus" size={13} />
        ARTWORK
      </button>
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
  autotuneKey,
  setAutotuneKey,
  durationSeconds,
}: {
  bpm: string;
  setBpm: (v: string) => void;
  keyValue: string;
  setKey: (v: string) => void;
  autotuneKey: string;
  setAutotuneKey: (v: string) => void;
  durationSeconds: number | null;
}) {
  return (
    <div>
      <div
        className="t-mono-s inline-flex items-center"
        style={{ marginBottom: 12, gap: 6, color: "var(--accent-text)" }}
      >
        AUTO-DETECTED
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        <NumberCell
          label="TEMPO"
          value={bpm}
          onChange={setBpm}
          placeholder="—"
          suffix="BPM"
        />
        <KeyCell
          label="KEY"
          value={keyValue}
          onChange={setKey}
        />
        <div
          className="rounded-md border border-border-1 bg-bg-1"
          style={{ padding: "12px 14px" }}
        >
          <div className="t-mono-s" style={{ color: "var(--fg-4)" }}>
            LENGTH
          </div>
          <div
            className="t-mono-lg"
            style={{ marginTop: 6, color: "var(--fg-1)" }}
          >
            {fmtDuration(durationSeconds)}
          </div>
        </div>
        <KeyCell
          label="AUTOTUNE KEY"
          value={autotuneKey}
          onChange={setAutotuneKey}
        />
      </div>
      <div className="t-body-s" style={{ marginTop: 10 }}>
        Tempo &amp; key are detected automatically — adjust if needed.
        Autotune key is suggested to match the beat for vocalists.
      </div>
    </div>
  );
}

function NumberCell({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
}) {
  return (
    <div
      className="rounded-md border border-border-1 bg-bg-1"
      style={{ padding: "12px 14px" }}
    >
      <div className="t-mono-s" style={{ color: "var(--fg-4)" }}>
        {label}
      </div>
      <div
        className="flex items-baseline"
        style={{ marginTop: 6, gap: 6 }}
      >
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={placeholder}
          className="bg-transparent outline-none text-fg-1 placeholder:text-fg-4 t-mono-lg"
          style={{
            width: 80,
            border: "none",
            padding: 0,
          }}
        />
        {suffix && (
          <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function KeyCell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="rounded-md border border-border-1 bg-bg-1"
      style={{ padding: "12px 14px" }}
    >
      <div className="t-mono-s" style={{ color: "var(--fg-4)" }}>
        {label}
      </div>
      <div
        className="flex items-center"
        style={{ marginTop: 6, gap: 6 }}
      >
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none t-mono-lg cursor-pointer"
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
