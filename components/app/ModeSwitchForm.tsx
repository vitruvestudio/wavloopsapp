/**
 * ModeSwitchForm — wraps a mode-switch server action with a
 * branded full-screen loading overlay.
 *
 * Without it, clicking "Switch to X view" felt brutal: the menu
 * closed and the new shell appeared as soon as the server-action
 * redirect resolved. No transition, no breathing room, no signal
 * that the app was actually doing something.
 *
 * Now: pressing the menu item flips a transient state that
 * mounts a fixed overlay (scrim + blurred backdrop + animated
 * Wavloops glyph + role-specific copy). The server action runs
 * underneath; once the redirect lands, the new shell paints and
 * the overlay vanishes naturally with the page swap.
 *
 * Implementation note: useFormStatus only works for descendants
 * of the same <form>, so the overlay is rendered inside the form
 * too. It's `position: fixed` with a high z-index — it escapes
 * the menu's clipped bounds and covers the viewport.
 */

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { Logomark } from "@/components/ui/Logo";

interface ModeSwitchFormProps {
  /** Server action — switchToArtistViewAction or
   *  switchToProducerViewAction. */
  action: () => void | Promise<void>;
  /** Target mode the user is switching INTO. Drives the icon,
   *  the label, and the overlay headline so the copy matches the
   *  destination shell. */
  target: "artist" | "producer";
}

export function ModeSwitchForm({ action, target }: ModeSwitchFormProps) {
  const label =
    target === "artist"
      ? "Switch to Artist view"
      : "Switch to Producer view";
  const icon = target === "artist" ? "play" : "library";
  return (
    <form action={action} style={{ margin: 0 }}>
      <SubmitButton label={label} icon={icon} />
      <Overlay target={target} />
    </form>
  );
}

function SubmitButton({
  label,
  icon,
}: {
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      className="flex w-full items-center text-fg-2 transition-colors duration-fast hover:bg-bg-3 hover:text-fg-1"
      style={{
        height: 38,
        padding: "0 10px",
        gap: 11,
        borderRadius: "var(--r-sm)",
        background: "transparent",
        border: "none",
        cursor: pending ? "wait" : "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        textAlign: "left",
        opacity: pending ? 0.5 : 1,
      }}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  );
}

function Overlay({ target }: { target: "artist" | "producer" }) {
  const { pending } = useFormStatus();
  // Mount the overlay through a portal into document.body so it
  // escapes any ancestor that creates a containing block for
  // position:fixed — ArtistTopbar uses backdrop-filter: blur,
  // which alone is enough to trap a fixed descendant inside the
  // header box instead of letting it cover the viewport.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!pending || !mounted) return null;
  const headline =
    target === "artist"
      ? "Loading your artist space…"
      : "Loading your producer studio…";
  const sub =
    target === "artist"
      ? "Lining up beats from your producers"
      : "Tuning up your library and dashboard";
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9999,
        background: "color-mix(in oklch, var(--bg-0) 78%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        animation: "wlpModeSwitchFadeIn 220ms var(--ease) both",
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: 22, padding: "0 24px", textAlign: "center" }}
      >
        {/* Animated glyph: the Wavloops logomark with a slow
            scale-pulse + a thin accent ring orbiting behind it.
            Pure CSS so it costs nothing and stays sharp. */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 96, height: 96 }}
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              borderTopColor: "transparent",
              animation: "wlpModeSwitchSpin 1.1s linear infinite",
            }}
          />
          <span
            aria-hidden
            className="absolute inset-2"
            style={{
              borderRadius: "50%",
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--accent) 22%, transparent) 0%, transparent 70%)",
              animation:
                "wlpModeSwitchPulse 1.6s var(--ease) infinite",
            }}
          />
          <Logomark size={42} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--fg-1)",
              letterSpacing: "-0.01em",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--fg-3)",
            }}
          >
            {sub}
          </div>
        </div>
      </div>

      {/* Inline keyframes scoped to this overlay — keeps the
          animation collocated with its only consumer instead of
          polluting globals.css. */}
      <style>{`
        @keyframes wlpModeSwitchFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes wlpModeSwitchSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes wlpModeSwitchPulse {
          0%, 100% { transform: scale(0.9); opacity: 0.6; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
