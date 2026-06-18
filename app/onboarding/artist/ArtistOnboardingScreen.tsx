/**
 * ArtistOnboardingScreen — single-step artist profile setup.
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  Logo                                                │
 *   │                                                      │
 *   │  WELCOME · STEP 1 OF 1                               │
 *   │  Set up your profile                                 │
 *   │  Producers see this name on every note + comment.    │
 *   │                                                      │
 *   │  ┌──────────────────────────────────────────┐       │
 *   │  │  [ avatar 96px upload ]                  │       │
 *   │  │  DISPLAY NAME                            │       │
 *   │  │  [ ...                              ]    │       │
 *   │  └──────────────────────────────────────────┘       │
 *   │                                                      │
 *   │  [ Continue → ]    Skip for now                      │
 *   └──────────────────────────────────────────────────────┘
 *
 * Intentionally minimal: display name + optional avatar. The
 * deeper "bio / socials / notif prefs" lives in /listen/settings
 * — the goal here is to get the artist into the app fast.
 */

"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import {
  saveArtistProfileAction,
  skipArtistOnboardingAction,
  type ArtistOnboardingResult,
} from "./actions";

export interface ArtistOnboardingScreenProps {
  /** Email-local-part of the authed user, used to prefill the
   *  display-name field on first render. */
  suggestedDisplayName: string;
}

export function ArtistOnboardingScreen({
  suggestedDisplayName,
}: ArtistOnboardingScreenProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState(suggestedDisplayName);
  const [avatarDataUrl, setAvatarDataUrl] = React.useState<string | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 2 MB hard cap — base64 inflates by ~33% so 2 MB image →
    // ~2.6 MB JSON payload, still well under the server-action
    // body limit. Above that the wizard would silently hang on
    // submit.
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res: ArtistOnboardingResult = await saveArtistProfileAction({
        displayName,
        avatarDataUrl,
      });
      // Successful action calls redirect() server-side, so the
      // only reachable return path is the error case.
      if (res.error) setError(res.error);
    });
  };

  const skip = () => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await skipArtistOnboardingAction();
      if (res.error) setError(res.error);
    });
  };

  return (
    <main
      className="min-h-[100dvh] bg-bg-0 relative"
      style={{ paddingBottom: 64 }}
    >
      {/* Radial accent glow — same vocab as /auth so the user
          feels they're still in the same surface. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(60% 40% at 50% 0%, var(--accent-surface), transparent 60%)",
        }}
      />

      <div className="relative">
        <header
          className="flex items-center justify-between"
          style={{ padding: "32px 32px 0" }}
        >
          <Logo size={26} />
          <button
            type="button"
            onClick={skip}
            disabled={pending}
            className="t-mono-s cursor-pointer border-0 bg-transparent p-0"
            style={{
              color: "var(--fg-3)",
              letterSpacing: "0.08em",
            }}
          >
            SKIP FOR NOW
          </button>
        </header>

        <div
          className="mx-auto flex flex-col"
          style={{
            maxWidth: 480,
            padding: "56px 24px 0",
            gap: 26,
          }}
        >
          <div>
            <div
              className="t-mono-s"
              style={{ color: "var(--accent-text)", marginBottom: 12 }}
            >
              WELCOME · STEP 1 OF 1
            </div>
            <h1 className="t-h1" style={{ fontSize: 32 }}>
              Set up your profile
            </h1>
            <p
              className="t-body"
              style={{
                color: "var(--fg-3)",
                marginTop: 10,
                lineHeight: 1.55,
              }}
            >
              Producers see this name on every note and comment you leave.
              You can change it later from Settings.
            </p>
          </div>

          <div
            className="border border-border-1"
            style={{
              padding: "24px",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
            }}
          >
            {/* Avatar uploader */}
            <div className="flex items-center" style={{ gap: 18 }}>
              <label
                htmlFor="artist-avatar"
                className="cursor-pointer shrink-0 relative"
                style={{ width: 88, height: 88 }}
              >
                {avatarDataUrl ? (
                  <img
                    src={avatarDataUrl}
                    alt="Avatar preview"
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid var(--border-1)",
                    }}
                  />
                ) : (
                  <Avatar
                    name={displayName || "you"}
                    size={88}
                    src={null}
                  />
                )}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    borderRadius: "50%",
                    background:
                      "linear-gradient(0deg, oklch(0 0 0 / 0.5), oklch(0 0 0 / 0.3))",
                    opacity: 0,
                    transition: "opacity var(--dur-fast) var(--ease)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <Icon name="upload" size={20} style={{ color: "#fff" }} />
                </div>
              </label>
              <input
                id="artist-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={pending}
              />
              <div className="min-w-0 flex-1">
                <div
                  className="t-mono-s"
                  style={{ color: "var(--fg-4)", marginBottom: 4 }}
                >
                  AVATAR
                </div>
                <p
                  className="t-body-s"
                  style={{ color: "var(--fg-3)", margin: 0 }}
                >
                  Tap the circle to upload — PNG or JPG, up to 2 MB.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <Field
                label="DISPLAY NAME"
                name="displayName"
                placeholder="@yourname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={pending}
                autoComplete="off"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="t-body-s"
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-sm)",
                background: "var(--danger-surface)",
                color: "var(--danger)",
                border: "1px solid var(--danger)",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <div
            className="flex items-center"
            style={{ gap: 18, marginTop: 4 }}
          >
            <Button
              type="button"
              size="lg"
              full
              disabled={pending || !displayName.trim()}
              onClick={submit}
              icon="arrow-right"
            >
              {pending ? "Saving…" : "Continue"}
            </Button>
          </div>

          <div
            className="t-body-s"
            style={{
              color: "var(--fg-4)",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Want to share your own beats too?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth?as=producer")}
              className="cursor-pointer border-0 bg-transparent p-0"
              style={{
                color: "var(--accent-text)",
                fontFamily: "var(--font-body)",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Sign up as a producer instead
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
