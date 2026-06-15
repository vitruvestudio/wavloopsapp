/**
 * SettingsPage — sidebar nav + per-tab content.
 *
 * Tabs:
 *   - Profile          (built in this commit)
 *   - Account          (placeholder — email + password + signout)
 *   - Notifications    (placeholder)
 *   - Billing & plan   (placeholder)
 *
 * The Profile tab is the meat: photo upload, producer name + bio,
 * social links, certifications, placements. Every field is
 * pre-filled from the profiles row that the onboarding wizard
 * already wrote — Settings is the "edit what onboarding captured"
 * page, not a separate data shape.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TagInput } from "@/components/ui/TagInput";
import type {
  PlacementRecord,
  ProfileRow,
} from "@/lib/supabase/database.types";
import { updateProfileAction } from "./actions";

type TabKey = "profile" | "account" | "notifications" | "billing";

interface SettingsPageProps {
  profile: ProfileRow | null;
  userEmail: string;
}

/** Suggestions for the certifications TagInput — mirrors the
 *  onboarding wizard's CERT_PRESET so the producer sees the same
 *  list both places. */
const CERT_PRESET = [
  "Gold",
  "Platinum",
  "2× Platinum",
  "Diamond",
  "RIAA Certified",
  "BMI Award",
  "Billboard Charted",
];

/** Inputs for the SOCIAL LINKS card. Order + icons mirror the
 *  contact modal's chips. */
const SOCIAL_FIELDS: Array<{
  key: string;
  label: string;
  icon: IconName;
  placeholder: string;
}> = [
  { key: "instagram", label: "Instagram", icon: "instagram", placeholder: "@handle" },
  { key: "x", label: "X", icon: "x-logo", placeholder: "@handle" },
  { key: "youtube", label: "YouTube", icon: "youtube", placeholder: "Channel name" },
  { key: "genius", label: "Genius", icon: "mic", placeholder: "@handle" },
  { key: "website", label: "Website", icon: "globe", placeholder: "https://…" },
];

export function SettingsPage({ profile, userEmail }: SettingsPageProps) {
  const [tab, setTab] = React.useState<TabKey>("profile");

  return (
    <>
      <PageHeader
        title="Settings"
        sub="MANAGE YOUR PROFILE, ACCOUNT & PLAN"
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
        <div
          className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]"
          style={{ gap: 28 }}
        >
          {/* Sidebar nav */}
          <SettingsNav tab={tab} onChange={setTab} />

          {/* Tab content */}
          {tab === "profile" ? (
            <ProfileTab profile={profile} />
          ) : tab === "account" ? (
            <PlaceholderTab
              title="Account"
              body={`You're signed in as ${userEmail}. Password change, email change, and account deletion controls land here next.`}
            />
          ) : tab === "notifications" ? (
            <PlaceholderTab
              title="Notifications"
              body="Email + in-app preferences for new artists, plays, and likes. Coming next."
            />
          ) : (
            <PlaceholderTab
              title="Billing & plan"
              body="Free plan, no payment method on file. Upgrades + invoices arrive when paid tiers ship."
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   SettingsNav — left-side tab rail (mobile: horizontal scroll)
   ============================================================ */

function SettingsNav({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const items: Array<{ key: TabKey; label: string; icon: IconName }> = [
    { key: "profile", label: "Profile", icon: "user" },
    { key: "account", label: "Account", icon: "lock" },
    { key: "notifications", label: "Notifications", icon: "bell" },
    { key: "billing", label: "Billing & plan", icon: "external" },
  ];
  return (
    <nav
      className="flex lg:flex-col overflow-x-auto"
      style={{ gap: 4 }}
      aria-label="Settings"
    >
      {items.map((it) => {
        const active = it.key === tab;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className="inline-flex items-center cursor-pointer transition-colors duration-fast shrink-0"
            style={{
              gap: 10,
              padding: "10px 14px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: active
                ? "var(--accent-surface)"
                : "transparent",
              color: active ? "var(--accent-text)" : "var(--fg-2)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              textAlign: "left",
            }}
          >
            <Icon name={it.icon} size={16} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ============================================================
   ProfileTab — the substance of the Settings page.
   ============================================================ */

function ProfileTab({ profile }: { profile: ProfileRow | null }) {
  const router = useRouter();
  const [name, setName] = React.useState(profile?.name ?? "");
  const [bio, setBio] = React.useState(profile?.bio ?? "");
  const [socials, setSocials] = React.useState<Record<string, string>>(
    profile?.socials ?? {},
  );
  const [certs, setCerts] = React.useState<string[]>(
    profile?.certifications ?? [],
  );
  const [placements, setPlacements] = React.useState<PlacementRecord[]>(
    profile?.placements ?? [],
  );

  /* Avatar state: the data-URL when the producer picks a new file
   * (sent as base64 to the action), null otherwise. avatarPreview
   * drives the live <Avatar src=…> and falls back to the stored URL. */
  const [avatarDataUrl, setAvatarDataUrl] = React.useState<string | null>(
    null,
  );
  const [avatarCleared, setAvatarCleared] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const avatarPreview = avatarCleared
    ? null
    : (avatarDataUrl ?? profile?.avatar_url ?? null);

  const [error, setError] = React.useState<string | null>(null);
  const [savedFlash, setSavedFlash] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Profile photo must be an image (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image is over 5 MB. Compress and try again.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(reader.result as string);
      setAvatarCleared(false);
    };
    reader.readAsDataURL(f);
  };

  const submit = () => {
    setError(null);
    setSavedFlash(false);
    startTransition(async () => {
      const result = await updateProfileAction({
        name,
        bio,
        socials,
        certifications: certs,
        placements,
        avatarDataUrl,
        clearAvatar: avatarCleared,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSavedFlash(true);
      // Reset the local avatar state so the next save uses the new
      // server URL as the baseline.
      setAvatarDataUrl(null);
      setAvatarCleared(false);
      router.refresh();
      window.setTimeout(() => setSavedFlash(false), 2400);
    });
  };

  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      {/* ── PROFILE card (photo + name + bio) ──────────── */}
      <SectionCard kicker="PROFILE" title="Public profile">
        <p
          className="t-body"
          style={{ color: "var(--fg-3)", marginBottom: 22 }}
        >
          Shown on every shared server link.
        </p>

        <div
          className="flex items-center"
          style={{ gap: 18, marginBottom: 24 }}
        >
          <Avatar
            name={name || "Producer"}
            src={avatarPreview}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--fg-1)",
              }}
            >
              Profile photo
            </div>
            <div
              className="t-mono-s"
              style={{ color: "var(--fg-3)", marginTop: 3 }}
            >
              JPG OR PNG · SQUARE RECOMMENDED
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 6 }}>
            <Button
              variant="secondary"
              size="sm"
              icon="upload"
              onClick={() => avatarInputRef.current?.click()}
              className="!h-[36px]"
            >
              Change
            </Button>
            {avatarPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAvatarDataUrl(null);
                  setAvatarCleared(true);
                }}
                className="!h-[36px]"
              >
                Remove
              </Button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: 16 }}>
          <Field
            label="PRODUCER NAME"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tyler Mills"
          />
          <div>
            <div className="t-mono-s" style={{ marginBottom: 8 }}>
              BIO
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="A few lines about your sound, your wins, who you're for."
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
        </div>
      </SectionCard>

      {/* ── LINKS card ──────────────────────────────────── */}
      <SectionCard kicker="LINKS" title="Social links">
        <div className="flex flex-col" style={{ gap: 10 }}>
          {SOCIAL_FIELDS.map((s) => (
            <div
              key={s.key}
              className="flex items-center bg-bg-inset border border-border-2 transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
              style={{
                gap: 12,
                padding: "0 14px",
                height: 44,
                borderRadius: "var(--r-md)",
              }}
            >
              <span
                className="inline-flex items-center text-fg-3 shrink-0"
                style={{
                  gap: 6,
                  width: 110,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <Icon name={s.icon} size={13} />
                {s.label}
              </span>
              <input
                value={socials[s.key] ?? ""}
                onChange={(e) =>
                  setSocials({ ...socials, [s.key]: e.target.value })
                }
                placeholder={s.placeholder}
                className="flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4 min-w-0"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                }}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── CREDENTIALS card ─────────────────────────────── */}
      <SectionCard
        kicker="CREDENTIALS"
        title="Certifications & trophies"
      >
        <TagInput
          value={certs}
          onChange={setCerts}
          max={8}
          suggestions={CERT_PRESET}
          placeholder="e.g. Platinum, RIAA Certified…"
          accent
        />
      </SectionCard>

      {/* ── PLACEMENTS card ──────────────────────────────── */}
      <SectionCard kicker="PLACEMENTS" title="Songs you've placed">
        <p
          className="t-body"
          style={{ color: "var(--fg-3)", marginBottom: 18 }}
        >
          YouTube or Spotify links shown as embeds on your profile.
        </p>
        <PlacementsEditor
          placements={placements}
          onChange={setPlacements}
        />
      </SectionCard>

      {/* ── Status + Save button ────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="t-body-s"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            background: "var(--danger-surface)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center" style={{ gap: 10 }}>
        <Button
          icon={savedFlash ? "check" : "check"}
          onClick={submit}
          disabled={pending}
          size="lg"
        >
          {pending
            ? "Saving…"
            : savedFlash
              ? "Saved"
              : "Save profile"}
        </Button>
        {savedFlash && (
          <span
            className="t-mono-s"
            style={{ color: "var(--accent-text)" }}
          >
            PROFILE UPDATED
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PlacementsEditor — list rows + Add a placement
   ============================================================ */

function PlacementsEditor({
  placements,
  onChange,
}: {
  placements: PlacementRecord[];
  onChange: (next: PlacementRecord[]) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");

  const detectPlatform = (raw: string): "Spotify" | "YouTube" | null => {
    const u = raw.toLowerCase();
    if (u.includes("spotify")) return "Spotify";
    if (u.includes("youtu")) return "YouTube";
    return null;
  };

  const add = () => {
    const t = title.trim();
    const u = url.trim();
    const platform = detectPlatform(u);
    if (!t || !u || !platform) return;
    const next: PlacementRecord = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `p-${Date.now()}`,
      title: t,
      platform,
      icon: platform.toLowerCase(),
    };
    onChange([...placements, next]);
    setTitle("");
    setUrl("");
    setAdding(false);
  };

  const remove = (id: string) =>
    onChange(placements.filter((p) => p.id !== id));

  const canAdd =
    title.trim().length > 0 &&
    detectPlatform(url) !== null;

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {placements.map((p) => (
        <div
          key={p.id}
          className="flex items-center bg-bg-1 border border-border-1"
          style={{
            gap: 14,
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-sm)",
              background:
                p.platform === "Spotify"
                  ? "oklch(0.65 0.18 145)"
                  : "oklch(0.55 0.22 25)",
              color: "#fff",
            }}
          >
            <Icon
              name={p.platform === "Spotify" ? "spotify" : "youtube"}
              size={18}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14.5,
                fontWeight: 600,
                color: "var(--fg-1)",
              }}
            >
              {p.title}
            </div>
            <div
              className="t-mono-s inline-flex items-center"
              style={{ gap: 6, color: "var(--fg-3)", marginTop: 3 }}
            >
              <Icon
                name={p.platform === "Spotify" ? "spotify" : "youtube"}
                size={11}
              />
              {p.platform.toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => remove(p.id)}
            aria-label={`Remove ${p.title}`}
            className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--r-sm)",
              border: "none",
              background: "transparent",
              color: "var(--fg-4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--danger)";
              e.currentTarget.style.background = "var(--danger-surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg-4)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      ))}

      {adding ? (
        <div
          className="flex flex-col border border-border-1 bg-bg-1"
          style={{
            padding: 14,
            borderRadius: "var(--r-md)",
            gap: 10,
          }}
        >
          <Field
            label="TITLE"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Nightfall — prod. mrtlman"
          />
          <Field
            label="YOUTUBE OR SPOTIFY URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=… or https://open.spotify.com/track/…"
          />
          <div className="flex items-center justify-end" style={{ gap: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setTitle("");
                setUrl("");
              }}
              className="!h-[36px]"
            >
              Cancel
            </Button>
            <Button
              icon="plus"
              size="sm"
              onClick={add}
              disabled={!canAdd}
              className="!h-[36px]"
            >
              Add
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center self-start cursor-pointer transition-colors duration-fast"
          style={{
            gap: 8,
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border-1)",
            background: "transparent",
            color: "var(--fg-2)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Icon name="plus" size={14} />
          Add a placement
        </button>
      )}
    </div>
  );
}

/* ============================================================
   SectionCard — kicker + title + body wrapper, used for each
   profile section.
   ============================================================ */

function SectionCard({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border border-border-1 bg-bg-1"
      style={{
        padding: "22px 24px",
        borderRadius: "var(--r-lg)",
      }}
    >
      <div
        className="t-mono-s"
        style={{ color: "var(--accent-text)", marginBottom: 6 }}
      >
        {kicker}
      </div>
      <h2 className="t-h2" style={{ fontSize: 22, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ============================================================
   PlaceholderTab — used for Account / Notifications / Billing
   until they ship.
   ============================================================ */

function PlaceholderTab({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <SectionCard kicker="COMING NEXT" title={title}>
      <p className="t-body" style={{ color: "var(--fg-3)" }}>
        {body}
      </p>
    </SectionCard>
  );
}
