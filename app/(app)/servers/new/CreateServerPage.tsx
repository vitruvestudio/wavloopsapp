/**
 * Server form — used by both /servers/new (create) AND
 * /servers/[slug]/edit (edit). The mode is decided by whether
 * `existing` is passed in: if it is, the form pre-fills, the title
 * becomes "Edit <name>", the submit button says "Save changes", and
 * submission calls `updateServerAction` instead of
 * `createServerAction`.
 *
 * Why one component handles both: every field, every layout cell,
 * every preview interaction is identical between create and edit.
 * Splitting them would force every visual tweak to be made twice.
 *
 * Slug stability: in edit mode the slug is never regenerated, even
 * on rename — shared artist URLs (wavloops.co/s/<slug>) stay valid.
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
import { UpgradeRequiredModal } from "@/components/billing/UpgradeRequiredModal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { RadioCard } from "@/components/ui/RadioCard";
import { Segmented } from "@/components/ui/Segmented";
import { TagInput } from "@/components/ui/TagInput";
import { ARTIST_TYPE_SUGGEST, MOOD_SUGGEST } from "@/lib/audio";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/client";
import { createServerAction, updateServerAction } from "./actions";
import type {
  ArtworkMode,
  BeatWithStatsRow,
  ServerRow,
  ServerWithStatsRow,
  Visibility,
} from "@/lib/supabase/database.types";

interface CreateServerPageProps {
  userId: string;
  beats: BeatWithStatsRow[];
  /** When set, the form operates in edit mode: pre-fills every
   *  field, switches the title + submit label, and calls
   *  `updateServerAction` on submit. */
  existing?: ServerWithStatsRow;
  /** Beat ids already attached to the server being edited. Used to
   *  pre-check the multi-select. Order is preserved as the new
   *  position order. */
  existingBeatIds?: string[];
}

/** 8-stop hue palette for the Color artwork mode — even spread around
 *  the OKLCH wheel so the chips read as distinct without looking
 *  garish. The default 270 is the Wavloops brand accent. */
const HUE_PRESETS = [0, 30, 60, 120, 180, 240, 280, 330] as const;

export function CreateServerPage({
  userId,
  beats,
  existing,
  existingBeatIds,
}: CreateServerPageProps) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const mode: "create" | "edit" = existing ? "edit" : "create";

  /* ============================================================
     Form state — initialised from `existing` when editing,
     otherwise from defaults.
     ============================================================ */

  const [name, setName] = React.useState(existing?.name ?? "");
  const [styleTags, setStyleTags] = React.useState<string[]>(() =>
    splitStyleText(existing?.style_text),
  );
  const [description, setDescription] = React.useState(
    existing?.description ?? "",
  );
  const [artistTypes, setArtistTypes] = React.useState<string[]>(
    existing?.artist_types ?? [],
  );
  const [artworkMode, setArtworkMode] = React.useState<ArtworkMode>(
    existing?.artwork_mode ?? "auto",
  );
  const [accentHue, setAccentHue] = React.useState<number>(
    existing?.accent_hue ?? 270,
  );
  const [visibility, setVisibility] = React.useState<Visibility>(
    existing?.visibility ?? "private",
  );
  const [downloadsAllowed, setDownloadsAllowed] = React.useState<boolean>(
    existing?.downloads_allowed ?? false,
  );
  const [forceArtworkOnBeats, setForceArtworkOnBeats] =
    React.useState<boolean>(existing?.force_artwork_on_beats ?? false);
  const [beatIds, setBeatIds] = React.useState<string[]>(
    existingBeatIds ?? [],
  );
  const [beatSearch, setBeatSearch] = React.useState("");

  const [serverError, setServerError] = React.useState<string | null>(null);
  /** When the action fails with a billing-gate error, we swap the
   *  red inline banner for the UpgradeRequiredModal — same info,
   *  much better conversion: the producer sees exactly which plan
   *  unlocks what they tried, one click to Stripe Checkout. */
  const [upgradeCtx, setUpgradeCtx] = React.useState<{
    plan: import("@/lib/billing/plans").PlanKey;
    reason: string;
  } | null>(null);
  const [pending, startTransition] = React.useTransition();

  /** Frozen at mount — used at submit time to detect whether the
   *  producer kept the existing artwork untouched (no upload needed). */
  const originalArtworkUrl = React.useRef<string | null>(
    existing?.artwork_image_url ?? null,
  ).current;

  /* ============================================================
     Custom artwork upload (when artworkMode === "image").
     Uploaded to the `server-covers` bucket on submit. The path
     prefix is the user's auth.uid() so the bucket's RLS lets the
     client write directly without a server roundtrip.
     ============================================================ */

  // Random UUID per submission — used as the storage filename for
  // any newly uploaded image. In edit mode we always upload to a
  // fresh path rather than overwrite the previous one (avoids cache
  // staleness on CDNs that already cached the old URL).
  const newArtworkUploadIdRef = React.useRef<string>(crypto.randomUUID());
  const [artworkFile, setArtworkFile] = React.useState<File | null>(null);
  // In edit mode, pre-populate the preview with the existing URL so
  // the producer sees their current artwork rendered in the picker.
  const [artworkPreviewUrl, setArtworkPreviewUrl] = React.useState<
    string | null
  >(
    existing?.artwork_mode === "image"
      ? (existing.artwork_image_url ?? null)
      : null,
  );
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
    const path = `${userId}/${newArtworkUploadIdRef.current}.${ext}`;
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

  /** Resolves the final `artwork_image_url` to persist. */
  const resolveArtworkUrl = async (): Promise<
    { url: string | null; error?: string } | null
  > => {
    if (artworkMode !== "image") return { url: null };
    if (artworkFile) {
      const url = await uploadArtwork();
      if (!url) return { url: null, error: "Failed to upload artwork." };
      return { url };
    }
    // No new file picked. If the preview still shows the existing
    // URL, the producer kept the original — reuse it. If the preview
    // is empty, they removed the artwork.
    if (artworkPreviewUrl && artworkPreviewUrl === originalArtworkUrl) {
      return { url: originalArtworkUrl };
    }
    return { url: null };
  };

  /* ============================================================
     Derived values
     ============================================================ */

  // In edit mode the slug is frozen — renaming doesn't break the
  // public artist URL. In create mode it tracks the name input as a
  // live preview (the server action still computes it server-side).
  const slug = React.useMemo(
    () => existing?.slug ?? (slugify(name) || "untitled"),
    [existing?.slug, name],
  );

  /** Style/mood tags joined with " · " for the DB column (text) +
   *  the live preview's display string. */
  const styleText = React.useMemo(
    () => (styleTags.length > 0 ? styleTags.join(" · ") : null),
    [styleTags],
  );

  /** A faux ServerRow built from the live form state — fed to the
   *  preview ServerCard so the producer sees the result as they type. */
  const previewServer = React.useMemo<ServerRow>(
    () => ({
      id: "preview",
      owner_id: "preview",
      name: name.trim() || "Server name",
      slug,
      style_text: styleText,
      description: description.trim() || null,
      artist_types: artistTypes,
      artwork_mode: artworkMode,
      accent_hue: artworkMode === "color" ? accentHue : null,
      artwork_image_url:
        artworkMode === "image" ? artworkPreviewUrl : null,
      visibility,
      downloads_allowed: downloadsAllowed,
      force_artwork_on_beats: forceArtworkOnBeats,
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
      downloadsAllowed,
      forceArtworkOnBeats,
    ],
  );

  /** Covers for the mosaic — actual beat artwork URL when set, else
   *  a generative gradient seeded by the beat's wave_seed. Ordered by
   *  the producer's pick order.
   *
   *  When the force-artwork toggle is ON, every cover's src is
   *  swapped to the server artwork so the live preview matches the
   *  way /listen/[slug] will actually render the mosaic. The seed
   *  stays per-beat as a fallback if the artwork URL ever drops. */
  const selectedBeatCovers = React.useMemo(() => {
    const overrideSrc =
      forceArtworkOnBeats && artworkPreviewUrl
        ? artworkPreviewUrl
        : null;
    return beatIds
      .map((id) => {
        const b = beats.find((x) => x.id === id);
        if (!b) return null;
        return {
          seed: b.wave_seed,
          src: overrideSrc ?? b.artwork_url,
        };
      })
      .filter(
        (c): c is { seed: string; src: string | null } => c !== null,
      );
  }, [beatIds, beats, forceArtworkOnBeats, artworkPreviewUrl]);

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
      const artwork = await resolveArtworkUrl();
      if (artwork?.error) {
        setServerError(artwork.error);
        return;
      }

      const sharedPayload = {
        name,
        style_text: styleText,
        description: description.trim() || null,
        artist_types: artistTypes,
        artwork_mode: artworkMode,
        accent_hue: artworkMode === "color" ? accentHue : null,
        artwork_image_url: artwork?.url ?? null,
        visibility,
        downloads_allowed: downloadsAllowed,
        force_artwork_on_beats: forceArtworkOnBeats,
        beat_ids: beatIds,
      };

      if (mode === "edit" && existing) {
        const result = await updateServerAction({
          id: existing.id,
          ...sharedPayload,
        });
        if (result.error) {
          setServerError(result.error);
          return;
        }
        // Slug is stable across edits — redirect back to the detail
        // page (or refresh in place if we somehow ended up nowhere).
        router.push(`/servers/${result.slug ?? existing.slug}`);
        router.refresh();
        return;
      }

      const result = await createServerAction(sharedPayload);
      if (result?.error) {
        if (result.upgradeRequired) {
          // Billing gate fired — show the upgrade modal instead of
          // the red inline banner. The reason copy is identical
          // either way, but the modal gets the user one click
          // from Stripe Checkout.
          setUpgradeCtx({
            plan: result.upgradeRequired.plan,
            reason: result.error,
          });
        } else {
          setServerError(result.error);
        }
      }
    });
  };

  const cancel = () =>
    router.push(mode === "edit" ? `/servers/${existing!.slug}` : "/dashboard");
  const now = React.useMemo(() => new Date(), []);

  return (
    <>
      <PageHeader
        title={mode === "edit" ? `Edit ${existing?.name ?? "server"}` : "Create a server"}
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
              icon={mode === "edit" ? "check" : "plus"}
              onClick={submit}
              disabled={!canSubmit}
              size="sm"
              className="lg:!h-[38px] lg:!text-[14px]"
            >
              {mode === "edit"
                ? pending
                  ? "Saving…"
                  : "Save changes"
                : pending
                  ? "Creating…"
                  : "Create server"}
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
              FORM — always `order-2`. On mobile it renders below the
              preview (1 col stack); on lg+ it sits in the right
              grid column.
             ============================================================ */}
          <div
            className="order-2 flex flex-col"
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

            <div>
              <div className="t-mono-s" style={{ marginBottom: 10 }}>
                STYLE / MOOD
              </div>
              <TagInput
                value={styleTags}
                onChange={setStyleTags}
                max={4}
                suggestions={MOOD_SUGGEST as string[]}
                placeholder="e.g. Trap, Dark…"
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
                <>
                  {/* Hidden input lives at this level (not inside the
                      ImagePicker) so its ref stays stable across the
                      Artwork mode toggle — otherwise the input
                      unmounts whenever the producer switches to Auto
                      / Color and back, and the next click after a
                      toggle lands on a null ref. */}
                  <input
                    ref={artworkInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickArtwork}
                  />
                  <ImagePicker
                    previewUrl={artworkPreviewUrl}
                    onClickPick={() => artworkInputRef.current?.click()}
                    onRemove={removeArtwork}
                  />

                  {/* Per-server cover override — only meaningful
                      when an image has actually been chosen. Hidden
                      otherwise so the form doesn't bait the
                      producer with a toggle that does nothing. */}
                  {artworkPreviewUrl && (
                    <ForceArtworkToggle
                      value={forceArtworkOnBeats}
                      onChange={setForceArtworkOnBeats}
                    />
                  )}
                </>
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

            {/* Downloads — toggle row. Default OFF. When on, granted
                    artists can download the audio file of every beat
                    in this server (icon on the row desktop, '⋯ → Download'
                    on mobile). When off, the affordance is hidden and
                    the download endpoint refuses the request even if
                    the artist forges the URL. */}
            <div>
              <div className="t-mono-s" style={{ marginBottom: 10 }}>
                DOWNLOADS
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={downloadsAllowed}
                onClick={() => setDownloadsAllowed((v) => !v)}
                className="flex w-full items-center text-left transition-colors duration-fast cursor-pointer border-0"
                style={{
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  background: downloadsAllowed
                    ? "var(--accent-surface)"
                    : "var(--bg-2)",
                  border: `1px solid ${
                    downloadsAllowed
                      ? "color-mix(in oklch, var(--accent-text) 35%, transparent)"
                      : "var(--border-1)"
                  }`,
                }}
              >
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--r-sm)",
                    background: downloadsAllowed
                      ? "var(--accent)"
                      : "var(--bg-3)",
                    color: downloadsAllowed
                      ? "var(--accent-fg)"
                      : "var(--fg-3)",
                  }}
                >
                  <Icon name="download" size={16} />
                </span>
                <span className="flex flex-col flex-1 min-w-0">
                  <span
                    className="t-title"
                    style={{ fontSize: 14, color: "var(--fg-1)" }}
                  >
                    Allow artists to download
                  </span>
                  <span
                    className="t-mono-s"
                    style={{ color: "var(--fg-3)", marginTop: 4 }}
                  >
                    {downloadsAllowed
                      ? "ON · ARTISTS CAN SAVE THE AUDIO LOCALLY"
                      : "OFF · ARTISTS CAN ONLY STREAM IN THE APP"}
                  </span>
                </span>
                {/* Switch glyph — purely visual, the whole row is the
                        button so this never receives a click. */}
                <span
                  aria-hidden="true"
                  className="shrink-0"
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    background: downloadsAllowed
                      ? "var(--accent)"
                      : "var(--bg-3)",
                    position: "relative",
                    transition: "background 0.15s var(--ease)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: downloadsAllowed ? 18 : 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.15s var(--ease)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  />
                </span>
              </button>
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
              LIVE PREVIEW — always `order-1`. On mobile renders at the
              TOP (producer sees the result first, then scrolls down to
              fill the form). On lg+ goes into the left grid column and
              becomes sticky so it stays in view while the form
              scrolls. Mirrors the Upload Beat artwork-sticky pattern.
             ============================================================ */}
          <div
            className="order-1 lg:sticky lg:self-start"
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

      {/* Upgrade modal — mounted once, shown only when the billing
          gate fires. State holds the plan + the verbatim gate
          reason so the modal copy stays accurate even if quotas
          shift later. */}
      <UpgradeRequiredModal
        open={upgradeCtx !== null}
        onClose={() => setUpgradeCtx(null)}
        currentPlan={upgradeCtx?.plan ?? "free"}
        reason={upgradeCtx?.reason ?? ""}
      />
    </>
  );
}

/* ============================================================
   splitStyleText — reverse of the `styleTags.join(" · ")` we use to
   write style_text. Splits on either " · " or "," and trims so any
   legacy comma-separated values still parse.
   ============================================================ */

function splitStyleText(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[·,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/* ============================================================
   ImagePicker — file picker UI for the Image artwork mode
   ============================================================ */

function ImagePicker({
  previewUrl,
  onClickPick,
  onRemove,
}: {
  previewUrl: string | null;
  onClickPick: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="border border-border-1 bg-bg-1"
      style={{ padding: 14, borderRadius: "var(--r-md)" }}
    >
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
   ForceArtworkToggle — switch row that mirrors the Downloads
   toggle visually. Sits under ImagePicker and only renders when
   a real artwork has been picked (parent gates it). When ON,
   every beat in this server inherits the server cover at
   render time — the swap happens in the loader / adapter
   layer; beats.artwork_url is never mutated.
   ============================================================ */

function ForceArtworkToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="flex w-full items-center text-left transition-colors duration-fast cursor-pointer border-0"
        style={{
          gap: 14,
          padding: "14px 16px",
          borderRadius: "var(--r-md)",
          background: value ? "var(--accent-surface)" : "var(--bg-2)",
          border: `1px solid ${
            value
              ? "color-mix(in oklch, var(--accent-text) 35%, transparent)"
              : "var(--border-1)"
          }`,
        }}
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-sm)",
            background: value ? "var(--accent)" : "var(--bg-3)",
            color: value ? "var(--accent-fg)" : "var(--fg-3)",
          }}
        >
          <Icon name="view-grid" size={16} />
        </span>
        <span className="flex flex-col flex-1 min-w-0">
          <span
            className="t-title"
            style={{ fontSize: 14, color: "var(--fg-1)" }}
          >
            Use this artwork for all beats in this server
          </span>
          <span
            className="t-mono-s"
            style={{ color: "var(--fg-3)", marginTop: 4 }}
          >
            {value
              ? "ON · BEATS DISPLAY THE SERVER COVER HERE"
              : "OFF · EACH BEAT KEEPS ITS OWN COVER"}
          </span>
        </span>
        {/* Switch glyph — purely visual, the whole row is the
                button so this never receives a click. */}
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{
            width: 38,
            height: 22,
            borderRadius: 11,
            background: value ? "var(--accent)" : "var(--bg-3)",
            position: "relative",
            transition: "background 0.15s var(--ease)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: value ? 18 : 2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.15s var(--ease)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          />
        </span>
      </button>
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
