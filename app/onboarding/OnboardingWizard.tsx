/**
 * OnboardingWizard — 5-step producer setup, ported from prototype
 * `screen_onboarding.jsx`.
 *
 *   STEP 1 · PROFILE       Avatar upload + producer name
 *   STEP 2 · BIO           Textarea, 180-char counter
 *   STEP 3 · SOCIALS       Chip selector → inline input per platform
 *   STEP 4 · CREDENTIALS   TagInput, 8 max, presets for certs
 *   STEP 5 · PLACEMENTS    Paste YouTube/Spotify link → card list
 *
 * Layout: centred column, max-w 540, radial accent glow at top.
 * Standalone (no App shell) — lives at /onboarding, sibling of /auth.
 *
 * V1 status (this commit):
 *   - All state local. "Finish" / "Skip" → push to /dashboard.
 *   - Avatar upload reads a local FileReader for instant preview (no
 *     Supabase Storage yet — that lands when we wire the profiles table
 *     in the next commit).
 *   - On Finish, NOTHING is saved to the DB. Save action + table lands
 *     immediately after visual validation.
 *
 * Helpers `StepDots`, `SocialChips`, `PlacementCard` live in this file
 * because they're tightly coupled to the wizard. Extract them if a
 * second screen reuses them.
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { TagInput } from "@/components/ui/TagInput";
import { saveProfileAction, skipOnboardingAction } from "./actions";

/* ============================================================
   StepDots — progress indicator at the top of the body
   ============================================================ */
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex" style={{ gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            height: 4,
            borderRadius: 2,
            width: i === step ? 26 : 16,
            background: i <= step ? "var(--accent)" : "var(--bg-3)",
            transition: "all var(--dur) var(--ease)",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   SocialChips — Step 3
   ============================================================ */

interface PlatformSpec {
  k: SocialKey;
  label: string;
  icon: IconName;
  ph: string;
}

type SocialKey = "instagram" | "x" | "youtube" | "genius" | "website";
type Socials = Partial<Record<SocialKey, string>>;

const PLATS: ReadonlyArray<PlatformSpec> = [
  { k: "instagram", label: "Instagram", icon: "instagram", ph: "@handle" },
  { k: "x", label: "X", icon: "x-logo", ph: "@handle" },
  { k: "youtube", label: "YouTube", icon: "youtube", ph: "Channel URL" },
  { k: "genius", label: "Genius", icon: "mic", ph: "Profile URL" },
  { k: "website", label: "Website", icon: "globe", ph: "https://" },
];

function SocialChips({
  socials,
  setSocials,
}: {
  socials: Socials;
  setSocials: React.Dispatch<React.SetStateAction<Socials>>;
}) {
  const [active, setActive] = React.useState<SocialKey[]>([]);

  const add = (k: SocialKey) =>
    setActive((a) => (a.includes(k) ? a : [...a, k]));

  const rm = (k: SocialKey) => {
    setActive((a) => a.filter((x) => x !== k));
    setSocials((s) => {
      const n = { ...s };
      delete n[k];
      return n;
    });
  };

  const availPlats = PLATS.filter((s) => !active.includes(s.k));

  return (
    <div>
      {/* Active platforms — each renders as an inline input row */}
      {active.length > 0 && (
        <div
          className="flex flex-col"
          style={{
            gap: 8,
            marginBottom: active.length < PLATS.length ? 12 : 0,
          }}
        >
          {active.map((k) => {
            const s = PLATS.find((x) => x.k === k)!;
            return (
              <div
                key={k}
                className="flex items-center border border-border-2 bg-bg-inset"
                style={{
                  gap: 10,
                  height: 46,
                  padding: "0 8px 0 13px",
                  borderRadius: "var(--r-md)",
                }}
              >
                <Icon
                  name={s.icon}
                  size={18}
                  className="shrink-0"
                  style={{ color: "var(--accent-text)" }}
                />
                <input
                  autoFocus
                  value={socials[k] ?? ""}
                  onChange={(e) =>
                    setSocials((v) => ({ ...v, [k]: e.target.value }))
                  }
                  placeholder={s.ph}
                  className="min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
                  style={{ fontFamily: "var(--font-body)", fontSize: 14.5 }}
                />
                <IconButton
                  name="x"
                  size={32}
                  iconSize={14}
                  onClick={() => rm(k)}
                  label={`Remove ${s.label}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Available platforms — pill selectors */}
      {availPlats.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {availPlats.map((s) => (
            <button
              key={s.k}
              type="button"
              onClick={() => add(s.k)}
              className="group inline-flex items-center cursor-pointer border border-border-2 text-fg-2 transition-all"
              style={{
                gap: 8,
                height: 38,
                padding: "0 14px",
                borderRadius: "var(--r-pill)",
                background: "transparent",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 13.5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent-text)";
                e.currentTarget.style.background = "var(--accent-surface)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-2)";
                e.currentTarget.style.color = "var(--fg-2)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon name={s.icon} size={15} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PlacementCard — Step 5
   ============================================================ */

interface Placement {
  id: string;
  title: string;
  platform: "Spotify" | "YouTube";
  icon: IconName;
}

function PlacementCard({
  p,
  onRemove,
}: {
  p: Placement;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center bg-bg-1 border border-border-1"
      style={{
        gap: 13,
        padding: 10,
        borderRadius: "var(--r-md)",
      }}
    >
      {/* Thumbnail placeholder (real cover art lands when we wire
          embed metadata fetching post-V1) */}
      <div
        className="relative shrink-0 overflow-hidden bg-bg-inset"
        style={{
          width: 88,
          height: 50,
          borderRadius: "var(--r-sm)",
          backgroundImage:
            "linear-gradient(140deg, var(--accent-surface), var(--bg-inset))",
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "oklch(0 0 0 / 0.35)" }}
        >
          <Icon name="play" size={16} style={{ color: "#fff" }} />
        </div>
      </div>

      {/* Title + platform */}
      <div className="min-w-0 flex-1">
        <div
          className="t-title truncate"
          style={{ fontSize: 14 }}
        >
          {p.title}
        </div>
        <div
          className="t-mono-s flex items-center"
          style={{ marginTop: 3, gap: 6 }}
        >
          <Icon name={p.icon} size={11} />
          {p.platform.toUpperCase()}
        </div>
      </div>

      <IconButton
        name="trash"
        size={34}
        iconSize={16}
        onClick={onRemove}
        label="Remove placement"
      />
    </div>
  );
}

/* ============================================================
   Constants
   ============================================================ */

const CERT_PRESET = [
  "Gold",
  "Platinum",
  "2× Platinum",
  "Diamond",
  "RIAA Certified",
  "BMI Award",
  "Billboard Charted",
];

/* ============================================================
   OnboardingWizard
   ============================================================ */

export function OnboardingWizard() {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [avatarImg, setAvatarImg] = React.useState<string | null>(null);
  const [bio, setBio] = React.useState("");
  const [socials, setSocials] = React.useState<Socials>({});
  const [certs, setCerts] = React.useState<string[]>([]);
  const [placements, setPlacements] = React.useState<Placement[]>([]);
  const [link, setLink] = React.useState("");

  // Server-action plumbing — useTransition gates the pending UI on both
  // Finish and Skip, serverError surfaces inline above the footer nav.
  const [pending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarImg(String(reader.result));
    reader.readAsDataURL(file);
    // Reset so re-picking the same file fires onChange again
    e.target.value = "";
  };

  const addPlacement = () => {
    const v = link.trim();
    if (!v) return;
    const isSpotify = /spotify/i.test(v);
    setPlacements((p) => [
      ...p,
      {
        id: `p_${p.length}_${v.length}`, // deterministic local id (no Date.now to keep SSR happy)
        title:
          v.replace(/^https?:\/\/(www\.)?/, "").slice(0, 38) ||
          "Untitled track",
        platform: isSpotify ? "Spotify" : "YouTube",
        icon: isSpotify ? "library" : "youtube",
        url: v,
      },
    ]);
    setLink("");
  };

  const finish = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await saveProfileAction({
        name,
        bio,
        socials,
        certifications: certs,
        placements,
        avatarDataUrl: avatarImg,
      });
      // On success, the action calls redirect() and we never get here.
      // Only the error path returns a value.
      if (result?.error) setServerError(result.error);
    });
  };

  const skip = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await skipOnboardingAction();
      if (result?.error) setServerError(result.error);
    });
  };

  const stepBodies: ReadonlyArray<React.ReactNode> = [
    /* ---------- STEP 1 · PROFILE ---------- */
    <div key="step-1" className="flex flex-col" style={{ gap: 22 }}>
      <div className="flex items-center" style={{ gap: 18 }}>
        <div
          style={{
            borderRadius: "50%",
            padding: 3,
            background: "linear-gradient(140deg, var(--accent), transparent)",
          }}
        >
          {avatarImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarImg}
              alt=""
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <Avatar
              name={name || "me"}
              label={(name || "TM").slice(0, 2).toUpperCase()}
              size={84}
            />
          )}
        </div>
        <div className="flex flex-col" style={{ gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarUpload}
          />
          <Button
            variant="secondary"
            size="sm"
            icon="upload"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload photo
          </Button>
          {avatarImg && (
            <button
              type="button"
              onClick={() => setAvatarImg(null)}
              className="t-mono-s cursor-pointer border-0 bg-transparent text-left"
              style={{ color: "var(--fg-3)" }}
            >
              REMOVE
            </button>
          )}
        </div>
      </div>
      <div>
        <div className="t-mono-s" style={{ marginBottom: 8 }}>
          PRODUCER NAME
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 40, Metro Boomin, mrtlman…"
          className="w-full bg-bg-inset border border-border-2 text-fg-1 outline-none placeholder:text-fg-4 transition-all duration-fast focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]"
          style={{
            height: 48,
            padding: "0 15px",
            borderRadius: "var(--r-md)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 16,
          }}
        />
      </div>
    </div>,

    /* ---------- STEP 2 · BIO ---------- */
    <div key="step-2">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        maxLength={180}
        placeholder="Atlanta-based producer. Dark trap & melodic R&B. Placements with…"
        className="w-full bg-bg-inset border border-border-2 text-fg-1 outline-none placeholder:text-fg-4 transition-all duration-fast focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]"
        style={{
          padding: "14px 15px",
          borderRadius: "var(--r-md)",
          fontFamily: "var(--font-body)",
          fontSize: 15,
          lineHeight: 1.55,
          resize: "vertical",
        }}
      />
      <div
        className="t-mono-s"
        style={{
          marginTop: 8,
          textAlign: "right",
          color: "var(--fg-4)",
        }}
      >
        {bio.length}/180
      </div>
    </div>,

    /* ---------- STEP 3 · SOCIALS ---------- */
    <SocialChips key="step-3" socials={socials} setSocials={setSocials} />,

    /* ---------- STEP 4 · CREDENTIALS ---------- */
    <div key="step-4">
      <TagInput
        value={certs}
        onChange={setCerts}
        max={8}
        suggestions={CERT_PRESET}
        placeholder="e.g. Platinum, RIAA Certified…"
        accent
      />
    </div>,

    /* ---------- STEP 5 · PLACEMENTS ---------- */
    <div key="step-5" className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex" style={{ gap: 10 }}>
        <div
          className="flex flex-1 items-center bg-bg-inset border border-border-2 transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
          style={{
            gap: 10,
            height: 48,
            padding: "0 14px",
            borderRadius: "var(--r-md)",
          }}
        >
          <Icon name="link" size={17} className="text-fg-3" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPlacement();
              }
            }}
            placeholder="Paste a YouTube or Spotify link…"
            className="min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4"
            style={{ fontFamily: "var(--font-body)", fontSize: 14.5 }}
          />
        </div>
        <Button
          icon="plus"
          onClick={addPlacement}
          disabled={!link.trim()}
          style={!link.trim() ? { opacity: 0.5, pointerEvents: "none" } : {}}
        >
          Add
        </Button>
      </div>
      {placements.length > 0 && (
        <div className="flex flex-col" style={{ gap: 8 }}>
          {placements.map((p) => (
            <PlacementCard
              key={p.id}
              p={p}
              onRemove={() =>
                setPlacements((x) => x.filter((z) => z.id !== p.id))
              }
            />
          ))}
        </div>
      )}
    </div>,
  ];

  const STEPS = [
    {
      kicker: "STEP 1 · PROFILE",
      title: "Set up your producer profile",
      sub: "This is how artists see you on every shared link.",
    },
    {
      kicker: "STEP 2 · BIO",
      title: "Add a short bio",
      sub: "One or two lines — your sound, your city, your credits.",
    },
    {
      kicker: "STEP 3 · SOCIALS",
      title: "Link your socials",
      sub: "Add the platforms artists should follow you on.",
    },
    {
      kicker: "STEP 4 · CREDENTIALS",
      title: "Certifications & trophies",
      sub: "Declarative — add the plaques and awards you want to show.",
    },
    {
      kicker: "STEP 5 · PLACEMENTS",
      title: "Songs you've placed",
      sub: "Paste YouTube or Spotify links — they show as embeds on your profile.",
    },
  ] as const;

  const cur = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-bg-0"
      style={{
        backgroundImage:
          "radial-gradient(70% 45% at 50% 0%, var(--accent-surface), transparent 65%)",
      }}
    >
      {/* Header — Logo left, "SKIP FOR NOW" right */}
      <div
        className="flex items-center"
        style={{ gap: 16, padding: "22px 30px" }}
      >
        <Logo size={26} />
        <span className="flex-1" />
        <button
          type="button"
          onClick={skip}
          disabled={pending}
          className="t-mono-s cursor-pointer border-0 bg-transparent disabled:opacity-50"
          style={{ color: "var(--fg-3)" }}
        >
          SKIP FOR NOW
        </button>
      </div>

      {/* Body */}
      <div
        className="flex flex-1 items-center justify-center"
        style={{ padding: "12px 24px 48px" }}
      >
        <div className="w-full" style={{ maxWidth: 540 }}>
          <StepDots step={step} total={STEPS.length} />

          <div
            className="t-mono-s"
            style={{
              color: "var(--accent-text)",
              margin: "26px 0 12px",
            }}
          >
            {cur.kicker}
          </div>
          <h1 className="t-h1" style={{ fontSize: 32, marginBottom: 10 }}>
            {cur.title}
          </h1>
          <p className="t-body-l" style={{ marginBottom: 30 }}>
            {cur.sub}
          </p>

          <div style={{ marginBottom: 34 }}>{stepBodies[step]}</div>

          {/* Server-action error — surfaces upload failures, RLS denials,
              or any other thrown error from save / skip. */}
          {serverError && (
            <div
              role="alert"
              className="t-body-s"
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: "var(--r-sm)",
                background: "var(--danger-surface)",
                color: "var(--danger)",
                border: "1px solid var(--danger)",
                lineHeight: 1.4,
              }}
            >
              {serverError}
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center" style={{ gap: 12 }}>
            {step > 0 && (
              <Button
                variant="ghost"
                icon="chevron-left"
                onClick={() => setStep((s) => s - 1)}
                disabled={pending}
              >
                Back
              </Button>
            )}
            <span className="flex-1" />
            <button
              type="button"
              onClick={skip}
              disabled={pending}
              className="t-mono-s cursor-pointer border-0 bg-transparent disabled:opacity-50"
              style={{ color: "var(--fg-3)" }}
            >
              SKIP
            </button>
            {last ? (
              <Button
                size="lg"
                icon="check"
                onClick={finish}
                disabled={pending}
              >
                {pending ? "Saving…" : "Finish & go to library"}
              </Button>
            ) : (
              <Button
                size="lg"
                iconRight="arrow-right"
                onClick={() => setStep((s) => s + 1)}
                disabled={pending}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
