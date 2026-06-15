/**
 * ContactDetailPage — per-contact address-book entry.
 *
 * Layout:
 *   ┌─ PageHeader: ◂ Contact ────────── [✉ Email] [⤴ Export] ─┐
 *   │
 *   │  ╭─avatar────╮  @handle
 *   │  ╰───────────╯  ✉ email · ☎ phone
 *   │                 ENTERED VIA [server tags] · FIRST SEEN Xd AGO
 *   │
 *   │  ┌ TOTAL PLAYS ─┐┌ BEATS LIKED ┐┌ BEATS HEARD ┐┌ SERVERS ┐
 *   │  │     22       ││      7      ││      10     ││    3    │
 *   │  └──────────────┘└─────────────┘└─────────────┘└─────────┘
 *   │
 *   │  ╔ ❤ LIKED · 7 ════╗   ╔ ⏱ LISTENING HISTORY ════╗
 *   │  ║ BeatRow         ║   ║ BeatRow + ♥ + ▶ count    ║
 *   │  ║ BeatRow         ║   ║ BeatRow + ♥ + ▶ count    ║
 *   │  ║ …               ║   ║ …                         ║
 *   │  ╚═════════════════╝   ╚═══════════════════════════╝
 *   └────────────────────────────────────────────────────────────
 *
 * Mobile collapses the two columns into a single stack.
 *
 * Stubbed for this pass:
 *   - Export button (alert toast — wires up later with CSV download)
 *
 * Wired:
 *   - Email button: native <a href="mailto:"> opens the producer's
 *     mail client with the contact's address pre-filled.
 *   - Server tags: link to /servers/<slug>.
 *   - Any beat row click: navigates to /beats/<id>.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BeatRow } from "@/components/app/BeatRow";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { fmtAgo, fmtDuration } from "@/lib/fmt";
import type {
  BeatRow as BeatRowT,
  BeatWithStatsRow,
  ContactRow,
} from "@/lib/supabase/database.types";
import type { ContactStats, HistoryEntry } from "./page";

interface ContactDetailPageProps {
  contact: ContactRow;
  servers: Array<{ id: string; name: string; slug: string }>;
  stats: ContactStats;
  liked: BeatRowT[];
  history: HistoryEntry[];
}

export function ContactDetailPage({
  contact,
  servers,
  stats,
  liked,
  history,
}: ContactDetailPageProps) {
  const router = useRouter();
  const now = React.useMemo(() => new Date(), []);

  const handle = contact.name?.trim()
    ? `@${contact.name.trim()}`
    : contact.email;

  const stub = (label: string) =>
    alert(`${label} — wires up in the next step.`);

  return (
    <>
      <PageHeader
        title="Contact"
        back
        onBack={() => router.push("/contacts")}
        right={
          <div className="flex items-center" style={{ gap: 8 }}>
            <a href={`mailto:${contact.email}`} className="inline-flex">
              <Button
                variant="ghost"
                icon="mail"
                size="sm"
                className="!h-[36px]"
              >
                Email
              </Button>
            </a>
            <Button
              variant="ghost"
              icon="external"
              size="sm"
              onClick={() => stub("Export contact")}
              className="!h-[36px]"
            >
              Export
            </Button>
          </div>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
        {/* ── Profile bloc ────────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row items-start"
          style={{ gap: 24, marginBottom: 32 }}
        >
          <Avatar
            name={contact.name ?? contact.email}
            src={contact.avatar_url}
            size={80}
          />
          <div className="min-w-0 flex-1">
            <h1
              className="t-h1"
              style={{
                fontSize: "clamp(24px, 4.5vw, 32px)",
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              {handle}
            </h1>
            <div
              className="t-mono-s flex items-center flex-wrap"
              style={{ gap: 16, color: "var(--fg-3)", marginBottom: 14 }}
            >
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Icon name="mail" size={12} />
                {contact.email.toUpperCase()}
              </span>
              {contact.phone && (
                <span
                  className="inline-flex items-center"
                  style={{ gap: 6 }}
                >
                  <Icon name="phone" size={12} />
                  {contact.phone}
                </span>
              )}
            </div>
            {(servers.length > 0 || contact.first_seen_at) && (
              <div
                className="flex items-center flex-wrap"
                style={{ gap: 8 }}
              >
                {servers.length > 0 && (
                  <>
                    <span
                      className="t-mono-s"
                      style={{ color: "var(--fg-4)" }}
                    >
                      ENTERED VIA
                    </span>
                    {servers.map((s) => (
                      <Link
                        key={s.id}
                        href={`/servers/${s.slug}`}
                        className="inline-flex"
                      >
                        <Tag variant="solid" icon="server">
                          {s.name.toUpperCase()}
                        </Tag>
                      </Link>
                    ))}
                  </>
                )}
                <span
                  className="t-mono-s"
                  style={{ color: "var(--fg-4)" }}
                >
                  {servers.length > 0 ? "·" : ""} FIRST SEEN{" "}
                  {fmtAgo(contact.first_seen_at, now).toUpperCase()}
                </span>
              </div>
            )}
            {contact.roles.length > 0 && (
              <div
                className="flex items-center flex-wrap"
                style={{ gap: 6, marginTop: 12 }}
              >
                {contact.roles.map((r) => (
                  <Tag key={r} variant="accent">
                    {r}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: 14, marginBottom: 32 }}
        >
          <StatCard icon="play" label="TOTAL PLAYS" value={stats.totalPlays} />
          <StatCard icon="heart" label="BEATS LIKED" value={stats.beatsLiked} />
          <StatCard
            icon="library"
            label="BEATS HEARD"
            value={stats.beatsHeard}
          />
          <StatCard icon="server" label="SERVERS" value={stats.serversCount} />
        </div>

        {/* ── Two columns ─────────────────────────────────────── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2"
          style={{ gap: 32 }}
        >
          <div>
            <SectionHeader
              icon="heart"
              label="LIKED"
              count={liked.length}
              accent
            />
            {liked.length === 0 ? (
              <EmptyList label="No likes yet" />
            ) : (
              <div className="flex flex-col" style={{ gap: 2 }}>
                {liked.map((b) => (
                  <BeatRow
                    key={b.id}
                    beat={withZeroStats(b)}
                    now={now}
                    showAdded={false}
                    showServers={false}
                    showEngagement={false}
                    onOpen={() => router.push(`/beats/${b.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <SectionHeader
              icon="clock"
              label="LISTENING HISTORY"
              count={history.length}
            />
            {history.length === 0 ? (
              <EmptyList label="No plays yet" />
            ) : (
              <div className="flex flex-col" style={{ gap: 2 }}>
                {history.map(({ beat, playCount, liked }) => (
                  <HistoryRow
                    key={beat.id}
                    beat={beat}
                    playCount={playCount}
                    liked={liked}
                    onClick={() => router.push(`/beats/${beat.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
      style={{ padding: "16px 20px", borderRadius: "var(--r-lg)" }}
    >
      <div
        className="t-mono-s inline-flex items-center"
        style={{ gap: 8, color: "var(--accent-text)" }}
      >
        <Icon name={icon} size={14} />
        {label}
      </div>
      <div
        className="t-h1"
        style={{
          fontSize: 32,
          marginTop: 10,
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
   SectionHeader
   ============================================================ */

function SectionHeader({
  icon,
  label,
  count,
  accent,
}: {
  icon: IconName;
  label: string;
  count: number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 8,
        marginBottom: 14,
        color: accent ? "var(--accent-text)" : "var(--fg-2)",
      }}
    >
      <Icon name={icon} size={14} />
      <span
        className="t-mono-s"
        style={{ letterSpacing: "0.08em" }}
      >
        {label}
      </span>
      <span
        className="t-mono-s"
        style={{ color: "var(--fg-4)" }}
      >
        · {count}
      </span>
    </div>
  );
}

/* ============================================================
   HistoryRow — beat row with right slot = heart + play count
   ============================================================ */

function HistoryRow({
  beat,
  playCount,
  liked,
  onClick,
}: {
  beat: BeatRowT;
  playCount: number;
  liked: boolean;
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
      className="flex items-center cursor-pointer transition-colors duration-fast"
      style={{
        gap: 14,
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        background: hovered ? "var(--bg-2)" : "transparent",
      }}
    >
      {/* Cover */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: 44, height: 44, borderRadius: "var(--r-sm)" }}
      >
        {beat.artwork_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beat.artwork_url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <CoverArt fill seed={beat.wave_seed} />
        )}
      </div>

      {/* Title + meta */}
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
          {beat.title}
        </div>
        <div
          className="flex items-center flex-wrap"
          style={{ gap: 6, marginTop: 4 }}
        >
          {beat.type && (
            <Tag variant="accent" icon={beat.type === "loop" ? "repeat" : "waves"}>
              {beat.type === "loop" ? "LOOP" : "COMP"}
            </Tag>
          )}
          {beat.bpm != null && (
            <span
              className="t-mono-s"
              style={{ color: "var(--fg-3)" }}
            >
              {beat.bpm} BPM
            </span>
          )}
          {beat.key && (
            <span
              className="t-mono-s"
              style={{ color: "var(--fg-3)" }}
            >
              · {beat.key}
            </span>
          )}
          {beat.mood.slice(0, 2).map((m) => (
            <Tag key={m} variant="solid">
              {m}
            </Tag>
          ))}
        </div>
      </div>

      {/* Right slot — heart + play count */}
      <div
        className="inline-flex items-center shrink-0"
        style={{ gap: 16 }}
      >
        <Icon
          name="heart"
          size={14}
          style={{
            color: liked ? "var(--accent-text)" : "var(--fg-4)",
            fill: liked ? "var(--accent-text)" : "none",
          }}
        />
        <span
          className="t-mono-s inline-flex items-center"
          style={{ gap: 6, color: "var(--fg-2)" }}
        >
          <Icon name="play" size={13} />
          {playCount}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   EmptyList — small placeholder when a column has 0 entries
   ============================================================ */

function EmptyList({ label }: { label: string }) {
  return (
    <div
      className="t-body-s border border-border-1 bg-bg-1 text-center"
      style={{
        padding: "24px 18px",
        borderRadius: "var(--r-md)",
        color: "var(--fg-3)",
      }}
    >
      {label}
    </div>
  );
}

/* ============================================================
   withZeroStats — cast a plain BeatRow into BeatWithStatsRow so we
   can pass it to <BeatRow>. We never display the stats here
   (showEngagement={false}), so the zero values are safe.
   ============================================================ */

function withZeroStats(b: BeatRowT): BeatWithStatsRow {
  return {
    ...b,
    plays_count: 0,
    likes_count: 0,
    in_servers_count: 0,
  };
}

// Suppress unused-import warning — fmtDuration is referenced indirectly
// via BeatRow's internal rendering. Keeping the import explicit in case
// we add a duration column to the history rows later.
void fmtDuration;
