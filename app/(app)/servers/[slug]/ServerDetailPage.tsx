/**
 * Server detail page — client component.
 *
 * Layout:
 *   1. PageHeader (custom): back, name, [VisBadge + style tags],
 *      [link box + COPY · share · edit].
 *   2. Stats row — 3 cards (ARTISTS ENTERED · TOTAL PLAYS · TOTAL LIKES).
 *   3. Tabs — Beats (N) / Artists (M).
 *   4. Tab body — BeatRow list OR ContactRow list with "Add an artist"
 *      CTA card at the top.
 *   5. Floating "PREVIEW ARTIST LINK" pill (bottom-right, lg+ only;
 *      hidden behind the PlayerDock on mobile).
 *
 * Most action buttons (Add beats, Add artist, Export, Share, Edit,
 * Preview Artist Link) are stubs for this pass — they fire a single
 * `alert("Coming soon — wires up in the next step.")`. Real wiring
 * lands in the follow-up steps Theo has lined up.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { BeatRow, type BeatRowAction } from "@/components/app/BeatRow";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { VisBadge } from "@/components/ui/VisBadge";
import { createClient } from "@/lib/supabase/client";
import { fmtAgo, fmtDuration } from "@/lib/fmt";
import { usePlayer } from "@/components/app/PlayerContext";
import type {
  BeatWithStatsRow,
  ContactRow,
  ServerWithStatsRow,
} from "@/lib/supabase/database.types";
import { AddBeatsModal } from "./AddBeatsModal";
import {
  addArtistsToServerAction,
  addBeatsToServerAction,
} from "./actions";
import { AddArtistsModal } from "./AddArtistsModal";
import { AddContactModal } from "../../contacts/AddContactModal";
import type { ServerStub } from "../../contacts/page";

type Tab = "beats" | "artists";

interface ServerDetailPageProps {
  server: ServerWithStatsRow;
  beats: BeatWithStatsRow[];
  contacts: ContactRow[];
  likesCount: number;
  userId: string;
  /** Full producer library — populates the Add beats modal. */
  library: BeatWithStatsRow[];
  /** Every server the producer owns — passed to the Add artist
   *  create-new modal so the chip group can render all options. */
  allServers: ServerStub[];
  /** Every contact in the producer's address book — picker source
   *  for the AddArtistsModal. */
  addressBook: ContactRow[];
}

export function ServerDetailPage({
  server,
  beats,
  contacts,
  likesCount,
  library,
  allServers,
  addressBook,
}: ServerDetailPageProps) {
  const router = useRouter();
  const player = usePlayer();
  const supabase = React.useMemo(() => createClient(), []);
  const [tab, setTab] = React.useState<Tab>("beats");
  const [copied, setCopied] = React.useState(false);
  const [addBeatsOpen, setAddBeatsOpen] = React.useState(false);
  const [addBeatsPending, startAddBeats] = React.useTransition();
  /** "Pick from address book" modal — the default flow. */
  const [addArtistsOpen, setAddArtistsOpen] = React.useState(false);
  const [addArtistsPending, startAddArtists] = React.useTransition();
  /** "Create new contact" modal — opened from inside the picker
   *  when the artist isn't in the address book yet. */
  const [createContactOpen, setCreateContactOpen] = React.useState(false);

  const existingContactIds = React.useMemo(
    () => new Set(contacts.map((c) => c.id)),
    [contacts],
  );

  const addArtists = (contactIds: string[]) => {
    startAddArtists(async () => {
      const result = await addArtistsToServerAction(
        server.id,
        contactIds,
        server.slug,
      );
      if (result.error) {
        alert(`Couldn't add artists: ${result.error}`);
        return;
      }
      setAddArtistsOpen(false);
      router.refresh();
    });
  };
  const now = React.useMemo(() => new Date(), []);

  // Ids of beats already attached — used to filter the modal list.
  const existingBeatIds = React.useMemo(
    () => new Set(beats.map((b) => b.id)),
    [beats],
  );

  const addBeats = (beatIds: string[]) => {
    startAddBeats(async () => {
      const result = await addBeatsToServerAction(
        server.id,
        beatIds,
        server.slug,
      );
      if (result.error) {
        alert(`Couldn't add beats: ${result.error}`);
        return;
      }
      setAddBeatsOpen(false);
      router.refresh();
    });
  };

  // What we DISPLAY in the link box: the brand URL the artist will
  // eventually receive. Production domain is wavloops.co.
  const artistUrlDisplay = `wavloops.co/s/${server.slug}`;
  // What we COPY and what the open/preview button OPENS: the URL
  // for the current environment, so dev clicks land on
  // localhost:3000/s/<slug> rather than 404-ing on wavloops.co.
  // Falls back to the production URL during SSR.
  const artistUrlOpenable =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${server.slug}`
      : `https://wavloops.co/s/${server.slug}`;

  const copyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(artistUrlOpenable);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // navigator.clipboard can throw on insecure contexts — fall back
      // to a no-op rather than crashing the page.
    }
  }, [artistUrlOpenable]);

  const stub = (label: string) =>
    alert(`${label} — wires up in the next step.`);

  /* ─── Beat playback (mirrors LibraryFilters.playBeat) ─────────── */
  const playBeat = React.useCallback(
    async (beat: BeatWithStatsRow) => {
      if (player.current?.id === beat.id) {
        player.toggle(player.current);
        return;
      }
      if (!beat.audio_url) return;
      const { data, error } = await supabase.storage
        .from("beat-audio")
        .createSignedUrl(beat.audio_url, 3600);
      if (error || !data) return;
      player.toggle({
        id: beat.id,
        title: beat.title,
        bpm: beat.bpm ?? 0,
        key: beat.key ?? "",
        dur: fmtDuration(beat.duration_seconds),
        img: beat.artwork_url,
        wave: beat.wave_seed,
        mood: beat.mood,
        audioUrl: data.signedUrl,
      });
    },
    [player, supabase],
  );

  const openBeat = React.useCallback(
    (beat: BeatWithStatsRow) => router.push(`/beats/${beat.id}`),
    [router],
  );

  const actionsFor = React.useCallback(
    (beat: BeatWithStatsRow): BeatRowAction[] => [
      { icon: "chevron-right", label: "Open", onClick: () => openBeat(beat) },
      {
        icon: "edit",
        label: "Edit info",
        onClick: () => router.push(`/beats/${beat.id}?tab=edit`),
      },
      {
        icon: "external",
        label: "Download",
        onClick: () => stub("Download"),
      },
      {
        icon: "trash",
        label: "Remove from server",
        onClick: () => stub("Remove from server"),
        danger: true,
      },
    ],
    [openBeat, router],
  );

  /* ─── Style tags from server.style_text (e.g. "Trap · Dark") ──── */
  const styleTags = React.useMemo(
    () =>
      (server.style_text ?? "")
        .split(/[·,]/)
        .map((t) => t.trim())
        .filter(Boolean),
    [server.style_text],
  );

  return (
    <>
      <PageHeader
        title={server.name}
        back
        onBack={() => router.push("/dashboard")}
        sub={
          <span className="inline-flex items-center" style={{ gap: 10 }}>
            <VisBadge visibility={server.visibility} size="sm" />
            {styleTags.length > 0 && (
              <span style={{ color: "var(--fg-3)" }}>
                {styleTags.map((t) => t.toUpperCase()).join(" · ")}
              </span>
            )}
          </span>
        }
        right={
          <div className="flex items-center" style={{ gap: 8 }}>
            <LinkBox
              url={artistUrlDisplay}
              openUrl={artistUrlOpenable}
              onCopy={copyLink}
              copied={copied}
            />
            <IconButton
              name="share"
              size={36}
              iconSize={18}
              onClick={async () => {
                // Native share when available (mobile mostly);
                // otherwise just copy the link as a sensible fallback.
                if (
                  typeof navigator !== "undefined" &&
                  "share" in navigator
                ) {
                  try {
                    await (navigator as Navigator & {
                      share: (d: ShareData) => Promise<void>;
                    }).share({
                      title: server.name,
                      text: `Listen to ${server.name} on Wavloops`,
                      url: artistUrlOpenable,
                    });
                  } catch {
                    /* user cancelled */
                  }
                } else {
                  copyLink();
                }
              }}
              label="Share"
            />
            <IconButton
              name="edit"
              size={36}
              iconSize={18}
              onClick={() => router.push(`/servers/${server.slug}/edit`)}
              label="Edit server"
            />
          </div>
        }
      />

      <div
        className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]"
        style={{ position: "relative" }}
      >
        {/* Stats */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: 14, marginBottom: 28 }}
        >
          <StatCard
            icon="users"
            label="ARTISTS ENTERED"
            value={server.contacts_count}
          />
          <StatCard
            icon="play"
            label="TOTAL PLAYS"
            value={server.plays_count}
          />
          <StatCard icon="heart" label="TOTAL LIKES" value={likesCount} />
        </div>

        {/* Tabs + per-tab right slot */}
        <Tabs
          value={tab}
          onChange={setTab}
          beatsCount={beats.length}
          artistsCount={contacts.length}
          right={
            tab === "beats" ? (
              <Button
                icon="plus"
                size="sm"
                onClick={() => setAddBeatsOpen(true)}
                className="!h-[36px]"
              >
                Add beats
              </Button>
            ) : (
              <div className="flex items-center" style={{ gap: 8 }}>
                <Button
                  variant="ghost"
                  icon="external"
                  size="sm"
                  onClick={() => stub("Export list")}
                  className="!h-[36px]"
                >
                  Export list
                </Button>
                <Button
                  icon="plus"
                  size="sm"
                  onClick={() => setAddArtistsOpen(true)}
                  className="!h-[36px]"
                >
                  Add artist
                </Button>
              </div>
            )
          }
        />

        {/* Body */}
        {tab === "beats" ? (
          <BeatsTab
            beats={beats}
            now={now}
            isCurrent={(id) => player.current?.id === id}
            isPlaying={(id) =>
              player.current?.id === id && player.playing
            }
            onOpen={openBeat}
            onPlay={playBeat}
            actionsFor={actionsFor}
          />
        ) : (
          <ArtistsTab
            contacts={contacts}
            now={now}
            onAdd={() => setAddArtistsOpen(true)}
          />
        )}
      </div>

      {/* Floating preview-link pill — desktop only; on mobile the
          PlayerDock occupies the bottom-right corner. Opens the
          gate page in a new tab so the producer can sanity-check
          what the artist actually sees. */}
      <a
        href={artistUrlOpenable}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed hidden lg:inline-flex items-center cursor-pointer"
        style={{
          right: 30,
          bottom: 100,
          padding: "12px 18px",
          gap: 8,
          background: "var(--accent)",
          color: "#fff",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderRadius: "var(--r-pill)",
          border: "none",
          boxShadow: "var(--shadow-lg)",
          textDecoration: "none",
        }}
      >
        <Icon name="external" size={14} />
        Preview Artist Link
      </a>

      {addBeatsOpen && (
        <AddBeatsModal
          serverName={server.name}
          library={library}
          existingBeatIds={existingBeatIds}
          onClose={() => {
            if (!addBeatsPending) setAddBeatsOpen(false);
          }}
          onConfirm={addBeats}
          pending={addBeatsPending}
        />
      )}
      {addArtistsOpen && (
        <AddArtistsModal
          serverName={server.name}
          library={addressBook}
          existingContactIds={existingContactIds}
          onClose={() => {
            if (!addArtistsPending) setAddArtistsOpen(false);
          }}
          onConfirm={addArtists}
          onCreateNew={() => {
            setAddArtistsOpen(false);
            setCreateContactOpen(true);
          }}
          pending={addArtistsPending}
        />
      )}
      {createContactOpen && (
        <AddContactModal
          allServers={allServers}
          defaultServerIds={[server.id]}
          onClose={() => setCreateContactOpen(false)}
        />
      )}
    </>
  );
}

/* ============================================================
   LinkBox — wavloops.co/s/<slug> + COPY pill.
   The displayed URL is clickable and opens the gate page in a new
   tab (using the current-environment URL so dev clicks land on
   localhost rather than 404-ing on wavloops.co).
   ============================================================ */

function LinkBox({
  url,
  openUrl,
  onCopy,
  copied,
}: {
  /** What we show to the producer (brand URL). */
  url: string;
  /** What clicking the URL actually opens (env-aware). */
  openUrl: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div
      className="hidden md:flex items-center"
      style={{
        gap: 10,
        padding: "6px 6px 6px 12px",
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-md)",
        height: 38,
      }}
    >
      <Icon name="link" size={14} style={{ color: "var(--fg-3)" }} />
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="t-mono-s"
        style={{
          color: "var(--fg-2)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          textDecoration: "none",
          cursor: "pointer",
        }}
        title="Open the gate page in a new tab"
      >
        {url}
      </a>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center cursor-pointer"
        style={{
          gap: 5,
          padding: "5px 11px",
          height: 26,
          background: copied ? "var(--accent-surface)" : "var(--accent)",
          color: copied ? "var(--accent-text)" : "#fff",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          borderRadius: "var(--r-pill)",
          border: "none",
          transition: "background var(--dur-fast) var(--ease)",
        }}
      >
        <Icon name={copied ? "check" : "copy"} size={12} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ============================================================
   StatCard
   ============================================================ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: number;
}) {
  return (
    <div
      className="border border-border-1 bg-bg-1"
      style={{ padding: "18px 22px", borderRadius: "var(--r-lg)" }}
    >
      <div
        className="t-mono-s inline-flex items-center"
        style={{ gap: 8, color: "var(--fg-3)" }}
      >
        <Icon name={icon} size={14} />
        {label}
      </div>
      <div
        className="t-h1"
        style={{
          fontSize: 36,
          marginTop: 12,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

/* ============================================================
   Tabs (Beats N / Artists M) + right-slot action bar
   ============================================================ */

function Tabs({
  value,
  onChange,
  beatsCount,
  artistsCount,
  right,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
  beatsCount: number;
  artistsCount: number;
  right: React.ReactNode;
}) {
  const items: Array<{ value: Tab; label: string; count: number }> = [
    { value: "beats", label: "Beats", count: beatsCount },
    { value: "artists", label: "Artists", count: artistsCount },
  ];

  return (
    <div
      className="flex items-end justify-between border-b border-border-1"
      style={{ gap: 14, marginBottom: 18 }}
    >
      <div className="flex" style={{ gap: 22 }}>
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              type="button"
              onClick={() => onChange(it.value)}
              className="cursor-pointer border-0 bg-transparent inline-flex items-center"
              style={{
                gap: 6,
                padding: "10px 0",
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--accent-text)" : "var(--fg-3)",
                borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                marginBottom: -1,
                transition: "color var(--dur-fast) var(--ease)",
              }}
            >
              {it.label}
              <span className="t-mono-s" style={{ color: "var(--fg-4)" }}>
                {it.count}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ marginBottom: 6 }}>{right}</div>
    </div>
  );
}

/* ============================================================
   BeatsTab
   ============================================================ */

function BeatsTab({
  beats,
  now,
  isCurrent,
  isPlaying,
  onOpen,
  onPlay,
  actionsFor,
}: {
  beats: BeatWithStatsRow[];
  now: Date;
  isCurrent: (id: string) => boolean;
  isPlaying: (id: string) => boolean;
  onOpen: (b: BeatWithStatsRow) => void;
  onPlay: (b: BeatWithStatsRow) => void;
  actionsFor: (b: BeatWithStatsRow) => BeatRowAction[];
}) {
  if (beats.length === 0) {
    return (
      <EmptyTabState
        icon="library"
        title="No beats in this server yet"
        body="Add beats from your library to start sharing this server with artists."
      />
    );
  }
  return (
    <div className="flex flex-col" style={{ gap: 2 }}>
      {beats.map((b) => (
        <BeatRow
          key={b.id}
          beat={b}
          now={now}
          showAdded={false}
          showServers={false}
          isCurrent={isCurrent(b.id)}
          playing={isPlaying(b.id)}
          onOpen={() => onOpen(b)}
          onPlay={() => onPlay(b)}
          actions={actionsFor(b)}
        />
      ))}
    </div>
  );
}

/* ============================================================
   ArtistsTab
   ============================================================ */

function ArtistsTab({
  contacts,
  now,
  onAdd,
}: {
  contacts: ContactRow[];
  now: Date;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {/* Always-on "Add an artist" CTA card — clickable, dashed border. */}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center cursor-pointer transition-colors duration-fast bg-transparent"
        style={{
          gap: 14,
          padding: "16px 18px",
          border: "1.5px dashed var(--border-1)",
          borderRadius: "var(--r-md)",
          textAlign: "left",
        }}
      >
        <div
          className="flex items-center justify-center text-accent-text shrink-0"
          style={{
            width: 38,
            height: 38,
            borderRadius: "999px",
            background: "var(--accent-surface)",
          }}
        >
          <Icon name="plus" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--accent-text)",
            }}
          >
            Add an artist
          </div>
          <div
            className="t-mono-s"
            style={{ color: "var(--fg-3)", marginTop: 4 }}
          >
            FROM CONTACTS OR MANUALLY · THEY GET THE LINK
          </div>
        </div>
        <Icon
          name="chevron-right"
          size={16}
          style={{ color: "var(--fg-4)" }}
        />
      </button>

      {/* Existing contacts */}
      {contacts.map((c) => (
        <ContactRowItem key={c.id} contact={c} now={now} />
      ))}
    </div>
  );
}

function ContactRowItem({
  contact,
  now,
}: {
  contact: ContactRow;
  now: Date;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center transition-colors duration-fast"
      style={{
        gap: 14,
        padding: "12px 14px",
        borderRadius: "var(--r-md)",
        background: hovered ? "var(--bg-2)" : "transparent",
      }}
    >
      <Avatar
        name={contact.name ?? contact.email}
        src={contact.avatar_url}
        size={38}
      />
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--fg-1)",
          }}
        >
          {contact.email}
        </div>
        <div
          className="t-mono-s truncate"
          style={{ color: "var(--fg-3)", marginTop: 3 }}
        >
          {[contact.phone, `ENTERED ${fmtAgo(contact.first_seen_at, now)}`]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      {/* Engagement — placeholders until J6 wires real listens/likes. */}
      <div
        className="hidden sm:flex items-center"
        style={{ gap: 22 }}
      >
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-3)" }}
        >
          <Icon name="play" size={13} />0
        </span>
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-3)" }}
        >
          <Icon name="heart" size={13} />0
        </span>
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex"
          style={{ color: "var(--fg-3)" }}
          aria-label={`Email ${contact.email}`}
        >
          <Icon name="mail" size={15} />
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   EmptyTabState — generic per-tab empty placeholder
   ============================================================ */

function EmptyTabState({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <div
      className="mx-auto flex flex-col items-center text-center"
      style={{ maxWidth: 380, paddingTop: "4vh", paddingBottom: 32 }}
    >
      <div
        className="flex items-center justify-center text-accent-text"
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--r-lg)",
          background: "var(--accent-surface)",
          marginBottom: 16,
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <div
        className="t-h2"
        style={{ fontSize: 19, marginBottom: 8 }}
      >
        {title}
      </div>
      <div className="t-body" style={{ color: "var(--fg-3)" }}>
        {body}
      </div>
    </div>
  );
}
