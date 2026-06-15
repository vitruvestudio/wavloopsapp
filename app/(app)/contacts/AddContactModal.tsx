/**
 * AddContactModal — popover for manually saving a contact to the
 * producer's address book.
 *
 * Shape:
 *   ┌──────────────────────────────────────────────┐
 *   │ [👤] New contact                          [✕]│
 *   │      SAVED TO YOUR ADDRESS BOOK              │
 *   │ ──────────────────────────────────────────── │
 *   │ ┌─ live preview card ────────────────────┐  │
 *   │ │ [NC] New contact / NO EMAIL YET        │  │
 *   │ └────────────────────────────────────────┘  │
 *   │ NAME · OPTIONAL    [ e.g. kayde            ] │
 *   │ EMAIL              [ artist@email.com      ] │
 *   │ PHONE · OPTIONAL   [ +1 …                  ] │
 *   │ SOCIALS & LINKS · OPTIONAL                   │
 *   │   [IG][X][YT][Genius][Website]               │
 *   │   (clicking a chip toggles an inline input)  │
 *   │ ADD TO SERVERS · OPTIONAL                    │
 *   │   [ATLANTA NIGHTS][VELOUR][UK DRILL PACK]    │
 *   │ ──────────────────────────────────────────── │
 *   │                       [Cancel][+ Create]     │
 *   └──────────────────────────────────────────────┘
 *
 * Email is the dedupe key (UNIQUE owner_id + email at the DB level).
 * Re-saving the same email upserts the optional fields and merges
 * server memberships rather than erroring — the action is idempotent
 * by design.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { addContactAction } from "./actions";
import type { ServerStub } from "./page";
import { parseSocialLink, platformLabel } from "@/lib/socials";

interface AddContactModalProps {
  allServers: ServerStub[];
  onClose: () => void;
  /** Pre-attach to these server ids — used when the modal is opened
   *  from a server detail page's "Add an artist" button so the
   *  current server is already toggled on. Defaults to []. */
  defaultServerIds?: string[];
}

interface SocialPlatform {
  key: string;
  label: string;
  icon: IconName;
  placeholder: string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", icon: "instagram", placeholder: "@kayde" },
  { key: "x", label: "X", icon: "x-logo", placeholder: "@kayde" },
  { key: "youtube", label: "YouTube", icon: "youtube", placeholder: "@kayde" },
  { key: "genius", label: "Genius", icon: "mic", placeholder: "@kayde" },
  { key: "website", label: "Website", icon: "globe", placeholder: "https://kayde.co" },
];

export function AddContactModal({
  allServers,
  onClose,
  defaultServerIds = [],
}: AddContactModalProps) {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [socials, setSocials] = React.useState<Record<string, string>>({});
  const [openSocial, setOpenSocial] = React.useState<string | null>(null);
  const [serverIds, setServerIds] = React.useState<string[]>(defaultServerIds);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  /* ─── Auto-fill from a pasted social link ─────────────────────── */
  const [quickFillInput, setQuickFillInput] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  /** What we detected from the last paste — drives the inline hint
   *  AND tells us which social field to overwrite when re-parsing. */
  const lastDetected = React.useRef<ReturnType<
    typeof parseSocialLink
  > | null>(null);

  const applyQuickFill = React.useCallback(
    (raw: string) => {
      setQuickFillInput(raw);
      const parsed = parseSocialLink(raw);
      lastDetected.current = parsed;
      if (!parsed) {
        return;
      }
      // 1. Store the canonical URL in the right social slot.
      setSocials((cur) => ({ ...cur, [parsed.platform]: parsed.url }));
      // 2. Push the avatar URL into the live-preview Avatar.
      setAvatarUrl(parsed.avatarUrl);
      // 3. If the producer hasn't typed a name yet, seed it from
      //    the handle so the preview card stops saying "New contact".
      setName((cur) =>
        cur.trim().length === 0 && parsed.platform !== "website"
          ? parsed.handle
          : cur,
      );
    },
    [],
  );

  // Lock body scroll while open.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape (unless mid-submit).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  const toggleServer = (id: string) => {
    setServerIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const updateSocial = (key: string, value: string) => {
    setSocials((cur) => ({ ...cur, [key]: value }));
  };

  const canSubmit = email.trim().length > 0 && !pending;

  const submit = () => {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await addContactAction({
        name: name.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        socials,
        avatar_url: avatarUrl,
        server_ids: serverIds,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  const previewName = name.trim() || "New contact";
  const previewEmail = email.trim() || "NO EMAIL YET";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New contact"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ padding: 18 }}
    >
      {/* Backdrop */}
      <div
        onClick={() => !pending && onClose()}
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "oklch(0 0 0 / 0.5)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Card */}
      <div
        className="relative flex flex-col bg-bg-0 border border-border-1"
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "min(820px, 92vh)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center border-b border-border-1 shrink-0"
          style={{ gap: 14, padding: "16px 18px" }}
        >
          <div
            className="flex items-center justify-center text-accent-text shrink-0"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-md)",
              background: "var(--accent-surface)",
            }}
          >
            <Icon name="user" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="t-h2" style={{ fontSize: 18 }}>
              New contact
            </div>
            <div
              className="t-mono-s truncate"
              style={{ color: "var(--fg-3)", marginTop: 3 }}
            >
              SAVED TO YOUR ADDRESS BOOK
            </div>
          </div>
          <IconButton
            name="close"
            size={32}
            iconSize={18}
            onClick={() => !pending && onClose()}
            label="Close"
          />
        </div>

        {/* Body — scrollable */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "18px" }}
        >
          {/* Live preview card */}
          <div
            className="flex items-center border border-border-1 bg-bg-1"
            style={{
              gap: 12,
              padding: "14px",
              borderRadius: "var(--r-md)",
              marginBottom: 18,
            }}
          >
            <Avatar name={previewName} src={avatarUrl} size={42} />
            <div className="min-w-0 flex-1">
              <div
                className="truncate"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                }}
              >
                {previewName}
              </div>
              <div
                className="t-mono-s truncate"
                style={{
                  color: email.trim() ? "var(--fg-2)" : "var(--fg-4)",
                  marginTop: 3,
                  textTransform: email.trim() ? "none" : "uppercase",
                  letterSpacing: email.trim() ? "0" : "0.08em",
                }}
              >
                {previewEmail}
              </div>
            </div>
          </div>

          {/* Quick-fill: paste a social link → auto-fill avatar + name + social slot */}
          <div style={{ marginBottom: 18 }}>
            <div className="t-mono-s" style={{ marginBottom: 8 }}>
              PASTE A SOCIAL LINK · AUTO-FILL
            </div>
            <div
              className="flex items-center bg-bg-inset border border-border-2 transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
              style={{
                height: 42,
                padding: "0 14px",
                gap: 10,
                borderRadius: "var(--r-md)",
              }}
            >
              <Icon name="link" size={15} className="text-fg-3" />
              <input
                value={quickFillInput}
                onChange={(e) => applyQuickFill(e.target.value)}
                placeholder="instagram.com/kayde, youtube.com/@kayde…"
                className="flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4 min-w-0"
                style={{ fontFamily: "var(--font-body)", fontSize: 14 }}
              />
              {lastDetected.current && (
                <Icon
                  name="check"
                  size={14}
                  style={{ color: "var(--accent-text)" }}
                />
              )}
            </div>
            {lastDetected.current && (
              <div
                className="t-mono-s"
                style={{
                  color: "var(--accent-text)",
                  marginTop: 6,
                }}
              >
                DETECTED · {platformLabel(lastDetected.current.platform)} ·{" "}
                {lastDetected.current.handle}
              </div>
            )}
            {quickFillInput.trim() && !lastDetected.current && (
              <div
                className="t-mono-s"
                style={{ color: "var(--fg-4)", marginTop: 6 }}
              >
                NOT A RECOGNISED LINK · FILL THE FIELDS MANUALLY
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="t-body-s"
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                background: "var(--danger-surface)",
                color: "var(--danger)",
                border: "1px solid var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col" style={{ gap: 16 }}>
            <Field
              label="NAME · OPTIONAL"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. kayde"
            />
            <Field
              label="EMAIL"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artist@email.com"
              required
            />
            <Field
              label="PHONE · OPTIONAL"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 …"
            />

            {/* Socials */}
            <div>
              <div className="t-mono-s" style={{ marginBottom: 10 }}>
                SOCIALS & LINKS · OPTIONAL
              </div>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {SOCIAL_PLATFORMS.map((p) => {
                  const value = socials[p.key] ?? "";
                  const filled = value.trim().length > 0;
                  const open = openSocial === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setOpenSocial(open ? null : p.key)}
                      className="inline-flex items-center cursor-pointer transition-all duration-fast"
                      style={{
                        gap: 6,
                        padding: "6px 12px",
                        height: 30,
                        borderRadius: "var(--r-pill)",
                        border: `1px solid ${filled ? "var(--accent)" : "var(--border-1)"}`,
                        background: filled
                          ? "var(--accent-surface)"
                          : open
                            ? "var(--bg-2)"
                            : "var(--bg-1)",
                        color: filled ? "var(--accent-text)" : "var(--fg-2)",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      <Icon name={p.icon} size={13} />
                      {p.label}
                      {filled && <Icon name="check" size={12} />}
                    </button>
                  );
                })}
              </div>
              {openSocial && (
                <div style={{ marginTop: 12 }}>
                  <Field
                    label={
                      SOCIAL_PLATFORMS.find((p) => p.key === openSocial)
                        ?.label.toUpperCase() ?? ""
                    }
                    value={socials[openSocial] ?? ""}
                    onChange={(e) =>
                      updateSocial(openSocial, e.target.value)
                    }
                    placeholder={
                      SOCIAL_PLATFORMS.find((p) => p.key === openSocial)
                        ?.placeholder ?? ""
                    }
                  />
                </div>
              )}
            </div>

            {/* Servers */}
            {allServers.length > 0 && (
              <div>
                <div className="t-mono-s" style={{ marginBottom: 10 }}>
                  ADD TO SERVERS · OPTIONAL
                </div>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {allServers.map((s) => {
                    const selected = serverIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleServer(s.id)}
                        className="inline-flex items-center cursor-pointer transition-all duration-fast"
                        style={{
                          gap: 6,
                          padding: "6px 12px",
                          height: 30,
                          borderRadius: "var(--r-pill)",
                          border: `1px solid ${selected ? "var(--accent)" : "var(--border-1)"}`,
                          background: selected
                            ? "var(--accent-surface)"
                            : "var(--bg-1)",
                          color: selected
                            ? "var(--accent-text)"
                            : "var(--fg-2)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        <Icon name="server" size={12} />
                        {s.name}
                        {selected && <Icon name="check" size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end border-t border-border-1 shrink-0"
          style={{ padding: "14px 18px", gap: 8 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => !pending && onClose()}
            disabled={pending}
            className="!h-[36px]"
          >
            Cancel
          </Button>
          <Button
            icon="plus"
            size="sm"
            onClick={submit}
            disabled={!canSubmit}
            className="!h-[36px]"
          >
            {pending ? "Saving…" : "Create contact"}
          </Button>
        </div>
      </div>
    </div>
  );
}
