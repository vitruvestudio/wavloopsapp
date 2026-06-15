/**
 * ContactsPage — producer's master contacts table.
 *
 * Layout (desktop):
 *   ┌─ PageHeader: Contacts  N CAPTURED · ACROSS M SERVERS │ Import / Export / + Add ┐
 *   │
 *   │  ┌─ search ─┐ ┌─ ALL SERVERS ▾ ─┐                SORT  [Engagement][A-Z]
 *   │  └──────────┘ └─────────────────┘
 *   │
 *   │  CONTACT          PHONE      FROM SERVER     ENGAGEMENT
 *   │  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──
 *   │  [AV] email       phone      [server tags]   ▶ N  ♥ N        ›
 *   │  …
 *   └──────────────────────────────────────────────────────────────
 *
 * Mobile collapses the columns into a 2-row card per contact
 * (avatar + email + phone on top, server tags + engagement below).
 *
 * Buttons stubbed for this pass (Import CSV / Export CSV / Add
 * contact / row click). Wired step-by-step next.
 */

"use client";

import * as React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import type { ContactRowVM, ServerStub } from "./page";
import { AddContactModal } from "./AddContactModal";

type SortKey = "engagement" | "az";

interface ContactsPageProps {
  contacts: ContactRowVM[];
  allServers: ServerStub[];
}

export function ContactsPage({ contacts, allServers }: ContactsPageProps) {
  const [search, setSearch] = React.useState("");
  const [serverFilter, setServerFilter] = React.useState<string | "all">("all");
  const [sort, setSort] = React.useState<SortKey>("engagement");
  const [addOpen, setAddOpen] = React.useState(false);

  const stub = (label: string) =>
    alert(`${label} — wires up in the next step.`);

  // distinct-server count from CURRENT data (matches the proto sub line)
  const distinctServers = allServers.length;

  const filteredSorted = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = contacts.filter((c) => {
      if (q && !c.email.toLowerCase().includes(q)) return false;
      if (
        serverFilter !== "all" &&
        !c.servers.some((s) => s.id === serverFilter)
      ) {
        return false;
      }
      return true;
    });
    const sorted = [...filtered];
    if (sort === "engagement") {
      sorted.sort(
        (a, b) => b.plays + b.likes - (a.plays + a.likes),
      );
    } else {
      sorted.sort((a, b) => a.email.localeCompare(b.email));
    }
    return sorted;
  }, [contacts, search, serverFilter, sort]);

  return (
    <>
      <PageHeader
        title="Contacts"
        sub={`${contacts.length} CAPTURED · ACROSS ${distinctServers} SERVER${distinctServers === 1 ? "" : "S"}`}
        right={
          <div className="flex items-center" style={{ gap: 8 }}>
            <Button
              variant="ghost"
              icon="upload"
              size="sm"
              onClick={() => stub("Import CSV")}
              className="hidden sm:inline-flex !h-[36px]"
            >
              Import CSV
            </Button>
            <Button
              variant="ghost"
              icon="external"
              size="sm"
              onClick={() => stub("Export CSV")}
              className="hidden sm:inline-flex !h-[36px]"
            >
              Export CSV
            </Button>
            <Button
              icon="plus"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="!h-[36px]"
            >
              <span className="hidden sm:inline">Add contact</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
        {/* Toolbar */}
        <Toolbar
          search={search}
          onSearch={setSearch}
          serverFilter={serverFilter}
          onServerFilter={setServerFilter}
          servers={allServers}
          sort={sort}
          onSort={setSort}
        />

        {/* Table */}
        {contacts.length === 0 ? (
          <EmptyState onAdd={() => stub("Add contact")} />
        ) : filteredSorted.length === 0 ? (
          <div
            className="border border-border-1 bg-bg-1 text-center t-body"
            style={{
              padding: "32px 18px",
              borderRadius: "var(--r-lg)",
              color: "var(--fg-3)",
              marginTop: 18,
            }}
          >
            No contacts match the current filter.
          </div>
        ) : (
          <div
            className="border border-border-1 bg-bg-1 overflow-hidden"
            style={{
              borderRadius: "var(--r-lg)",
              marginTop: 18,
            }}
          >
            {/* Column headers — desktop only */}
            <div
              className="hidden lg:grid t-mono-s border-b border-border-1"
              style={{
                gridTemplateColumns: "minmax(0,2fr) minmax(0,1.4fr) minmax(0,2fr) minmax(120px,1fr) 32px",
                gap: 14,
                padding: "12px 22px",
                color: "var(--fg-3)",
                background: "var(--bg-0)",
              }}
            >
              <span>CONTACT</span>
              <span>PHONE</span>
              <span>FROM SERVER</span>
              <span>ENGAGEMENT</span>
              <span />
            </div>

            {filteredSorted.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                onClick={() => stub(`Open ${c.email}`)}
              />
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddContactModal
          allServers={allServers}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}

/* ============================================================
   Toolbar — search + server dropdown + sort segmented
   ============================================================ */

function Toolbar({
  search,
  onSearch,
  serverFilter,
  onServerFilter,
  servers,
  sort,
  onSort,
}: {
  search: string;
  onSearch: (v: string) => void;
  serverFilter: string | "all";
  onServerFilter: (v: string | "all") => void;
  servers: Array<{ id: string; name: string; slug: string }>;
  sort: SortKey;
  onSort: (v: SortKey) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center"
      style={{ gap: 10 }}
    >
      {/* Search */}
      <div
        className="flex items-center bg-bg-inset border border-border-2 transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
        style={{
          height: 38,
          padding: "0 12px",
          gap: 10,
          borderRadius: "var(--r-md)",
          width: "100%",
          flex: "1 1 240px",
          maxWidth: 340,
        }}
      >
        <Icon name="search" size={15} className="text-fg-3" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search emails…"
          className="flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-4 min-w-0"
          style={{ fontFamily: "var(--font-body)", fontSize: 14 }}
        />
      </div>

      {/* Server dropdown */}
      <ServerDropdown
        value={serverFilter}
        onChange={onServerFilter}
        servers={servers}
      />

      {/* Spacer pushes sort to the right on lg+ */}
      <div className="hidden sm:block flex-1" />

      {/* Sort segmented */}
      <div className="inline-flex items-center" style={{ gap: 8 }}>
        <span
          className="t-mono-s hidden sm:inline"
          style={{ color: "var(--fg-3)" }}
        >
          SORT
        </span>
        <SortSegmented value={sort} onChange={onSort} />
      </div>
    </div>
  );
}

function ServerDropdown({
  value,
  onChange,
  servers,
}: {
  value: string | "all";
  onChange: (v: string | "all") => void;
  servers: Array<{ id: string; name: string; slug: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const label =
    value === "all" ? "All servers" : (servers.find((s) => s.id === value)?.name ?? "Server");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center cursor-pointer bg-bg-1 border border-border-1 transition-colors duration-fast hover:bg-bg-2"
        style={{
          height: 38,
          padding: "0 12px",
          gap: 8,
          borderRadius: "var(--r-md)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--fg-2)",
        }}
      >
        {label}
        <Icon name="chevron-down" size={13} />
      </button>
      {open && (
        <div
          className="absolute z-20 bg-bg-0 border border-border-1 overflow-hidden"
          style={{
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 220,
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-md)",
            padding: 4,
          }}
        >
          <DropdownItem
            label="All servers"
            active={value === "all"}
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
          />
          {servers.map((s) => (
            <DropdownItem
              key={s.id}
              label={s.name}
              active={value === s.id}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full cursor-pointer transition-colors duration-fast hover:bg-bg-2"
      style={{
        padding: "8px 12px",
        borderRadius: "var(--r-sm)",
        border: "none",
        background: active ? "var(--accent-surface)" : "transparent",
        color: active ? "var(--accent-text)" : "var(--fg-1)",
        fontFamily: "var(--font-body)",
        fontSize: 13.5,
        textAlign: "left",
      }}
    >
      {label}
      {active && <Icon name="check" size={14} />}
    </button>
  );
}

function SortSegmented({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const items: Array<{ value: SortKey; label: string }> = [
    { value: "engagement", label: "Engagement" },
    { value: "az", label: "A–Z" },
  ];
  return (
    <div
      className="inline-flex items-center bg-bg-1 border border-border-1"
      style={{
        padding: 3,
        borderRadius: "var(--r-md)",
        height: 34,
      }}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className="cursor-pointer inline-flex items-center transition-all duration-fast"
            style={{
              padding: "0 12px",
              height: 28,
              borderRadius: "var(--r-sm)",
              border: "none",
              background: active ? "var(--bg-0)" : "transparent",
              boxShadow: active
                ? "0 1px 3px oklch(0 0 0 / 0.08), 0 1px 1px oklch(0 0 0 / 0.04)"
                : "none",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--fg-1)" : "var(--fg-3)",
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   ContactRow — one rendered contact across all server memberships
   ============================================================ */

function ContactRow({
  contact,
  onClick,
}: {
  contact: ContactRowVM;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer border-t border-border-1 transition-colors duration-fast"
      style={{
        background: hovered ? "var(--bg-2)" : "transparent",
      }}
    >
      {/* Desktop layout — 5-col grid */}
      <div
        className="hidden lg:grid items-center"
        style={{
          gridTemplateColumns: "minmax(0,2fr) minmax(0,1.4fr) minmax(0,2fr) minmax(120px,1fr) 32px",
          gap: 14,
          padding: "14px 22px",
        }}
      >
        <div className="flex items-center min-w-0" style={{ gap: 12 }}>
          <Avatar
            name={contact.name ?? contact.email}
            src={contact.avatarUrl}
            size={38}
          />
          <div className="min-w-0 flex-1">
            {/* Primary line — name (or email fallback) + role tags inline. */}
            <div
              className="flex items-center min-w-0"
              style={{ gap: 8 }}
            >
              <span
                className="truncate"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                }}
              >
                {contact.name ?? contact.email}
              </span>
              <RoleTags roles={contact.roles} />
            </div>
            {/* Secondary line — email (when name was primary) +
                clickable social icons, mirrors the BeatRow title +
                mood-tags two-row pattern. */}
            <div
              className="flex items-center min-w-0"
              style={{ gap: 8, marginTop: 3 }}
            >
              {contact.name && (
                <span
                  className="t-mono-s truncate"
                  style={{ color: "var(--fg-3)" }}
                >
                  {contact.email}
                </span>
              )}
              <SocialIconRow socials={contact.socials} />
            </div>
          </div>
        </div>
        <span
          className="t-mono-s truncate"
          style={{ color: contact.phone ? "var(--fg-2)" : "var(--fg-4)" }}
        >
          {contact.phone ?? "—"}
        </span>
        <ServerTagList servers={contact.servers} />
        <EngagementCluster plays={contact.plays} likes={contact.likes} />
        <Icon
          name="chevron-right"
          size={16}
          style={{ color: hovered ? "var(--accent-text)" : "var(--fg-4)" }}
        />
      </div>

      {/* Mobile layout — stacked card */}
      <div
        className="lg:hidden flex flex-col"
        style={{ gap: 10, padding: "14px 16px" }}
      >
        <div className="flex items-center min-w-0" style={{ gap: 12 }}>
          <Avatar
            name={contact.name ?? contact.email}
            src={contact.avatarUrl}
            size={36}
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
                {contact.name ?? contact.email}
              </span>
              <RoleTags roles={contact.roles} />
            </div>
            <div
              className="flex items-center min-w-0"
              style={{ gap: 8, marginTop: 3 }}
            >
              {contact.name && (
                <span
                  className="t-mono-s truncate"
                  style={{ color: "var(--fg-3)" }}
                >
                  {contact.email}
                </span>
              )}
              <SocialIconRow socials={contact.socials} />
            </div>
            {contact.phone && (
              <div
                className="t-mono-s truncate"
                style={{ color: "var(--fg-3)", marginTop: 3 }}
              >
                {contact.phone}
              </div>
            )}
          </div>
          <Icon
            name="chevron-right"
            size={16}
            style={{ color: "var(--fg-4)" }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ gap: 12 }}>
          <ServerTagList servers={contact.servers} />
          <EngagementCluster plays={contact.plays} likes={contact.likes} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SocialIconRow — small clickable icons for each saved platform
   ============================================================ */

const PLATFORM_ICON: Record<string, IconName> = {
  instagram: "instagram",
  x: "x-logo",
  youtube: "youtube",
  tiktok: "youtube", // closest stand-in until a TikTok icon ships
  soundcloud: "library", // closest stand-in until a SoundCloud icon ships
  genius: "mic",
  website: "globe",
};

/* ============================================================
   RoleTags — small accent chips for each saved role (Producer,
   Beatmaker, …). Mirrors how BeatRow renders mood tags.
   ============================================================ */

function RoleTags({ roles }: { roles: string[] }) {
  if (roles.length === 0) return null;
  // Show up to 2 inline; collapse the rest into a "+N" chip so the
  // name line doesn't get crowded on tight widths.
  const visible = roles.slice(0, 2);
  const overflow = roles.length - visible.length;
  return (
    <span
      className="inline-flex items-center shrink-0"
      style={{ gap: 4 }}
    >
      {visible.map((r) => (
        <Tag key={r} variant="accent">
          {r}
        </Tag>
      ))}
      {overflow > 0 && <Tag variant="default">+{overflow}</Tag>}
    </span>
  );
}

function SocialIconRow({ socials }: { socials: Record<string, string> }) {
  const entries = Object.entries(socials).filter(
    ([k, v]) => v && PLATFORM_ICON[k],
  );
  if (entries.length === 0) return null;
  return (
    <span className="inline-flex items-center" style={{ gap: 8 }}>
      {entries.map(([platform, url]) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open ${platform} profile`}
          className="inline-flex items-center justify-center transition-colors duration-fast"
          style={{
            width: 22,
            height: 22,
            borderRadius: "var(--r-sm)",
            background: "var(--bg-2)",
            color: "var(--fg-2)",
          }}
        >
          <Icon name={PLATFORM_ICON[platform]} size={12} />
        </a>
      ))}
    </span>
  );
}

function ServerTagList({
  servers,
}: {
  servers: ContactRowVM["servers"];
}) {
  // Show up to 2 names then collapse the rest into a "+N" chip so
  // the row stays single-line on tight widths.
  const visible = servers.slice(0, 2);
  const overflow = servers.length - visible.length;
  return (
    <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
      {visible.map((s) => (
        <Tag key={s.id} variant="solid">
          {s.name.toUpperCase()}
        </Tag>
      ))}
      {overflow > 0 && <Tag variant="default">+ {overflow}</Tag>}
    </div>
  );
}

function EngagementCluster({
  plays,
  likes,
}: {
  plays: number;
  likes: number;
}) {
  return (
    <div className="inline-flex items-center" style={{ gap: 16 }}>
      <span
        className="t-mono-s inline-flex items-center"
        style={{ gap: 6, color: "var(--fg-2)" }}
      >
        <Icon name="play" size={13} />
        {plays}
      </span>
      <span
        className="t-mono-s inline-flex items-center"
        style={{ gap: 6, color: "var(--accent-text)" }}
      >
        <Icon name="heart" size={13} />
        {likes}
      </span>
    </div>
  );
}

/* ============================================================
   EmptyState — first-load placeholder
   ============================================================ */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="mx-auto flex flex-col items-center text-center"
      style={{ maxWidth: 460, marginTop: "6vh" }}
    >
      <div
        className="flex items-center justify-center text-accent-text"
        style={{
          width: 72,
          height: 72,
          borderRadius: "var(--r-xl)",
          background: "var(--accent-surface)",
          marginBottom: 22,
        }}
      >
        <Icon name="users" size={34} />
      </div>
      <h2 className="t-h2" style={{ marginBottom: 10 }}>
        No contacts yet
      </h2>
      <p className="t-body-l" style={{ marginBottom: 24 }}>
        Artists who open one of your servers and submit their email
        land here automatically. You can also add them manually or
        import a CSV.
      </p>
      <Button size="lg" icon="plus" onClick={onAdd}>
        Add contact
      </Button>
    </div>
  );
}
