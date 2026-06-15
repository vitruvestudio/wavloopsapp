/**
 * CreateServerPage — client form for /servers/new.
 *
 *   ┌─ PageHeader: ◂ Create a server ── [ Cancel ] [ Create server ] ┐
 *   │
 *   │  ┌─ form (left) ───────────────┐  ┌─ live preview (sticky) ─┐
 *   │  │ SERVER NAME (Field)          │  │ LIVE PREVIEW (kicker)  │
 *   │  │ wavloops.co/s/<auto-slug>    │  │                        │
 *   │  │ STYLE / MOOD (Field)         │  │ <ServerCard mockup>    │
 *   │  │ DESCRIPTION (textarea)       │  │                        │
 *   │  │ ARTIST TYPES (TagInput max 5)│  │ helper: "This is how   │
 *   │  │ SERVER ARTWORK (Segmented)   │  │  your server appears…" │
 *   │  │   → if Color: hue chips      │  └────────────────────────┘
 *   │  │ VISIBILITY (RadioCard ×2)    │
 *   │  │ ADD BEATS FROM YOUR LIBRARY  │
 *   │  │   "X SELECTED" + search +    │
 *   │  │   BeatRow list w/ checkbox   │
 *   │  └──────────────────────────────┘
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Submit flow:
 *   - Generate slug client-side as the producer types (just for the
 *     URL hint). Server action regenerates + handles collisions.
 *   - On Submit → createServerAction(payload) → on success redirect to
 *     /dashboard. The error state surfaces inline above the footer.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BeatRow } from "@/components/app/BeatRow";
import { PageHeader } from "@/components/app/PageHeader";
import { ServerCard } from "@/components/app/ServerCard";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { RadioCard } from "@/components/ui/RadioCard";
import { Segmented } from "@/components/ui/Segmented";
import { TagInput } from "@/components/ui/TagInput";
import { ARTIST_TYPE_SUGGEST } from "@/lib/audio";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/client";
import { createServerAction } from "./actions";
import type {
  ArtworkMode,
  BeatWithStatsRow,
  ServerRow,
  Visibility,
} from "@/lib/supabase/database.types";

interface CreateServerPageProps {
  userId: string;
  beats: BeatWithStatsRow[];
}

/** 8-stop hue palette for the Color artwork mode — even spread around
 *  the OKLCH wheel so the chips read as distinct without looking
 *  garish. The default 270 is the Wavloops brand accent. */
const HUE_PRESETS = [0, 30, 60, 120, 180, 240, 280, 330] as const;

export function CreateServerPage({
  userId,
  beats,
}: CreateServerPageProps) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  /* ============================================================
     Form state
     ============================================================ */

  const [name, setName] = React.useState("");
  const [styleText, setStyleText] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [artistTypes, setArtistTypes] = React.useState<string[]>([]);
  const [artworkMode, setArtworkMode] = React.useState<ArtworkMode>("auto");
  const [accentHue, setAccentHue] = React.useState<number>(270);
  const [visibility, setVisibility] = React.useState<Visibility>("private");
  const [beatIds, setBeatIds] = React.useState<string[]>([]);
  const [beatSearch, setBeatSearch] = React.useState("");

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  /* ============================================================
     Custom artwork upload (when artworkMode === "image").
     Uploaded to the `server-covers` bucket on submit. The path
     prefix is the user's auth.uid() so the bucket's RLS lets the
     client write directly without a server roundtrip.
     ============================================================ */

  const serverIdRef = React.useRef<string>(crypto.randomUUID());
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
      setServerError("Artwork must be an image (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setServerError("Image is over 5 MB. Compress and try again.");
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
    if (!artworkFile || !userId) return null;
    const ext = (artworkFile.name.split(".").pop() ?? "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${serverIdRef.current}.${ext}`;
    const { error } = await supabase.storage
      .from("server-covers")
      .upload(path, artworkFile, {
        contentType: artworkFile.type,
        upsert: true,
      });
    if (error) {
      console.warn("[create-server] artwork upload failed", error);
      return null;
    }
    const { data } = supabase.storage
      .from("server-covers")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  /* ============================================================
     Derived values
     ============================================================ */

  const slug = React.useMemo(() => slugify(name) || "untitled", [name]);

  /** A faux ServerRow built from the live form state — fed to the
   *  preview ServerCard so the producer sees the result as they type. */
  const previewServer = React.useMemo<ServerRow>(
    () => ({
      id: "preview",
      owner_id: "preview",
      name: name.trim() || "Server name",
      slug,
      style_text: styleText.trim() || null,
      description: description.trim() || null,
      artist_types: artistTypes,
      artwork_mode: artworkMode,
      accent_hue: artworkMode === "color" ? accentHue : null,
      artwork_image_url:
        artworkMode === "image" ? artworkPreviewUrl : null,
      visibility,
      created_at: "",
      updated_at: "",
    }),
    [
      name,
      slug,
      styleText,
      description,
      artistTypes,
      artworkMode,
      accentHue,
      artworkPreviewUrl,
      visibility,
    ],
  );

  /** Covers for the mosaic — actual beat artwork URL when set, else
   *  a generative gradient seeded by the beat's wave_seed. Ordered by
   *  the producer's pick order. */
  const selectedBeatCovers = React.useMemo(
    () =>
      beatIds
        .map((id) => {
          const b = beats.find((x) => x.id === id);
          if (!b) return null;
          return { seed: b.wave_seed, src: b.artwork_url };
        })
        .filter((c): c is { seed: string; src: string | null } => c !== null),
    [beatIds, beats],
  );

  const filteredBeats = React.useMemo(() => {
    const q = beatSearch.trim().toLowerCase();
    if (!q) return beats;
    return beats.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.mood.some((m) => m.toLowerCase().includes(q)) ||
        (b.key?.toLowerCase().includes(q) ?? false),
    );
  }, [beats, beatSearch]);

  const toggleBeat = (id: string) => {
    setBeatIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  /* ============================================================
     Submit
     ============================================================ */

  const canSubmit = name.trim().length > 0 && !pending;

  const submit = () => {
    if (!canSubmit) return;
    setServerError(null);
    startTransition(async () => {
      // Upload the custom image first (if any) so the action gets a
      // ready-to-store URL.
      let artworkImageUrl: string | null = null;
      if (artworkMode === "image" && artworkFile) {
        artworkImageUrl = await uploadArtwork();
        if (!artworkImageUrl) {
          setServerError("Failed to upload artwork. Try again.");
          return;
        }
      }

      const result = await createServerAction({
        name,
        style_text: styleText.trim() || null,
        description: description.trim() || null,
        artist_types: artistTypes,
        artwork_mode: artworkMode,
        accent_hue: artworkMode === "color" ? accentHue : null,
        artwork_image_url: artworkImageUrl,
        visibility,
        beat_ids: beatIds,
      });
      if (result?.error) setServerError(result.error);
    });
  };

  const cancel = () => router.push("/dashboard");
  const now = React.useMemo(() => new Date(), []);

  return (
    <>
      <PageHeader
        title="Create a server"
        back
        onBack={cancel}
        right={
          <div className="flex items-center" style={{ gap: 10 }}>
            <span
              onClick={cancel}
              className="hidden sm:inline-block cursor-pointer"
            >
              <Button variant="ghost">Cancel</Button>
            </span>
            <Button
              icon="plus"
              onClick={submit}
              disabled={!canSubmit}
              size="sm"
              className="lg:!h-[38px] lg:!text-[14px]"
            >
              {pending ? "Creating…" : "Create server"}
            </Button>
          </div>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[60px] lg:pt-[28px]">
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

        <div
          className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]"
          style={{ gap: 32 }}
        >
          {/* ============================================================
              FORM (DOM order 1 → mobile renders first)
              On lg+, `order-2` pushes it into the second grid column.
             ============================================================ */}
          <div
            className="flex flex-col lg:order-2"
            style={{ gap: 24 }}
          >
            <div>
              <Field
                label="SERVER NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Atlanta Nights"
                hint={
                  <span
                    className="t-mono-s"
                    style={{ color: "var(--fg-4)" }}
                  >
                    wavloops.co/s/{slug}
                  </span>
                }
                required
              />
            </div>

            <Field
              label="STYLE / MOOD"
              value={styleText}
              onChange={(e) => setStyleText(e.target.value)}
              placeholder="e.g. Trap · Dark"
            />

            <div>
              <div className="t-mono-s" style={{ marginBottom: 8 }}>
                DESCRIPTION · OPTIONAL
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell artists what this pack is — vibe, exclusivity, lease terms…"
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

            <div>
              <div className="t-mono-s" style={{ marginBottom: 10 }}>
                ARTIST TYPES · WHO IT&rsquo;S FOR
              </div>
              <TagInput
                value={artistTypes}
                onChange={setArtistTypes}
                max={5}
                suggestions={ARTIST_TYPE_SUGGEST as string[]}
                placeholder="e.g. Drake, Travis Scott…"
                accent
              />
            </div>

            {/* Artwork */}
            <div>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 10 }}
              >
                <span className="t-mono-s">SERVER ARTWORK</span>
                <Segmented<ArtworkMode>
                  size="sm"
                  options={[
                    { value: "auto", label: "Auto" },
                    { value: "color", label: "Color" },
                    { value: "image", label: "Image" },
                  ]}
                  value={artworkMode}
                  onChange={setArtworkMode}
                />
              </div>
              {artworkMode === "auto" && (
                <div
                  className="border border-border-1 t-body-s"
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--r-md)",
                    color: "var(--fg-3)",
                  }}
                >
                  A mosaic of your selected beats&rsquo; covers is used
                  automatically. Add beats below to fill it in.
                </div>
              )}
              {artworkMode === "color" && (
                <HueChips value={accentHue} onChange={setAccentHue} />
              )}
              {artworkMode === "image" && (
                <ImagePicker
                  inputRef={artworkInputRef}
                  previewUrl={artworkPreviewUrl}
                  onPick={onPickArtwork}
                  onClickPick={() => artworkInputRef.current?.click()}
                  onRemove={removeArtwork}
                />
              )}
            </div>

            {/* Visibility */}
            <div>
              <div className="t-mono-s" style={{ marginBottom: 10 }}>
                VISIBILITY
              </div>
              <div
                role="radiogroup"
                aria-label="Server visibility"
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{ gap: 12 }}
              >
                <RadioCard
                  selected={visibility === "private"}
                  onSelect={() => setVisibility("private")}
                  icon="lock"
                  title="Private"
                  description="Entry on request: artists submit email + a social. You approve each one manually, then they get an access link by email."
                  features="MANUAL APPROVAL · ACCESS BY EMAIL LINK"
                />
                <RadioCard
                  selected={visibility === "public"}
                  onSelect={() => setVisibility("public")}
                  icon="globe"
                  title="Public"
                  description="Anyone with the link enters with their email — confirmed by mail for instant access. Social handle optional."
                  features="EMAIL CONFIRMATION · INSTANT ACCESS"
                />
              </div>
            </div>

            {/* Add beats from library */}
            <div>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 12 }}
              >
                <span className="t-mono-s">
                  ADD BEATS FROM YOUR LIBRARY
                </span>
                <span
                  className="t-mono-s"
                  style={{
                    color:
                      beatIds.length > 0
                        ? "var(--accent-text)"
                        : "var(--fg-4)",
                  }}
                >
                  {beatIds.length} SELECTED
                </span>
              </div>

              {beats.length === 0 ? (
                <div
                  className="border border-border-1 bg-bg-1 t-body-s"
                  style={{
                    padding: "18px 20px",
                    borderRadius: "var(--r-md)",
                    color: "var(--fg-3)",
                    textAlign: "center",
                  }}
                >
                  Your library is empty. Upload a beat first to attach it
                  here, or create the server now and add beats later.
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: 10 }}>
                  <div
                    className="flex items-center bg-bg-inset border border-border-2 transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
                    style={{
                      height: 42,
                      padding: "0 14px",
                      gap: 10,
                      borderRadius: "var(--r-md)",
                    }}
                  >
                    <Icon name="search" size={16} className="text-fg-3" />
                    <input
                      value={beatSearch}
                      onChange={(e) => setBeatSearch(e.target.value)}
                      placeholder="Search your beats by name, mood or key…"
                      className="flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4 min-w-0"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div
                    className="border border-border-1 bg-bg-1 overflow-y-auto"
                    style={{
                      borderRadius: "var(--r-md)",
                      padding: 6,
                      maxHeight: 360,
                    }}
                  >
                    {filteredBeats.length === 0 ? (
                      <div
                        className="t-body-s"
                        style={{
                          padding: "16px 12px",
                          textAlign: "center",
                          color: "var(--fg-3)",
                        }}
                      >
                        No beats match &ldquo;{beatSearch}&rdquo;.
                      </div>
                    ) : (
                      <div className="flex flex-col" style={{ gap: 2 }}>
                        {filteredBeats.map((b) => (
                          <BeatRow
                            key={b.id}
                            beat={b}
                            now={now}
                            checkbox
                            checked={beatIds.includes(b.id)}
                            onCheck={() => toggleBeat(b.id)}
                            showAdded={false}
                            showServers={false}
                            showEngagement={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================
              LIVE PREVIEW — DOM order 2 (mobile renders below the form)
              On lg+, `order-1` puts it in the first grid column (left)
              and `sticky` anchors it just below the PageHeader so it
              stays visible while the producer scrolls the form. Mirrors
              the Upload Beat page's left-column-sticky pattern.
             ============================================================ */}
          <div
            className="lg:order-1 lg:sticky lg:self-start"
            style={{ top: 92 }}
          >
            <div
              className="t-mono-s inline-flex items-center"
              style={{
                marginBottom: 12,
                gap: 6,
                color: "var(--accent-text)",
              }}
            >
              <Icon name="eye" size={12} />
              LIVE PREVIEW
            </div>

            <ServerCard
              server={previewServer}
              stats={{
                beats: beatIds.length,
                contacts: 0,
                plays: 0,
              }}
              beatCovers={selectedBeatCovers}
            />

            <p className="t-body-s" style={{ marginTop: 14 }}>
              This is how your server appears to artists who open the
              link.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   ImagePicker — file picker UI for the Image artwork mode
   ============================================================ */

function ImagePicker({
  inputRef,
  previewUrl,
  onPick,
  onClickPick,
  onRemove,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  previewUrl: string | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClickPick: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="border border-border-1 bg-bg-1"
      style={{ padding: 14, borderRadius: "var(--r-md)" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />
      {previewUrl ? (
        <div className="flex items-center" style={{ gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: "var(--r-sm)",
              flexShrink: 0,
            }}
          />
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: 8 }}>
            <span
              className="t-mono-s"
              style={{ color: "var(--accent-text)" }}
            >
              CUSTOM ARTWORK SET
            </span>
            <div className="flex items-center" style={{ gap: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClickPick}
              >
                Replace
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onClickPick}
          className="flex flex-col items-center justify-center w-full cursor-pointer transition-colors duration-fast hover:bg-bg-2"
          style={{
            padding: "30px 16px",
            borderRadius: "var(--r-sm)",
            border: "1.5px dashed var(--border-2)",
            background: "transparent",
          }}
        >
          <div
            className="flex items-center justify-center text-accent-text"
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--r-md)",
              background: "var(--accent-surface)",
              marginBottom: 10,
            }}
          >
            <Icon name="upload" size={20} />
          </div>
          <span className="t-title" style={{ fontSize: 14 }}>
            Click to upload artwork
          </span>
          <span
            className="t-mono-s"
            style={{ marginTop: 4, color: "var(--fg-4)" }}
          >
            JPG, PNG, WEBP · MAX 5 MB
          </span>
        </button>
      )}
    </div>
  );
}

/* ============================================================
   HueChips — 8 OKLCH presets for the Color artwork mode
   ============================================================ */

function HueChips({
  value,
  onChange,
}: {
  value: number;
  onChange: (h: number) => void;
}) {
  return (
    <div
      className="border border-border-1 bg-bg-1"
      style={{
        padding: 12,
        borderRadius: "var(--r-md)",
      }}
    >
      <div className="t-mono-s" style={{ marginBottom: 10 }}>
        ACCENT HUE
      </div>
      <div className="flex flex-wrap" style={{ gap: 10 }}>
        {HUE_PRESETS.map((h) => {
          const selected = value === h;
          return (
            <button
              key={h}
              type="button"
              aria-label={`Hue ${h}`}
              aria-pressed={selected}
              onClick={() => onChange(h)}
              className="cursor-pointer transition-all duration-fast"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `oklch(0.55 0.18 ${h})`,
                border: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
                boxShadow: selected
                  ? "0 0 0 3px var(--accent-ring)"
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
