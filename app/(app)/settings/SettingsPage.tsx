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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TagInput } from "@/components/ui/TagInput";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/app/billing/actions";
import { STRIPE_LOOKUP_KEYS } from "@/lib/billing/plans";
import type { PlanContext } from "@/lib/billing/server";
import type {
  PlacementRecord,
  ProducerNotifPrefsJson,
  ProfileRow,
} from "@/lib/supabase/database.types";
import { signOutAction } from "@/app/auth/actions";
import {
  type ProducerNotifPrefs,
  updateProducerNotifPrefsAction,
  updateProfileAction,
} from "./actions";

type TabKey = "profile" | "account" | "notifications" | "billing";

interface SettingsPageProps {
  profile: ProfileRow | null;
  userEmail: string;
  emailConfirmed: boolean;
  /** Auth identity providers (e.g. ["google"], ["email"]). */
  providers: string[];
  /** True when the user also has an onboarded artist_profiles row.
   *  Drives the "Add Artist mode" / "Also using Artist mode" UI
   *  inside the Account tab. */
  hasArtistProfile: boolean;
  /** Resolved billing context: plan + quotas + live usage. Drives
   *  the "Your plan" card + the upgrade / manage CTAs. */
  planContext: PlanContext;
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

export function SettingsPage({
  profile,
  userEmail,
  emailConfirmed,
  providers,
  hasArtistProfile,
  planContext,
}: SettingsPageProps) {
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
            <AccountTab
              email={userEmail}
              emailConfirmed={emailConfirmed}
              providers={providers}
              hasArtistProfile={hasArtistProfile}
            />
          ) : tab === "notifications" ? (
            <NotificationsTab initialPrefs={profile?.notif_prefs} />
          ) : (
            <BillingTab planContext={planContext} />
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
    { key: "billing", label: "Billing & plan", icon: "card" },
  ];
  return (
    <nav
      // Below lg: wrap onto 2 rows instead of horizontal-scroll —
      // hidden scroll was easy to miss, especially with "Billing
      // & plan" being the longest tab. Wrapping makes every tab
      // visible at a glance.
      className="flex flex-wrap lg:flex-nowrap lg:flex-col"
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
      url: u,
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
   AccountTab — Login & security
   ============================================================ */

function AccountTab({
  email,
  emailConfirmed,
  providers,
  hasArtistProfile,
}: {
  email: string;
  emailConfirmed: boolean;
  providers: string[];
  hasArtistProfile: boolean;
}) {
  const stub = (label: string) =>
    alert(`${label} — wires up in the next step.`);
  const oauthProvider = providers.find((p) => p !== "email");
  const providerLabel = oauthProvider
    ? oauthProvider[0].toUpperCase() + oauthProvider.slice(1)
    : null;

  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      <SectionCard kicker="ACCOUNT" title="Login & security">
        <div className="flex flex-col">
          {/* Email */}
          <AccountRow
            icon="mail"
            title="Email address"
            subtitle={
              <span
                className="inline-flex items-center"
                style={{ gap: 8 }}
              >
                <span>{email}</span>
                {emailConfirmed && (
                  <span
                    className="t-mono-s inline-flex items-center"
                    style={{ gap: 4, color: "var(--ok)" }}
                  >
                    <Icon name="check" size={12} />
                    CONFIRMED
                  </span>
                )}
              </span>
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => stub("Change email")}
                className="!h-[36px]"
              >
                Change
              </Button>
            }
          />

          {/* Password — only relevant when the user has the "email" identity */}
          {providers.includes("email") && (
            <AccountRow
              icon="lock"
              title="Password"
              subtitle="Reset it any time"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => stub("Update password")}
                  className="!h-[36px]"
                >
                  Update
                </Button>
              }
            />
          )}

          {/* OAuth provider */}
          {providerLabel && (
            <AccountRow
              icon="globe"
              title={`Connected — ${providerLabel}`}
              subtitle={email}
              action={
                <span
                  className="t-mono-s inline-flex items-center"
                  style={{
                    gap: 5,
                    padding: "5px 10px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--ok-surface)",
                    color: "var(--ok)",
                  }}
                >
                  LINKED
                </span>
              }
            />
          )}

          {/* Log out — real signOutAction via a tiny form */}
          <div
            className="flex items-center"
            style={{
              gap: 14,
              padding: "16px 0",
              borderTop: "1px solid var(--border-1)",
              marginTop: 6,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--r-sm)",
                background: "var(--danger-surface)",
                color: "var(--danger)",
              }}
            >
              <Icon name="log-out" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--danger)",
                }}
              >
                Log out
              </div>
              <div
                className="t-body-s"
                style={{ color: "var(--fg-3)", marginTop: 3 }}
              >
                Sign out of WAVLOOPS on this device.
              </div>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center cursor-pointer transition-colors duration-fast"
                style={{
                  gap: 8,
                  padding: "8px 14px",
                  height: 36,
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--danger)",
                  background: "transparent",
                  color: "var(--danger)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13.5,
                  fontWeight: 500,
                }}
              >
                <Icon name="log-out" size={14} />
                Log out
              </button>
            </form>
          </div>
        </div>
      </SectionCard>

      {/* Other modes — contextual CTA to add the second role. Hidden
          for users who already have both, since the AccountMenu
          switcher is the better surface once both exist. */}
      {!hasArtistProfile && (
        <SectionCard kicker="OTHER MODES" title="Pick beats too?">
          <div className="flex flex-col" style={{ gap: 14 }}>
            <p
              className="t-body"
              style={{ color: "var(--fg-3)", margin: 0, lineHeight: 1.55 }}
            >
              Activate Artist mode to receive packs from other producers,
              save your favorites, and send back feedback — all from the
              same account, with a one-click switcher.
            </p>
            <Link
              href="/onboarding/artist"
              className="inline-flex items-center cursor-pointer transition-colors duration-fast self-start"
              style={{
                gap: 8,
                padding: "10px 18px",
                height: 40,
                borderRadius: "var(--r-md)",
                border: "1px solid var(--accent)",
                background: "var(--accent-surface)",
                color: "var(--accent-text)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Icon name="play" size={15} />
              Add Artist mode
            </Link>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function AccountRow({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: IconName;
  title: string;
  subtitle: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 14,
        padding: "16px 0",
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 text-fg-2"
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-sm)",
          background: "var(--bg-2)",
        }}
      >
        <Icon name={icon} size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--fg-1)",
          }}
        >
          {title}
        </div>
        <div
          className="t-body-s"
          style={{ color: "var(--fg-3)", marginTop: 3 }}
        >
          {subtitle}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   NotificationsTab — email preferences toggles (local state for
   now; persistence lands when notification emails actually ship)
   ============================================================ */

/** Producer notification preferences — mirrors the artist
 *  Settings layout (activity + channels groups) so the two
 *  surfaces read as the same product. */
const ACTIVITY_PREFS: Array<{
  key: "access_request" | "likes" | "comments";
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    key: "access_request",
    icon: "lock",
    title: "New access request",
    body: "When an artist requests access to a private server",
  },
  {
    key: "likes",
    icon: "heart",
    title: "Artist liked a beat",
    body: "Someone liked one of your uploads",
  },
  {
    key: "comments",
    icon: "message",
    title: "Artist feedback",
    body: "When an artist shares feedback on a beat",
  },
];

const CHANNEL_PREFS: Array<{
  key: "email" | "push";
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    key: "email",
    icon: "mail",
    title: "Email",
    body: "Send to your sign-in address",
  },
  {
    key: "push",
    icon: "bell",
    title: "Push notifications",
    body: "In-app and browser push (coming soon)",
  },
];

const DEFAULT_PRODUCER_PREFS: ProducerNotifPrefs = {
  access_request: true,
  likes: true,
  comments: true,
  email: true,
  push: false,
};

function NotificationsTab({
  initialPrefs,
}: {
  initialPrefs: ProducerNotifPrefs | undefined;
}) {
  const [prefs, setPrefs] = React.useState<ProducerNotifPrefs>(() => ({
    ...DEFAULT_PRODUCER_PREFS,
    ...(initialPrefs ?? {}),
  }));
  const [savedFlash, setSavedFlash] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const togglePref = (key: keyof ProducerNotifPrefs) => {
    // Compute next + roll-back snapshot BEFORE any state writes —
    // React 19 forbids calling startTransition (and any other
    // setState that could schedule work) from inside a setState
    // updater, since the updater must stay pure.
    const prev = prefs;
    const next = { ...prev, [key]: !prev[key] };
    setError(null);
    setPrefs(next);
    startTransition(async () => {
      const result = await updateProducerNotifPrefsAction(next);
      if (result.error) {
        setError(result.error);
        setPrefs(prev);
        return;
      }
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1600);
    });
  };

  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      <SectionCard kicker="ACTIVITY" title="What you hear about">
        <p
          className="t-body"
          style={{ color: "var(--fg-3)", marginBottom: 18 }}
        >
          Choose which artist activity reaches you. Off means no bell
          row and no email.
        </p>
        <PrefList
          items={ACTIVITY_PREFS}
          prefs={prefs}
          onToggle={togglePref}
        />
      </SectionCard>

      <SectionCard kicker="CHANNELS" title="How you're notified">
        <PrefList
          items={CHANNEL_PREFS}
          prefs={prefs}
          onToggle={togglePref}
        />
      </SectionCard>

      {(isPending || savedFlash || error) && (
        <div
          className="t-mono-s"
          style={{
            alignSelf: "flex-end",
            color: error
              ? "var(--danger)"
              : savedFlash
                ? "var(--accent-text)"
                : "var(--fg-3)",
            letterSpacing: "0.08em",
          }}
        >
          {error
            ? error.toUpperCase()
            : isPending
              ? "SAVING…"
              : "SAVED"}
        </div>
      )}
    </div>
  );
}

function PrefList({
  items,
  prefs,
  onToggle,
}: {
  items: ReadonlyArray<{
    key: keyof ProducerNotifPrefs;
    icon: IconName;
    title: string;
    body: string;
  }>;
  prefs: ProducerNotifPrefs;
  onToggle: (key: keyof ProducerNotifPrefs) => void;
}) {
  return (
    <div className="flex flex-col">
      {items.map((p, i) => (
        <div
          key={p.key}
          className="flex items-center"
          style={{
            gap: 14,
            padding: "14px 0",
            borderTop: i === 0 ? "none" : "1px solid var(--border-1)",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0 text-fg-2"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-sm)",
              background: "var(--bg-2)",
            }}
          >
            <Icon name={p.icon} size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div
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
              className="t-body-s"
              style={{ color: "var(--fg-3)", marginTop: 3 }}
            >
              {p.body}
            </div>
          </div>
          <Toggle
            on={!!prefs[p.key]}
            onChange={() => onToggle(p.key)}
            label={p.title}
          />
        </div>
      ))}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="inline-flex items-center cursor-pointer transition-colors duration-fast"
      style={{
        width: 44,
        height: 24,
        padding: 2,
        borderRadius: 999,
        border: "none",
        background: on ? "var(--accent)" : "var(--bg-3)",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "block",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transform: on ? "translateX(20px)" : "translateX(0)",
          transition: "transform var(--dur-fast) var(--ease)",
          boxShadow: "0 1px 2px oklch(0 0 0 / 0.2)",
        }}
      />
    </button>
  );
}

/* ============================================================
   BillingTab — current plan, upgrade options, payment + history
   ============================================================ */

function BillingTab({ planContext }: { planContext: PlanContext }) {
  const stub = (label: string) =>
    alert(`${label} — wires up when paid tiers ship.`);
  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      <SectionCard kicker="SUBSCRIPTION" title="Your plan">
        {/* Current plan card */}
        <div
          className="flex items-center"
          style={{
            gap: 14,
            padding: "14px 16px",
            border: "1px solid var(--border-1)",
            borderRadius: "var(--r-md)",
            marginBottom: 18,
          }}
        >
          <div
            className="flex items-center justify-center shrink-0 text-fg-2"
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--r-sm)",
              background: "var(--bg-2)",
            }}
          >
            <Icon name="library" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="inline-flex items-center"
              style={{ gap: 10 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                }}
              >
                {humanPlanName(planContext.plan)} plan
              </span>
              <span
                className="t-mono-s"
                style={{
                  padding: "3px 9px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--accent-surface)",
                  color: "var(--accent-text)",
                }}
              >
                CURRENT
              </span>
            </div>
            <div
              className="t-mono-s"
              style={{ color: "var(--fg-3)", marginTop: 4 }}
            >
              {usageSummary(planContext)}
            </div>
          </div>
        </div>

        {/* Plan-aware CTAs: Free → both upgrade options.
            Lifetime → only Pro (you already own Lifetime).
            Pro → "Manage subscription" via Stripe Customer Portal. */}
        <PlanCtas planContext={planContext} />
      </SectionCard>

      <SectionCard kicker="PAYMENT" title="Payment method">
        <div
          className="flex items-center"
          style={{ gap: 14 }}
        >
          <div
            className="flex items-center justify-center shrink-0 text-fg-2"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-sm)",
              background: "var(--bg-2)",
            }}
          >
            <Icon name="card" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14.5,
                fontWeight: 600,
                color: "var(--fg-1)",
              }}
            >
              No card on file
            </div>
            <div
              className="t-body-s"
              style={{ color: "var(--fg-3)", marginTop: 3 }}
            >
              Add a card to upgrade your plan
            </div>
          </div>
          <Button
            variant="secondary"
            icon="plus"
            size="sm"
            onClick={() => stub("Add card")}
            className="!h-[36px]"
          >
            Add card
          </Button>
        </div>
      </SectionCard>

      <SectionCard kicker="HISTORY" title="Payment history">
        <div
          className="flex flex-col items-center text-center"
          style={{ padding: "30px 18px", gap: 8 }}
        >
          <div
            className="flex items-center justify-center text-fg-3"
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--r-md)",
              background: "var(--bg-2)",
              marginBottom: 4,
            }}
          >
            <Icon name="clock" size={22} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            No payments yet
          </div>
          <div className="t-body-s" style={{ color: "var(--fg-3)" }}>
            Your invoices will appear here once you upgrade.
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function PlanCard({
  kicker,
  name,
  price,
  unit,
  features,
  ctaLabel,
  onCta,
  accent,
}: {
  kicker: string;
  name: string;
  price: string;
  unit: string;
  features: string[];
  ctaLabel: string;
  onCta: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        padding: 20,
        border: `1px solid ${accent ? "var(--accent)" : "var(--border-1)"}`,
        borderRadius: "var(--r-md)",
        background: accent ? "var(--accent-surface)" : "var(--bg-0)",
      }}
    >
      <div
        className="t-mono-s"
        style={{ color: "var(--accent-text)", marginBottom: 6 }}
      >
        {kicker}
      </div>
      <div
        className="t-h2"
        style={{ fontSize: 19, marginBottom: 10 }}
      >
        {name}
      </div>
      <div
        className="inline-flex items-baseline"
        style={{ gap: 6, marginBottom: 16 }}
      >
        <span
          className="t-h1"
          style={{
            fontSize: 32,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {price}
        </span>
        <span
          className="t-mono-s"
          style={{ color: "var(--fg-3)" }}
        >
          {unit}
        </span>
      </div>
      <ul
        className="flex flex-col"
        style={{ gap: 8, marginBottom: 18, listStyle: "none", padding: 0 }}
      >
        {features.map((f) => (
          <li
            key={f}
            className="inline-flex items-center t-body-s"
            style={{ gap: 8, color: "var(--fg-2)" }}
          >
            <Icon
              name="check"
              size={14}
              style={{ color: "var(--accent-text)" }}
            />
            {f}
          </li>
        ))}
      </ul>
      <Button
        variant={accent ? "primary" : "secondary"}
        size="sm"
        onClick={onCta}
        className="!h-[40px] mt-auto"
      >
        {ctaLabel}
      </Button>
    </div>
  );
}

/* ============================================================
   Billing helpers — pure UI glue around the plan context.
   ============================================================ */

function humanPlanName(plan: PlanContext["plan"]): string {
  if (plan === "pro") return "Pro";
  if (plan === "lifetime") return "Lifetime";
  return "Free";
}

/** Format the quotas/usage line under the plan name. Shows the
 *  3 numbers that matter (servers, beats, artists) with their
 *  caps, or "Unlimited" for ∞ quotas. */
function usageSummary(ctx: PlanContext): string {
  const fmt = (used: number, max: number | null) =>
    max === null ? `${used} / UNLIMITED` : `${used} / ${max}`;
  return `${fmt(ctx.usage.servers, ctx.quotas.servers)} SERVERS · ${fmt(ctx.usage.beats, ctx.quotas.beats)} BEATS · ${fmt(ctx.usage.artists, ctx.quotas.artists)} ARTISTS`;
}

/** Plan-aware CTAs.
 *   - Free → both upgrade options (Lifetime + Pro M/Y).
 *   - Lifetime → upgrade-to-Pro options only.
 *   - Pro → a single "Manage subscription" button that opens the
 *     Stripe Customer Portal (card / cancel / invoices). */
function PlanCtas({ planContext }: { planContext: PlanContext }) {
  const [pending, startTransition] = React.useTransition();

  const fireCheckout = (lookupKey: string) =>
    startTransition(async () => {
      try {
        await createCheckoutSession(lookupKey as never);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not start checkout.";
        if (!/NEXT_REDIRECT/i.test(msg)) {
          console.error("[settings/billing] checkout failed:", e);
          window.alert(msg);
        }
      }
    });

  const firePortal = () =>
    startTransition(async () => {
      try {
        await createBillingPortalSession();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not open the portal.";
        if (!/NEXT_REDIRECT/i.test(msg)) {
          console.error("[settings/billing] portal failed:", e);
          window.alert(msg);
        }
      }
    });

  if (planContext.plan === "pro") {
    return (
      <div className="flex flex-col" style={{ gap: 10 }}>
        <Button
          variant="primary"
          size="sm"
          onClick={firePortal}
          disabled={pending}
          className="!h-[42px]"
        >
          {pending ? "Opening portal…" : "Manage subscription"}
        </Button>
        <div className="t-body-s" style={{ color: "var(--fg-3)" }}>
          Update your card, view invoices, or cancel anytime. Cancelling
          keeps your access until the end of the current billing period.
        </div>
      </div>
    );
  }

  // Free or Lifetime → show upgrade options. Lifetime customers
  // skip the Lifetime card (they already have it).
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2"
      style={{ gap: 14 }}
    >
      {planContext.plan === "free" && (
        <PlanCard
          kicker="BEST VALUE"
          name="Lifetime"
          price="129€"
          unit="once"
          features={[
            "3 servers, 150 beats, 500 artists",
            "Per-artist tracking — who listened to what",
            "One payment, no renewal",
          ]}
          ctaLabel={pending ? "Redirecting…" : "Get Lifetime"}
          onCta={() => fireCheckout(STRIPE_LOOKUP_KEYS.lifetime)}
          accent
        />
      )}
      <PlanCard
        kicker="MOST FLEXIBLE"
        name="Pro — Monthly"
        price="12€"
        unit="/ month"
        features={[
          "Unlimited servers, beats, artists",
          "MP3 + WAV upload",
          "Cancel anytime",
        ]}
        ctaLabel={pending ? "Redirecting…" : "Subscribe — 12 €/mo"}
        onCta={() => fireCheckout(STRIPE_LOOKUP_KEYS.proMonthly)}
      />
      <PlanCard
        kicker="2 MONTHS OFF"
        name="Pro — Yearly"
        price="99€"
        unit="/ year"
        features={[
          "Same as Pro Monthly",
          "Pay yearly, save ~30 %",
          "Cancel anytime",
        ]}
        ctaLabel={pending ? "Redirecting…" : "Subscribe — 99 €/yr"}
        onCta={() => fireCheckout(STRIPE_LOOKUP_KEYS.proYearly)}
        accent={planContext.plan === "lifetime"}
      />
    </div>
  );
}
