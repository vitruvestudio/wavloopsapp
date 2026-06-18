/**
 * ArtistSettingsPage — Edit profile / Notifications.
 *
 * Design code is a 1:1 port of the producer Settings tabs
 * (app/(app)/settings/SettingsPage.tsx) — SectionCard, the
 * left-rail SettingsNav button style, the Toggle pill, the
 * social-links row pattern — only the data shape and the two
 * relevant tabs change for the artist surface.
 *
 * Header differs from the producer's PageHeader: per Theo's
 * screenshot the artist Settings uses a back arrow + "Settings"
 * title + a top-right "Save changes" button instead.
 *
 * Phase 3.7 — state is initialized from the server-fetched
 * artist_profiles row (parent /settings/page.tsx) and persisted
 * via updateArtistProfileAction. Avatar upload lands in a
 * follow-up commit.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOutArtistAction } from "@/app/auth/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { updateArtistProfileAction } from "../actions";
import type { ArtistNotifPrefs } from "../_data";

type TabKey = "profile" | "notifications";

export interface ArtistSettingsInitial {
  email: string;
  displayName: string;
  bio: string;
  socials: Record<string, string>;
  notifPrefs: ArtistNotifPrefs;
  /** Public URL of the artist's avatar, or null if none set yet. */
  avatarUrl: string | null;
}

/** Inputs for the SOCIAL LINKS card. Order + icons mirror the
 *  artist gate page's social chips. Same row pattern as the
 *  producer's SOCIAL_FIELDS in app/(app)/settings/SettingsPage.tsx. */
const SOCIAL_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  icon: IconName;
  placeholder: string;
}> = [
  { key: "instagram", label: "Instagram", icon: "instagram", placeholder: "@handle" },
  { key: "x", label: "X", icon: "x-logo", placeholder: "@handle" },
  { key: "youtube", label: "YouTube", icon: "youtube", placeholder: "Channel name" },
  { key: "website", label: "Website", icon: "globe", placeholder: "https://…" },
];

const BIO_MAX = 180;

export function ArtistSettingsPage({
  initial,
}: {
  initial: ArtistSettingsInitial;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabKey>("profile");
  const [savedFlash, setSavedFlash] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // ── Profile tab state ────────────────────────────────────────
  const [displayName, setDisplayName] = React.useState(initial.displayName);
  const [bio, setBio] = React.useState(initial.bio);
  const [socials, setSocials] = React.useState<Record<string, string>>(
    initial.socials,
  );

  // ── Notifications tab state ──────────────────────────────────
  const [prefs, setPrefs] = React.useState<ArtistNotifPrefs>(
    initial.notifPrefs,
  );

  const togglePref = (key: keyof ArtistNotifPrefs) =>
    setPrefs((cur) => ({ ...cur, [key]: !cur[key] }));

  // ── Avatar state ─────────────────────────────────────────────
  // avatarDataUrl holds the new pick as base64 (sent to the action),
  // avatarCleared marks an explicit Remove. avatarPreview is what the
  // <Avatar src> renders right now — pick wins over stored URL, and
  // Clear wins over both. Pattern mirrors producer SettingsPage.
  const [avatarDataUrl, setAvatarDataUrl] = React.useState<string | null>(
    null,
  );
  const [avatarCleared, setAvatarCleared] = React.useState(false);
  const avatarPreview = avatarCleared
    ? null
    : (avatarDataUrl ?? initial.avatarUrl);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // Reset so re-picking the same file fires onChange again.
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

  const onClearAvatar = () => {
    setAvatarDataUrl(null);
    setAvatarCleared(true);
  };

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateArtistProfileAction({
        displayName,
        bio,
        socials,
        notifPrefs: prefs,
        avatarDataUrl,
        clearAvatar: avatarCleared,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }
      // Reset local avatar state so the next save uses the new
      // server URL as baseline. router.refresh() pulls the fresh
      // public URL from artist_profiles for the <Avatar src>.
      setAvatarDataUrl(null);
      setAvatarCleared(false);
      router.refresh();
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    });
  };

  return (
    <main className="flex-1 min-w-0 px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
      {/* ── Top header — back arrow + title + Save changes.
              Replaces the producer's PageHeader to match Theo's
              spec for this page. ──────────────────────────── */}
      <div
        className="flex items-center"
        style={{ gap: 14, marginBottom: 24 }}
      >
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border-1)",
            background: "var(--bg-1)",
            color: "var(--fg-2)",
          }}
        >
          <Icon name="chevron-left" size={18} />
        </button>
        <h1
          className="t-h1 flex-1"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(24px, 4vw, 34px)",
            letterSpacing: "-0.02em",
            color: "var(--fg-1)",
            margin: 0,
          }}
        >
          Settings
        </h1>
        <Button
          onClick={onSave}
          icon="check"
          variant="primary"
          disabled={isPending}
        >
          {isPending
            ? "Saving…"
            : savedFlash
              ? "Saved"
              : "Save changes"}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="t-body-s"
          style={{
            marginBottom: 18,
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

      {/* ── Grid : left rail (220px) + tab content ─────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]"
        style={{ gap: 28 }}
      >
        <SettingsNav tab={tab} onChange={setTab} />

        {tab === "profile" ? (
          <ProfileTab
            displayName={displayName}
            setDisplayName={setDisplayName}
            bio={bio}
            setBio={setBio}
            socials={socials}
            setSocials={setSocials}
            avatarPreview={avatarPreview}
            onPickAvatar={onPickAvatar}
            onClearAvatar={onClearAvatar}
          />
        ) : (
          <NotificationsTab
            email={initial.email}
            prefs={prefs}
            togglePref={togglePref}
          />
        )}
      </div>
    </main>
  );
}

/* ============================================================
   SettingsNav — left-side tab rail (mobile: horizontal scroll).
   Same button shape + accent-surface active state as the
   producer SettingsNav, plus a Log out danger button after a
   divider per Theo's spec.
   ============================================================ */

function SettingsNav({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const items: Array<{ key: TabKey; label: string; icon: IconName }> = [
    { key: "profile", label: "Edit profile", icon: "user" },
    { key: "notifications", label: "Notifications", icon: "bell" },
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
      {/* Divider — only visible on lg+ where the rail is vertical. */}
      <div
        aria-hidden
        className="hidden lg:block"
        style={{
          height: 1,
          background: "var(--border-1)",
          margin: "10px 0",
        }}
      />
      {/* Log out — Phase 2 wired to signOutArtistAction. Lives in
          its own <form> so the server action runs cleanly. */}
      <form action={signOutArtistAction} style={{ display: "contents" }}>
        <button
          type="submit"
          className="inline-flex items-center cursor-pointer transition-colors duration-fast shrink-0"
          style={{
            gap: 10,
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            border: "none",
            background: "transparent",
            color: "var(--danger)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 500,
            textAlign: "left",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--danger-surface)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Icon name="log-out" size={16} />
          Log out
        </button>
      </form>
    </nav>
  );
}

/* ============================================================
   ProfileTab — avatar + display name + bio + social links.
   ============================================================ */

interface ProfileTabProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  socials: Record<string, string>;
  setSocials: (next: Record<string, string>) => void;
  avatarPreview: string | null;
  onPickAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAvatar: () => void;
}

function ProfileTab({
  displayName,
  setDisplayName,
  bio,
  setBio,
  socials,
  setSocials,
  avatarPreview,
  onPickAvatar,
  onClearAvatar,
}: ProfileTabProps) {
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      <SectionCard kicker="ARTIST PROFILE" title="Your profile">
        <p
          className="t-body"
          style={{ color: "var(--fg-3)", marginBottom: 22 }}
        >
          How producers see you when you join their servers.
        </p>

        {/* Avatar + Change / Remove — Change relabels Upload when
                no photo is set yet so the affordance reads right. */}
        <div
          className="flex items-center"
          style={{ gap: 18, marginBottom: 22, flexWrap: "wrap" }}
        >
          <Avatar
            name={displayName || "Artist"}
            src={avatarPreview}
            size={64}
          />
          <div className="flex items-center" style={{ gap: 6 }}>
            <Button
              variant="secondary"
              size="sm"
              icon="upload"
              onClick={() => avatarInputRef.current?.click()}
              className="!h-[36px]"
            >
              {avatarPreview ? "Change" : "Upload photo"}
            </Button>
            {avatarPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAvatar}
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

        {/* Hairline */}
        <div
          aria-hidden
          style={{
            height: 1,
            background: "var(--border-1)",
            margin: "0 0 22px",
          }}
        />

        {/* Display name — Field primitive with user-icon prefix. */}
        <div style={{ marginBottom: 22 }}>
          <Field
            label="DISPLAY NAME"
            icon="user"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your stage name"
          />
        </div>

        {/* Bio — textarea + character counter. No primitive for
            multi-line yet, so inlining with the same border / fill
            tokens the Field primitive uses for visual parity. */}
        <div style={{ marginBottom: 22 }}>
          <label
            className="t-mono-s"
            style={{
              color: "var(--fg-3)",
              marginBottom: 8,
              display: "block",
            }}
          >
            BIO
          </label>
          <textarea
            value={bio}
            onChange={(e) =>
              setBio(e.target.value.slice(0, BIO_MAX))
            }
            rows={4}
            placeholder="A short pitch — what you make, who you work with."
            className="w-full bg-bg-inset border border-border-2 text-fg-1 outline-none placeholder:text-fg-4 transition-all duration-fast focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]"
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-body)",
              fontSize: 14.5,
              lineHeight: 1.5,
              resize: "vertical",
              minHeight: 96,
            }}
          />
          <div
            className="t-mono-s"
            style={{
              color: "var(--fg-4)",
              textAlign: "right",
              marginTop: 6,
            }}
          >
            {bio.length}/{BIO_MAX}
          </div>
        </div>

        {/* Social links — same horizontal row pattern as the
            producer's SOCIAL_FIELDS rendering. */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--fg-1)",
            marginBottom: 10,
          }}
        >
          Social links
        </div>
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
    </div>
  );
}

/* ============================================================
   NotificationsTab — activity toggles + delivery channels.
   ============================================================ */

const ACTIVITY_PREFS: ReadonlyArray<{
  key: keyof ArtistNotifPrefs;
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    key: "new_beats",
    icon: "upload",
    title: "New beats added",
    body: "When a producer drops beats in a server you're in",
  },
  {
    key: "added_to_server",
    icon: "plus",
    title: "Added to a server",
    body: "When a producer adds you to a new server",
  },
  {
    key: "producer_reactions",
    icon: "heart",
    title: "Producer reactions",
    body: "When a producer reacts to your notes or saves",
  },
];

function NotificationsTab({
  email,
  prefs,
  togglePref,
}: {
  email: string;
  prefs: ArtistNotifPrefs;
  togglePref: (key: keyof ArtistNotifPrefs) => void;
}) {
  const channelPrefs: ReadonlyArray<{
    key: keyof ArtistNotifPrefs;
    icon: IconName;
    title: string;
    body: string;
  }> = [
    { key: "email", icon: "mail", title: "Email", body: email || "—" },
    {
      key: "push",
      icon: "bell",
      title: "Push notifications",
      body: "In-app and browser push",
    },
  ];
  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      <SectionCard
        kicker="ACTIVITY"
        title="What you hear about"
      >
        <p
          className="t-body"
          style={{ color: "var(--fg-3)", marginBottom: 18 }}
        >
          Choose which producer activity reaches you.
        </p>
        <PrefList items={ACTIVITY_PREFS} prefs={prefs} onToggle={togglePref} />
      </SectionCard>

      <SectionCard
        kicker="CHANNELS"
        title="How you're notified"
      >
        <PrefList items={channelPrefs} prefs={prefs} onToggle={togglePref} />
      </SectionCard>
    </div>
  );
}

function PrefList({
  items,
  prefs,
  onToggle,
}: {
  items: ReadonlyArray<{
    key: keyof ArtistNotifPrefs;
    icon: IconName;
    title: string;
    body: string;
  }>;
  prefs: ArtistNotifPrefs;
  onToggle: (key: keyof ArtistNotifPrefs) => void;
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
            borderTop:
              i === 0 ? "none" : "1px solid var(--border-1)",
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

/* ============================================================
   SectionCard + Toggle — verbatim ports of the producer's
   private helpers so the visual chrome stays identical.
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
      className="inline-flex items-center cursor-pointer transition-colors duration-fast shrink-0"
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
