/**
 * BeatNoteModal — private note an artist attaches to a beat.
 *
 * Opens from the message icon on a BeatRow. Title block shows the
 * beat cover + name + mono kicker (YOUR PRIVATE NOTE · BPM · KEY).
 * Body is a single textarea; below it a "ONLY VISIBLE TO YOU"
 * reminder so the artist doesn't mistake it for a public comment to
 * the producer.
 *
 * Phase 1: note value lives in the parent component's local state
 * (ServerView holds a Record<beatId, string>). Phase 3 will swap
 * for a `beat_notes` table scoped to (contact_id, beat_id).
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import type { MockBeat } from "../_mock";

interface BeatNoteModalProps {
  beat: MockBeat;
  /** Current saved note value for this beat (empty string when none). */
  initialNote: string;
  onClose: () => void;
  onSave: (next: string) => void;
}

export function BeatNoteModal({
  beat,
  initialNote,
  onClose,
  onSave,
}: BeatNoteModalProps) {
  const [draft, setDraft] = React.useState(initialNote);

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
    onSave(draft.trim());
    onClose();
  };

  const dirty = draft !== initialNote;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Private note for ${beat.title}`}
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
            <CoverArt fill seed={beat.artSeed} />
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
              style={{ color: "var(--fg-3)", marginTop: 3 }}
            >
              YOUR PRIVATE NOTE · {beat.bpm} BPM · {beat.key}
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
            placeholder="Write a note — ideas, lyrics, where this fits, follow-up with the producer…"
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
          <div
            className="t-mono-s inline-flex items-center"
            style={{
              marginTop: 10,
              gap: 6,
              color: "var(--fg-3)",
            }}
          >
            <Icon name="lock" size={11} />
            ONLY VISIBLE TO YOU
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
            Save note
          </Button>
        </div>
      </div>
    </div>
  );
}
