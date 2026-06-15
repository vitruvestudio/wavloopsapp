/**
 * BeatDetailPage — composition / loop detail screen.
 *
 *   ┌─ PageHeader: ◂ "Composition" ─── [+ Add to server] [Download] ┐
 *   │
 *   │  ┌─ cover 300×300 (play overlay) ─┬─ [LOOP] [MOOD]            │
 *   │  │                                 │ ## Title (display 40)    │
 *   │  │                                 │ TEMPO · KEY · LENGTH ·   │
 *   │  │                                 │ FORMAT · ADDED           │
 *   │  │                                 │ Waveform with progress   │
 *   │  └─────────────────────────────────┴──────────────────────────┘
 *   │
 *   │  [ Audience N | Edit info ]
 *   │  ─────────────────────────────────────────────────────────────
 *   │  Active tab content
 *   └─────────────────────────────────────────────────────────────────
 *
 * V1 scope:
 *   - Header + cover + meta + waveform: all hooked up.
 *   - Audience tab: 4 stat cards (plays / likes / unique listeners /
 *     in servers) + "SHARED IN" chips. The per-contact engagement
 *     table (TOP FAN / WHO LISTENED) ships when we land the artist-
 *     side gate (J6).
 *   - Edit info tab: full form wired to updateBeatAction. Save +
 *     Delete buttons in their own toolbar.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { usePlayer } from "@/components/app/PlayerContext";
import { Button } from "@/components/ui/Button";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Segmented } from "@/components/ui/Segmented";
import { Tag } from "@/components/ui/Tag";
import { TagInput } from "@/components/ui/TagInput";
import { Waveform } from "@/components/ui/Waveform";
import {
  ARTIST_TYPE_SUGGEST,
  KEY_OPTIONS,
  MOOD_SUGGEST,
} from "@/lib/audio";
import { fmtDate, fmtDuration } from "@/lib/fmt";
import { createClient } from "@/lib/supabase/client";
import type {
  BeatType,
  BeatWithStatsRow,
  ServerRow,
} from "@/lib/supabase/database.types";
import {
  deleteBeatAction,
  updateBeatAction,
  type UpdateBeatPayload,
} from "./actions";

interface BeatDetailPageProps {
  beat: BeatWithStatsRow;
  servers: ServerRow[];
}

type Tab = "audience" | "edit";

export function BeatDetailPage({ beat, servers }: BeatDetailPageProps) {
  const router = useRouter();
  const player = usePlayer();
  const supabase = React.useMemo(() => createClient(), []);

  const [tab, setTab] = React.useState<Tab>("audience");

  /* ============================================================
     Playback — sign URL on demand, route through PlayerDock.
     ============================================================ */

  const isCurrent = player.current?.id === beat.id;
  const isPlaying = isCurrent && player.playing;

  const togglePlay = async () => {
    if (isCurrent) {
      player.toggle(player.current!);
      return;
    }
    if (!beat.audio_url) return;
    const { data } = await supabase.storage
      .from("beat-audio")
      .createSignedUrl(beat.audio_url, 3600);
    if (!data) return;
    player.toggle({
      id: beat.id,
      title: beat.title,
      bpm: beat.bpm ?? 0,
      key: beat.key ?? "",
      dur: fmtDuration(beat.duration_seconds),
      img: beat.artwork_url,
      wave: beat.wave_seed,
      mood: beat.mood,
      audioUrl: data.signedUrl,
    });
  };

  const onSeek = (frac: number) => {
    // Only meaningful when this beat is the one in the dock.
    if (isCurrent) player.seek(frac);
  };

  const liveProgress = isCurrent ? player.progress : 0;

  /* ============================================================
     Download — fresh 5-min signed URL, native browser download.
     ============================================================ */

  const onDownload = async () => {
    if (!beat.audio_url) return;
    const { data } = await supabase.storage
      .from("beat-audio")
      .createSignedUrl(beat.audio_url, 300);
    if (!data) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = `${beat.title}.${(beat.audio_url.split(".").pop() ?? "wav")}`;
    a.click();
  };

  const typeLabel =
    beat.type === "comp" ? "Composition" : beat.type === "loop" ? "Loop" : "Beat";

  const formatExt = (beat.audio_url?.split(".").pop() ?? "WAV").toUpperCase();

  return (
    <>
      <PageHeader
        title={typeLabel}
        back
        onBack={() => router.push("/library")}
        right={
          <div className="flex items-center" style={{ gap: 10 }}>
            <Button variant="secondary" icon="plus" size="sm">
              <span className="hidden sm:inline">Add to server</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button icon="external" size="sm" onClick={onDownload}>
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">DL</span>
            </Button>
          </div>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[60px] lg:pt-[28px]">
        {/* ============================================================
            TOP — cover + meta + waveform
           ============================================================ */}
        <div
          className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]"
          style={{ gap: 28, marginBottom: 36 }}
        >
          {/* Cover with play overlay */}
          <CoverWithPlay
            seed={beat.wave_seed || beat.id}
            artworkUrl={beat.artwork_url}
            playing={isPlaying}
            current={isCurrent}
            onClick={togglePlay}
          />

          {/* Right column — type/mood tags + title + meta grid + waveform */}
          <div className="flex flex-col" style={{ gap: 18 }}>
            <div className="flex items-center flex-wrap" style={{ gap: 7 }}>
              {beat.type === "comp" && (
                <Tag variant="accent" icon="waves">
                  COMP
                </Tag>
              )}
              {beat.type === "loop" && (
                <Tag variant="solid" icon="repeat">
                  LOOP
                </Tag>
              )}
              {beat.mood.map((m) => (
                <Tag key={m}>{m}</Tag>
              ))}
            </div>

            <h1
              className="t-display"
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                lineHeight: 1.05,
              }}
            >
              {beat.title}
            </h1>

            {/* Meta grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, max-content))",
                columnGap: 32,
                rowGap: 10,
              }}
            >
              <MetaCell label="TEMPO" value={beat.bpm ? `${beat.bpm} BPM` : "—"} />
              <MetaCell label="KEY" value={beat.key ?? "—"} />
              <MetaCell
                label="LENGTH"
                value={fmtDuration(beat.duration_seconds)}
              />
              <MetaCell label="FORMAT" value={formatExt} />
              <MetaCell label="ADDED" value={fmtDate(beat.created_at)} />
            </div>

            {/* Waveform — full width */}
            <div className="flex flex-col" style={{ gap: 6 }}>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onSeek(
                    Math.max(
                      0,
                      Math.min(1, (e.clientX - rect.left) / rect.width),
                    ),
                  );
                }}
                className="cursor-pointer"
              >
                <Waveform
                  seed={beat.wave_seed}
                  bars={140}
                  height={56}
                  progress={liveProgress}
                  glow
                />
              </div>
              <div
                className="flex items-center justify-between"
                style={{ color: "var(--fg-4)" }}
              >
                <span className="t-mono-s">
                  {fmtDuration(
                    Math.floor(liveProgress * (beat.duration_seconds ?? 0)),
                  )}
                </span>
                <span className="t-mono-s">
                  {fmtDuration(beat.duration_seconds)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            Tabs — Audience / Edit info
           ============================================================ */}
        <Tabs value={tab} onChange={setTab} audienceCount={beat.plays_count} />

        {tab === "audience" ? (
          <AudienceTab beat={beat} servers={servers} />
        ) : (
          <EditInfoTab beat={beat} />
        )}
      </div>
    </>
  );
}

/* ============================================================
   CoverWithPlay — large 280×280 cover with centred play/pause
   button overlay.
   ============================================================ */

function CoverWithPlay({
  seed,
  artworkUrl,
  playing,
  current,
  onClick,
}: {
  seed: string;
  artworkUrl: string | null;
  playing: boolean;
  current: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const show = hovered || current;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="relative cursor-pointer overflow-hidden"
      style={{
        aspectRatio: "1 / 1",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-1)",
      }}
    >
      <CoverArt
        seed={seed}
        src={artworkUrl ?? undefined}
        fill
        radius={0}
      />

      {/* Scrim */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-fast"
        style={{
          background: "oklch(0 0 0 / 0.35)",
          opacity: show ? 1 : 0,
          pointerEvents: "none",
        }}
      />

      {/* Centred accent play button */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center transition-all duration-fast"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(0.92)",
          pointerEvents: "none",
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            boxShadow: "0 8px 28px -8px var(--accent-glow)",
          }}
        >
          <Icon name={playing ? "pause" : "play"} size={24} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MetaCell — label/value pair used in the meta grid.
   ============================================================ */

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="t-mono-s" style={{ color: "var(--fg-4)" }}>
        {label}
      </div>
      <div
        className="t-mono-lg"
        style={{ marginTop: 4, color: "var(--fg-1)" }}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   Tabs
   ============================================================ */

function Tabs({
  value,
  onChange,
  audienceCount,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
  audienceCount: number;
}) {
  const items: Array<{ value: Tab; label: React.ReactNode }> = [
    {
      value: "audience",
      label: (
        <>
          Audience
          <span
            className="t-mono-s"
            style={{ marginLeft: 6, color: "var(--fg-4)" }}
          >
            {audienceCount}
          </span>
        </>
      ),
    },
    { value: "edit", label: "Edit info" },
  ];

  return (
    <div
      className="border-b border-border-1 flex"
      style={{ gap: 22, marginBottom: 22 }}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className="cursor-pointer border-0 bg-transparent transition-colors"
            style={{
              padding: "10px 0",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--accent-text)" : "var(--fg-3)",
              borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   AudienceTab — stat cards + SHARED IN chips
   ============================================================ */

function AudienceTab({
  beat,
  servers,
}: {
  beat: BeatWithStatsRow;
  servers: ServerRow[];
}) {
  return (
    <div className="flex flex-col" style={{ gap: 24 }}>
      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{ gap: 14 }}
      >
        <StatCard
          icon="play"
          label="TOTAL PLAYS"
          value={beat.plays_count}
        />
        <StatCard
          icon="heart"
          label="TOTAL LIKES"
          value={beat.likes_count}
        />
        <StatCard
          icon="users"
          label="UNIQUE LISTENERS"
          value={0}
          hint="V1.1"
        />
        <StatCard
          icon="server"
          label="IN SERVERS"
          value={beat.in_servers_count}
        />
      </div>

      {servers.length > 0 && (
        <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
          <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
            SHARED IN
          </span>
          {servers.map((s) => (
            <Link
              key={s.id}
              href={`/servers/${s.slug}`}
              className="inline-flex"
            >
              <Tag variant="solid" icon="server">
                {s.name.toUpperCase()}
              </Tag>
            </Link>
          ))}
        </div>
      )}

      {/* Top fan / Who listened — comes with J6 once we have artist-side
          listens + likes data. */}
      <div
        className="t-body"
        style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--fg-3)",
          background: "var(--bg-1)",
          border: "1px dashed var(--border-1)",
          borderRadius: "var(--r-md)",
        }}
      >
        Top fan + per-contact engagement land when the artist gate ships
        (J6) — they need real listens/likes data flowing in first.
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: "play" | "heart" | "users" | "server";
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div
      className="border border-border-1 bg-bg-1"
      style={{ padding: "18px 20px", borderRadius: "var(--r-lg)" }}
    >
      <div
        className="t-mono-s inline-flex items-center"
        style={{ gap: 8, color: "var(--fg-3)" }}
      >
        <Icon name={icon} size={14} />
        {label}
        {hint && (
          <span style={{ color: "var(--fg-4)" }}>· {hint}</span>
        )}
      </div>
      <div
        className="t-h1"
        style={{ fontSize: 32, marginTop: 10, lineHeight: 1 }}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   EditInfoTab — form to update beat metadata
   ============================================================ */

function EditInfoTab({ beat }: { beat: BeatWithStatsRow }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(beat.title);
  const [type, setType] = React.useState<BeatType>(beat.type ?? "comp");
  const [bpm, setBpm] = React.useState(beat.bpm ? String(beat.bpm) : "");
  const [musicKey, setMusicKey] = React.useState(beat.key ?? "");
  const [mood, setMood] = React.useState<string[]>(beat.mood);
  const [artistTypes, setArtistTypes] = React.useState<string[]>(
    beat.artist_types,
  );
  const [description, setDescription] = React.useState(beat.description ?? "");

  const [savePending, startSaveTransition] = React.useTransition();
  const [deletePending, startDeleteTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const save = () => {
    setServerError(null);
    setSaved(false);
    startSaveTransition(async () => {
      const payload: UpdateBeatPayload = {
        id: beat.id,
        title,
        type,
        bpm: bpm ? Number(bpm) : null,
        key: musicKey || null,
        mood,
        artist_types: artistTypes,
        description: description || null,
      };
      const result = await updateBeatAction(payload);
      if (result.error) setServerError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  };

  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setServerError(null);
    startDeleteTransition(async () => {
      const result = await deleteBeatAction(beat.id);
      if (result?.error) {
        setServerError(result.error);
        setConfirmDelete(false);
      }
      // success path: action redirects to /library.
    });
  };

  return (
    <div className="flex flex-col" style={{ gap: 22 }}>
      {serverError && (
        <div
          role="alert"
          className="t-body-s"
          style={{
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            background: "var(--danger-surface)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
          }}
        >
          {serverError}
        </div>
      )}
      {saved && !serverError && (
        <div
          role="status"
          className="t-body-s"
          style={{
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            background: "var(--accent-surface)",
            color: "var(--accent-text)",
            border: "1px solid var(--accent)",
          }}
        >
          Changes saved.
        </div>
      )}

      {/* TEMPO + KEY row */}
      <div
        className="grid grid-cols-2"
        style={{ gap: 16, maxWidth: 520 }}
      >
        <div>
          <div className="t-mono-s" style={{ marginBottom: 8 }}>
            TEMPO
          </div>
          <div
            className="flex items-center bg-bg-inset border border-border-2 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)] transition-all"
            style={{
              height: 46,
              padding: "0 14px",
              gap: 8,
              borderRadius: "var(--r-md)",
            }}
          >
            <input
              inputMode="numeric"
              value={bpm}
              onChange={(e) => setBpm(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="—"
              className="flex-1 min-w-0 bg-transparent outline-none text-fg-1 placeholder:text-fg-4"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 600,
              }}
            />
            <span
              className="t-mono-s shrink-0"
              style={{ color: "var(--fg-3)" }}
            >
              BPM
            </span>
          </div>
        </div>
        <div>
          <div className="t-mono-s" style={{ marginBottom: 8 }}>
            KEY
          </div>
          <select
            value={musicKey}
            onChange={(e) => setMusicKey(e.target.value)}
            className="w-full bg-bg-inset border border-border-2 outline-none focus:border-accent text-fg-1"
            style={{
              height: 46,
              padding: "0 14px",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 600,
              appearance: "none",
            }}
          >
            <option value="" style={{ background: "var(--bg-2)" }}>
              —
            </option>
            {KEY_OPTIONS.map((k) => (
              <option
                key={k}
                value={k}
                style={{ background: "var(--bg-2)" }}
              >
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BEAT NAME */}
      <div>
        <div className="t-mono-s" style={{ marginBottom: 8 }}>
          BEAT NAME
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-bg-inset border border-border-2 outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] text-fg-1 transition-all"
          style={{
            height: 46,
            padding: "0 14px",
            borderRadius: "var(--r-md)",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 600,
          }}
        />
      </div>

      {/* TYPE */}
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

      {/* MOOD */}
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

      {/* ARTIST TYPE */}
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

      {/* DESCRIPTION */}
      <div>
        <div className="t-mono-s" style={{ marginBottom: 8 }}>
          DESCRIPTION
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Notes for artists…"
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

      {/* Footer toolbar — Save (left) + Delete (right) */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: 8 }}
      >
        <Button
          icon="check"
          onClick={save}
          disabled={savePending || deletePending}
        >
          {savePending ? "Saving…" : "Save changes"}
        </Button>
        <div className="flex items-center" style={{ gap: 10 }}>
          {confirmDelete && (
            <span
              className="t-body-s"
              style={{ color: "var(--danger)" }}
            >
              Click again to confirm
            </span>
          )}
          <IconButton
            name="trash"
            size={40}
            iconSize={18}
            onClick={onDelete}
            label="Delete beat"
            className={confirmDelete ? "text-danger" : ""}
          />
        </div>
      </div>
    </div>
  );
}
