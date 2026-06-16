/**
 * BeatNoteModal — note an artist attaches to a beat, with a
 * Private vs. Share-with-producer toggle.
 *
 * Opens from the message icon on a BeatRow. Title block shows the
 * beat cover + name + a dynamic mono kicker that reads the chosen
 * visibility back to the artist ("YOUR PRIVATE NOTE" vs. "SHARING
 * WITH @MRTLMAN"). Body is a single textarea, then a segmented
 * Visibility control, then a reminder line that reflects the
 * current choice.
 *
 * Default visibility is "private" — safer fail mode (an artist who
 * doesn't touch the control never accidentally publishes a note
 * the producer can read).
 *
 * Phase 1: visibility + text live in the parent component's local
 * state (Record<beatId, BeatNote>). Phase 3 splits them at the DB:
 *   - private → beat_notes scoped to (contact_id, beat_id)
 *   - shared  → beat_comments visible to the beat's producer
 * Same modal contract either way — the producer-facing wiring
 * lands in a separate commit.
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import type { BeatNoteVisibility, MockBeat } from "../_mock";

interface BeatNoteModalProps {
  beat: MockBeat;
  /** Current saved note text for this beat (empty string when none). */
  initialNote: string;
  /** Current saved visibility for this beat. Defaults to private
   *  for new notes when the parent passes "private". */
  initialVisibility: BeatNoteVisibility;
  /** The producer's @handle — interpolated into the "share" copy
   *  ("SHARING WITH @MRTLMAN") so the artist sees exactly who will
   *  receive the note. */
  producerHandle: string;
  onClose: () => void;
  onSave: (text: string, visibility: BeatNoteVisibility) => void;
}

export function BeatNoteModal({
  beat,
  initialNote,
  initialVisibility,
  producerHandle,
  onClose,
  onSave,
}: BeatNoteModalProps) {
  const [draft, setDraft] = React.useState(initialNote);
  const [visibility, setVisibility] =
    React.useState<BeatNoteVisibility>(initialVisibility);

  // Lock body scroll + close on Escape.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const submit = () => {
    onSave(draft.trim(), visibility);
    onClose();
  };

  const isShared = visibility === "shared";
  const dirty =
    draft !== initialNote || visibility !== initialVisibility;

  const handleUpper = producerHandle.toUpperCase();
  const kicker = isShared
    ? `SHARING WITH @${handleUpper} · ${beat.bpm} BPM · ${beat.key}`
    : `YOUR PRIVATE NOTE · ${beat.bpm} BPM · ${beat.key}`;
  const reminder = isShared ? (
    <>
      <Icon name="users" size={11} />@{handleUpper} WILL SEE THIS NOTE
    </>
  ) : (
    <>
      <Icon name="lock" size={11} />
      ONLY VISIBLE TO YOU
    </>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Note for ${beat.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ padding: 18 }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
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
          maxWidth: 560,
          maxHeight: "min(640px, 90vh)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center border-b border-border-1 shrink-0"
          style={{ gap: 14, padding: "16px 18px" }}
        >
          {/* Cover thumb */}
          <div
            className="relative overflow-hidden shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--r-sm)",
            }}
          >
            <CoverArt fill seed={beat.artSeed} src={beat.coverUrl} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--fg-1)",
              }}
            >
              {beat.title}
            </div>
            <div
              className="t-mono-s truncate"
              style={{
                color: isShared ? "var(--accent-text)" : "var(--fg-3)",
                marginTop: 3,
              }}
            >
              {kicker}
            </div>
          </div>
          <IconButton
            name="close"
            size={32}
            iconSize={18}
            onClick={onClose}
            label="Close"
          />
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: 18 }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isShared
                ? "Talk to the producer — what's hitting, what's missing, what you'd want changed."
                : "Write a note — ideas, lyrics, where this fits, follow-up to yourself…"
            }
            rows={6}
            className="w-full bg-bg-inset border border-border-2 text-fg-1 outline-none placeholder:text-fg-4 transition-all duration-fast focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]"
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-body)",
              fontSize: 14.5,
              lineHeight: 1.55,
              resize: "vertical",
              minHeight: 140,
            }}
            autoFocus
          />

          {/* Visibility selector — segmented control. Two big
              hit-targets so the choice is unambiguous, not a sneaky
              toggle the artist could miss. */}
          <div
            className="t-mono-s"
            style={{
              marginTop: 16,
              marginBottom: 8,
              color: "var(--fg-3)",
            }}
          >
            VISIBILITY
          </div>
          <div
            className="grid grid-cols-2"
            style={{
              gap: 8,
            }}
          >
            <VisibilityChoice
              icon="lock"
              label="Private note"
              sub="Only you"
              active={!isShared}
              onClick={() => setVisibility("private")}
            />
            <VisibilityChoice
              icon="users"
              label="Share with producer"
              sub={`@${producerHandle} sees it`}
              active={isShared}
              onClick={() => setVisibility("shared")}
            />
          </div>

          {/* Reminder line — colour + icon track the current
              choice so the artist always sees what's about to ship. */}
          <div
            className="t-mono-s inline-flex items-center"
            style={{
              marginTop: 14,
              gap: 6,
              color: isShared
                ? "var(--accent-text)"
                : "var(--fg-3)",
            }}
          >
            {reminder}
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
            onClick={onClose}
            className="!h-[36px]"
          >
            Cancel
          </Button>
          <Button
            icon="check"
            size="sm"
            onClick={submit}
            disabled={!dirty}
            className="!h-[36px]"
          >
            {isShared ? "Share note" : "Save note"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Single tile in the Visibility segmented control. Active tile
 *  picks up the accent surface + a coloured icon square so the
 *  current choice is hard to miss. */
function VisibilityChoice({
  icon,
  label,
  sub,
  active,
  onClick,
}: {
  icon: "lock" | "users";
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center cursor-pointer transition-colors duration-fast"
      style={{
        gap: 12,
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        border: active
          ? "1px solid var(--accent)"
          : "1px solid var(--border-2)",
        background: active ? "var(--accent-surface)" : "var(--bg-1)",
        color: "var(--fg-1)",
        textAlign: "left",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--r-sm)",
          background: active ? "var(--accent)" : "var(--bg-3)",
          color: active ? "#fff" : "var(--fg-2)",
        }}
      >
        <Icon name={icon} size={15} />
      </div>
      <div className="min-w-0">
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--fg-1)",
          }}
        >
          {label}
        </div>
        <div
          className="truncate"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--fg-3)",
            letterSpacing: "0.04em",
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}
