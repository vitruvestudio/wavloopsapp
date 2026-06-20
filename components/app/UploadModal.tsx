/**
 * UploadModal — file-picker modal opened from /library.
 *
 * Single job: get a File. Once the user picks one (drag-drop OR
 * Browse), the modal stores it in the pending-upload singleton and
 * navigates to /library/upload, where the setup form takes over.
 *
 *   ┌─ ▦ Upload a beat ─────────────────────── × ┐
 *   │                                            │
 *   │  ┌─ dashed dropzone ──────────────────┐   │
 *   │  │           ▴                          │   │
 *   │  │     Drop your beat to upload          │   │
 *   │  │   WAV, MP3, AIFF or FLAC. Auto-       │   │
 *   │  │   detected tempo + key + length.      │   │
 *   │  │   [Browse files]  Use a sample        │   │
 *   │  └────────────────────────────────────┘   │
 *   └────────────────────────────────────────────┘
 *
 * Validation matches the setup page: audio mimetype + 100 MB cap.
 * "Use a sample" is a V1.1 hook (Splice-style starter pack) — disabled
 * with a tooltip in V1.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { UpgradeRequiredModal } from "@/components/billing/UpgradeRequiredModal";
import type { PlanKey } from "@/lib/billing/plans";
import { setPendingFile } from "@/lib/pending-upload";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  /** Effective billing plan — gates the audio-format whitelist
   *  up here so a Free user dropping a WAV gets the upgrade
   *  modal immediately, without leaving the Beat library. */
  currentPlan?: PlanKey;
  /** Allowed file extensions for the current plan. Defaults to
   *  the Pro family so legacy callers that haven't been wired
   *  yet stay permissive (the saveBeatAction gate is still the
   *  last line of defense). */
  allowedAudioExts?: readonly string[];
}

const DEFAULT_ALLOWED_EXTS = [
  "mp3",
  "wav",
  "wave",
  "flac",
  "aiff",
  "aif",
  "m4a",
  "aac",
  "ogg",
  "opus",
] as const;

export function UploadModal({
  open,
  onClose,
  currentPlan,
  allowedAudioExts = DEFAULT_ALLOWED_EXTS,
}: UploadModalProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  /** When the picked file isn't allowed on the current plan we
   *  pop the UpgradeRequiredModal RIGHT HERE — no navigation to
   *  /library/upload, the user stays on the Beat library page
   *  behind us. Dismissing the upgrade modal closes the picker
   *  in one click. */
  const [upgradeCtx, setUpgradeCtx] = React.useState<{
    plan: PlanKey;
    reason: string;
  } | null>(null);

  const handleFile = React.useCallback(
    (f: File) => {
      if (!f.type.startsWith("audio/")) {
        setError("Please upload an audio file (WAV, MP3, AIFF, FLAC).");
        return;
      }
      if (f.size > 100 * 1024 * 1024) {
        setError("Audio file is over 100 MB. Compress and try again.");
        return;
      }
      // Plan-aware format gate — runs here so a Free user
      // dropping a WAV never leaves /library. The saveBeatAction
      // gate stays as defense-in-depth for direct API calls.
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      const allowedSet = new Set(allowedAudioExts);
      if (currentPlan && currentPlan !== "pro" && !allowedSet.has(ext)) {
        const niceList = allowedAudioExts
          .map((e) => e.toUpperCase())
          .join(" / ");
        setUpgradeCtx({
          plan: currentPlan,
          reason: `Your ${currentPlan === "free" ? "Free" : "Lifetime"} plan supports ${niceList} only. Upgrade to Pro for WAV / FLAC / AIFF / M4A / AAC / OGG / OPUS.`,
        });
        return;
      }
      setError(null);
      setPendingFile(f);
      onClose();
      router.push("/library/upload");
    },
    [allowedAudioExts, currentPlan, onClose, router],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // Reset error when the modal re-opens
  React.useEffect(() => {
    if (open) setError(null);
  }, [open]);

  return (
    <>
    <Modal open={open} onClose={onClose}>
      <div
        className="bg-bg-2 border border-border-2"
        style={{
          width: "min(620px, calc(100vw - 32px))",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-pop)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center border-b border-border-1"
          style={{ gap: 14, padding: "16px 18px" }}
        >
          <div
            className="flex items-center justify-center shrink-0 text-accent-text"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-md)",
              background: "var(--accent-surface)",
            }}
          >
            <Icon name="upload" size={18} />
          </div>
          <h2
            className="t-h2 flex-1"
            style={{ fontSize: 20, margin: 0 }}
          >
            Upload a beat
          </h2>
          <IconButton
            name="close"
            size={36}
            onClick={onClose}
            label="Close"
          />
        </div>

        {/* Body */}
        <div style={{ padding: 18 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={onPick}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            className="flex flex-col items-center text-center"
            style={{
              padding: "44px 24px",
              borderRadius: "var(--r-lg)",
              border: `1.5px dashed ${over ? "var(--accent)" : "var(--border-2)"}`,
              background: over ? "var(--accent-surface)" : "var(--bg-1)",
              transition: "all var(--dur-fast) var(--ease)",
            }}
          >
            <div
              className="flex items-center justify-center text-accent-text"
              style={{
                width: 62,
                height: 62,
                borderRadius: "var(--r-lg)",
                background: "var(--accent-surface)",
                marginBottom: 18,
              }}
            >
              <Icon name="upload" size={28} />
            </div>
            <h3 className="t-h2" style={{ fontSize: 22, marginBottom: 8 }}>
              Drop your beat to upload
            </h3>
            <p
              className="t-body-l"
              style={{ marginBottom: 22, maxWidth: 360 }}
            >
              WAV, MP3, AIFF or FLAC. We&rsquo;ll auto-detect the tempo, key
              and length for you.
            </p>

            <div className="flex items-center" style={{ gap: 12 }}>
              <Button
                icon="upload"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse files
              </Button>
              <Button
                variant="secondary"
                disabled
                title="Starter samples — coming soon"
              >
                Use a sample
              </Button>
            </div>

            {error && (
              <div
                role="alert"
                className="t-body-s"
                style={{
                  marginTop: 18,
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--danger-surface)",
                  color: "var(--danger)",
                  border: "1px solid var(--danger)",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>

    {/* UpgradeRequiredModal — layered above the picker. Closing
        it drops the upgrade state AND closes the picker, so the
        user lands back on the Beat library without any
        intermediate page. */}
    <UpgradeRequiredModal
      open={upgradeCtx !== null}
      onClose={() => {
        setUpgradeCtx(null);
        onClose();
      }}
      currentPlan={upgradeCtx?.plan ?? "free"}
      reason={upgradeCtx?.reason ?? ""}
    />
  </>
  );
}
