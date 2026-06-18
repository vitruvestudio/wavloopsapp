/**
 * AddBeatsModal — popover for adding beats from the producer's
 * library to the current server.
 *
 * Shape:
 *   ┌─────────────────────────────────────────────┐
 *   │ Add beats to <ServerName>            [✕]   │
 *   │ ─────────────────────────────────────────── │
 *   │ [🔍 Search your library…]                   │
 *   │ ┌─────────────────────────────────────────┐ │
 *   │ │ ☐ <BeatRow checkbox=true>              │ │
 *   │ │ ☐ <BeatRow checkbox=true>              │ │
 *   │ │ …                                       │ │
 *   │ └─────────────────────────────────────────┘ │
 *   │                                             │
 *   │ N selected           [Cancel] [+ Add (N)]   │
 *   └─────────────────────────────────────────────┘
 *
 * Beats already in this server are filtered OUT before render — the
 * producer can't re-add an existing beat. The action layer also
 * guards against this (idempotent), so a stale-modal race is safe.
 *
 * Close affordances: ✕ button, Cancel button, backdrop click,
 * Escape key. All call `onClose` — no internal state to clean.
 */

"use client";

import * as React from "react";
import { BeatRow } from "@/components/app/BeatRow";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import type { BeatWithStatsRow } from "@/lib/supabase/database.types";

interface AddBeatsModalProps {
  serverName: string;
  library: BeatWithStatsRow[];
  /** Ids of beats already in this server — filtered out of the list. */
  existingBeatIds: Set<string>;
  onClose: () => void;
  onConfirm: (selectedBeatIds: string[]) => void | Promise<void>;
  /** Submit-button spinner state. */
  pending?: boolean;
  /** Optional. When provided, the modal shows an "Upload a beat"
   *  CTA. Producer can pivot from "pick existing" to "create new"
   *  without leaving the server context — parent closes this
   *  modal and opens its UploadModal in the same gesture. */
  onUploadRequest?: () => void;
}

export function AddBeatsModal({
  serverName,
  library,
  existingBeatIds,
  onClose,
  onConfirm,
  pending,
  onUploadRequest,
}: AddBeatsModalProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const now = React.useMemo(() => new Date(), []);

  // Close on Escape.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const available = React.useMemo(
    () => library.filter((b) => !existingBeatIds.has(b.id)),
    [library, existingBeatIds],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((b) => {
      if (b.title.toLowerCase().includes(q)) return true;
      if ((b.key ?? "").toLowerCase().includes(q)) return true;
      if (b.mood.some((m) => m.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [available, search]);

  const toggle = (beatId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(beatId)) next.delete(beatId);
      else next.add(beatId);
      return next;
    });
  };

  const submit = () => {
    if (selected.size === 0 || pending) return;
    onConfirm(Array.from(selected));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add beats to ${serverName}`}
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
          maxWidth: 640,
          maxHeight: "min(720px, 90vh)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center border-b border-border-1"
          style={{ gap: 12, padding: "16px 18px" }}
        >
          <div className="min-w-0 flex-1">
            <div className="t-h2" style={{ fontSize: 18 }}>
              Add beats
            </div>
            <div
              className="t-mono-s truncate"
              style={{ color: "var(--fg-3)", marginTop: 3 }}
            >
              TO {serverName.toUpperCase()}
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

        {/* Search */}
        <div
          className="border-b border-border-1"
          style={{ padding: "12px 18px" }}
        >
          <div
            className="flex items-center bg-bg-1 border border-border-1"
            style={{
              gap: 10,
              padding: "8px 12px",
              borderRadius: "var(--r-md)",
            }}
          >
            <Icon name="search" size={16} style={{ color: "var(--fg-3)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your library by title, key, mood…"
              autoFocus
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--fg-1)",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="cursor-pointer border-0 bg-transparent inline-flex"
                style={{ color: "var(--fg-3)" }}
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Beat list */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "8px 12px" }}
        >
          {filtered.length === 0 ? (
            <EmptyList
              hasAny={available.length > 0}
              hasQuery={search.length > 0}
              onUploadRequest={onUploadRequest}
            />
          ) : (
            <div className="flex flex-col" style={{ gap: 2 }}>
              {filtered.map((b) => (
                <BeatRow
                  key={b.id}
                  beat={b}
                  now={now}
                  showAdded={false}
                  showServers={false}
                  showEngagement={false}
                  checkbox
                  checked={selected.has(b.id)}
                  onCheck={() => toggle(b.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t border-border-1"
          style={{ padding: "14px 18px", gap: 12 }}
        >
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
              {selected.size} SELECTED
            </span>
            {onUploadRequest && (
              <>
                <span
                  aria-hidden
                  style={{
                    width: 1,
                    height: 18,
                    background: "var(--border-1)",
                  }}
                />
                <button
                  type="button"
                  onClick={onUploadRequest}
                  disabled={pending}
                  className="t-mono-s inline-flex items-center cursor-pointer"
                  style={{
                    gap: 6,
                    border: "none",
                    background: "transparent",
                    color: "var(--accent-text)",
                    letterSpacing: "0.08em",
                    padding: 0,
                  }}
                >
                  <Icon name="upload" size={13} />
                  UPLOAD A BEAT
                </button>
              </>
            )}
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={pending}
              className="!h-[36px]"
            >
              Cancel
            </Button>
            <Button
              icon="plus"
              size="sm"
              onClick={submit}
              disabled={selected.size === 0 || pending}
              className="!h-[36px]"
            >
              {pending
                ? "Adding…"
                : `Add ${selected.size > 0 ? `(${selected.size})` : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyList({
  hasAny,
  hasQuery,
  onUploadRequest,
}: {
  hasAny: boolean;
  hasQuery: boolean;
  onUploadRequest?: () => void;
}) {
  let title = "No beats to add";
  let body = "Every beat in your library is already in this server.";
  let showUpload = false;
  if (hasQuery) {
    title = "No matches";
    body = "Nothing in your library matches that search.";
  } else if (!hasAny) {
    title = "Your library is empty";
    body = "Upload your first beat and add it to this server in one go.";
    showUpload = true;
  }
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ padding: "48px 24px", gap: 8 }}
    >
      <div
        className="flex items-center justify-center text-accent-text"
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--r-lg)",
          background: "var(--accent-surface)",
          marginBottom: 6,
        }}
      >
        <Icon name="library" size={22} />
      </div>
      <div className="t-h2" style={{ fontSize: 17 }}>
        {title}
      </div>
      <div className="t-body" style={{ color: "var(--fg-3)" }}>
        {body}
      </div>
      {showUpload && onUploadRequest && (
        <button
          type="button"
          onClick={onUploadRequest}
          className="inline-flex items-center cursor-pointer transition-colors duration-fast"
          style={{
            marginTop: 14,
            gap: 8,
            padding: "10px 18px",
            height: 40,
            borderRadius: "var(--r-md)",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Icon name="upload" size={14} />
          Upload a beat
        </button>
      )}
    </div>
  );
}
