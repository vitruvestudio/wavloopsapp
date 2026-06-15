/**
 * AddArtistsModal — picker for attaching existing address-book
 * contacts to the current server.
 *
 * Same shape as AddBeatsModal: search, checkbox-style rows,
 * "Add (N)" footer button. Contacts already attached to the
 * server are filtered out — the producer can't re-add an existing
 * artist. The action layer also guards against this so a stale
 * modal racing the page is safe.
 *
 * "Create new" affordance lives at the bottom of the empty-state
 * card AND as an always-visible row above the list, so producers
 * who haven't met their artist yet can jump straight into the Add
 * Contact modal without leaving the server.
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Tag } from "@/components/ui/Tag";
import type { ContactRow } from "@/lib/supabase/database.types";

interface AddArtistsModalProps {
  serverName: string;
  /** Every contact in the producer's address book. */
  library: ContactRow[];
  /** Ids of contacts already attached to this server — filtered
   *  out of the picker so the producer doesn't accidentally
   *  re-add them. */
  existingContactIds: Set<string>;
  onClose: () => void;
  onConfirm: (contactIds: string[]) => void | Promise<void>;
  /** Opens the AddContactModal in create-new mode (with this
   *  server pre-attached). */
  onCreateNew: () => void;
  pending?: boolean;
}

export function AddArtistsModal({
  serverName,
  library,
  existingContactIds,
  onClose,
  onConfirm,
  onCreateNew,
  pending,
}: AddArtistsModalProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const available = React.useMemo(
    () => library.filter((c) => !existingContactIds.has(c.id)),
    [library, existingContactIds],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((c) => {
      if (c.email.toLowerCase().includes(q)) return true;
      if (c.name?.toLowerCase().includes(q)) return true;
      if (c.roles.some((r) => r.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [available, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      aria-label={`Add artists to ${serverName}`}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ padding: 18 }}
    >
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
          className="flex items-center border-b border-border-1 shrink-0"
          style={{ gap: 12, padding: "16px 18px" }}
        >
          <div className="min-w-0 flex-1">
            <div className="t-h2" style={{ fontSize: 18 }}>
              Add artists
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
            onClick={() => !pending && onClose()}
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
              placeholder="Search by name, email, role…"
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

        {/* List */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "8px 12px" }}
        >
          {/* Always-on "Create new" affordance — same dashed CTA as
              the Artists tab, but routed into the AddContactModal
              with this server pre-pinned. */}
          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center w-full cursor-pointer transition-colors duration-fast bg-transparent"
            style={{
              gap: 14,
              padding: "12px 14px",
              border: "1.5px dashed var(--border-1)",
              borderRadius: "var(--r-md)",
              textAlign: "left",
              marginBottom: 6,
            }}
          >
            <div
              className="flex items-center justify-center text-accent-text shrink-0"
              style={{
                width: 34,
                height: 34,
                borderRadius: "999px",
                background: "var(--accent-surface)",
              }}
            >
              <Icon name="plus" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--accent-text)",
                }}
              >
                Create a new contact
              </div>
              <div
                className="t-mono-s"
                style={{ color: "var(--fg-3)", marginTop: 3 }}
              >
                NOT IN YOUR ADDRESS BOOK YET
              </div>
            </div>
          </button>

          {filtered.length === 0 ? (
            <EmptyList
              hasAny={available.length > 0}
              hasQuery={search.length > 0}
            />
          ) : (
            <div className="flex flex-col" style={{ gap: 2 }}>
              {filtered.map((c) => (
                <ArtistPickerRow
                  key={c.id}
                  contact={c}
                  checked={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t border-border-1 shrink-0"
          style={{ padding: "14px 18px", gap: 12 }}
        >
          <span className="t-mono-s" style={{ color: "var(--fg-3)" }}>
            {selected.size} SELECTED
          </span>
          <div className="flex items-center" style={{ gap: 8 }}>
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

/* ============================================================
   ArtistPickerRow
   ============================================================ */

function ArtistPickerRow({
  contact,
  checked,
  onToggle,
}: {
  contact: ContactRow;
  checked: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const display = contact.name?.trim() || contact.email;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="flex items-center cursor-pointer transition-colors duration-fast"
      style={{
        gap: 12,
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        background: checked
          ? "var(--accent-surface)"
          : hovered
            ? "var(--bg-2)"
            : "transparent",
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-pressed={checked}
        className="shrink-0 inline-flex items-center justify-center cursor-pointer transition-colors duration-fast"
        style={{
          width: 22,
          height: 22,
          borderRadius: "var(--r-sm)",
          border: `2px solid ${checked ? "var(--accent)" : "var(--border-2)"}`,
          background: checked ? "var(--accent)" : "var(--bg-1)",
          color: checked ? "#fff" : "transparent",
        }}
      >
        {checked && <Icon name="check" size={14} />}
      </button>
      <Avatar
        name={contact.name ?? contact.email}
        src={contact.avatar_url}
        size={34}
      />
      <div className="min-w-0 flex-1">
        <div
          className="flex items-center min-w-0"
          style={{ gap: 8 }}
        >
          <span
            className="truncate"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {display}
          </span>
          {contact.roles.slice(0, 2).map((r) => (
            <Tag key={r} variant="accent">
              {r}
            </Tag>
          ))}
        </div>
        {contact.name && (
          <div
            className="t-mono-s truncate"
            style={{ color: "var(--fg-3)", marginTop: 2 }}
          >
            {contact.email}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   EmptyList
   ============================================================ */

function EmptyList({
  hasAny,
  hasQuery,
}: {
  hasAny: boolean;
  hasQuery: boolean;
}) {
  let title = "No artists to add";
  let body = "Every contact in your address book is already in this server.";
  if (hasQuery) {
    title = "No matches";
    body = "No contact matches that search.";
  } else if (!hasAny) {
    title = "Your address book is empty";
    body = "Create a contact above, or head to the Contacts page to import a CSV.";
  }
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ padding: "32px 24px", gap: 8 }}
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
        <Icon name="users" size={22} />
      </div>
      <div className="t-h2" style={{ fontSize: 17 }}>
        {title}
      </div>
      <div className="t-body" style={{ color: "var(--fg-3)" }}>
        {body}
      </div>
    </div>
  );
}
