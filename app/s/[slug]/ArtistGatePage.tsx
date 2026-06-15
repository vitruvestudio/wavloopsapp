/**
 * ArtistGatePage — what an artist sees when they open a server's
 * shared link. Fully public, dark theme regardless of the producer's
 * light/dark preference (this page lives outside the app shell).
 *
 * Background reflects the server's artwork_mode (per Theo's spec):
 *   - image  → the uploaded `artwork_image_url`, full-bleed, darkened
 *   - color  → a single CoverArt seeded with the slug + accent_hue,
 *              full-bleed, darkened
 *   - auto   → mosaic of the server's beat covers (CoverArt per
 *              missing artwork, real <img> per uploaded artwork),
 *              full-bleed, darkened
 *
 * Foreground centre column:
 *   - Producer avatar with accent ring/glow
 *   - "YOU'VE BEEN INVITED TO" kicker (accent mono)
 *   - Server name (big display)
 *   - "N beats from @handle. Request access to listen." sub
 *   - Producer's social icons
 *   - Form: email + required social handle
 *   - "Request access" CTA
 *   - Footer: manual-approval line + "POWERED BY WAVLOOPS · NO
 *     ACCOUNT NEEDED"
 *
 * Submission is a stub for this pass — alerts the artist that the
 * request was received and emails the producer. The real
 * insert-into-server_contacts + producer-notification flow lands
 * next.
 */

"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { PLATFORM_ICON } from "@/lib/socials";
import type { ArtistGateData } from "./page";

interface ArtistGatePageProps {
  data: ArtistGateData;
}

export function ArtistGatePage({ data }: ArtistGatePageProps) {
  const [email, setEmail] = React.useState("");
  const [social, setSocial] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const producerHandle =
    data.producer_handle ?? data.producer_name ?? "the producer";
  const handleAt = producerHandle.startsWith("@")
    ? producerHandle
    : `@${producerHandle}`;

  // Private servers need manual approval → producer wants a social
  // handle to vet the artist. Public servers auto-join → no friction,
  // social is optional.
  const socialRequired = data.visibility === "private";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    if (socialRequired && !social.trim()) return;
    setSubmitting(true);
    // Stub — real submission lands next. We fake the network so the
    // success state feels real.
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 450);
  };

  const socialEntries = Object.entries(data.producer_socials ?? {}).filter(
    ([k, v]) => v && PLATFORM_ICON[k],
  );

  return (
    <main
      className="relative min-h-screen flex flex-col items-center"
      style={{
        background: "oklch(0.08 0.02 270)",
        color: "#fff",
      }}
    >
      {/* ── Banner — server artwork, Discord/Spotify-style ──── */}
      <GateBanner data={data} />

      {/* ── Avatar — straddles the banner's bottom edge, no ring. */}
      <div
        className="relative"
        style={{ marginTop: -64, zIndex: 10 }}
      >
        <Avatar
          name={data.producer_name ?? handleAt}
          src={data.producer_avatar_url}
          size={128}
        />
      </div>

      {/* ── Foreground column ─────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          width: "100%",
          maxWidth: 420,
          gap: 22,
          padding: "22px 22px 48px",
        }}
      >

        {/* @handle — sits right under the avatar so the artist sees
            who's pitching the pack before anything else. */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: 0,
          }}
        >
          {handleAt}
        </div>

        {/* Certifications — also under the avatar, sandwich-style
            credibility signal. Only rendered when the producer has
            any in their profile. */}
        {data.producer_certifications.length > 0 && (
          <div
            className="flex items-center justify-center flex-wrap"
            style={{ gap: 6 }}
          >
            {data.producer_certifications.map((c) => (
              <span
                key={c}
                className="inline-flex items-center"
                style={{
                  height: 24,
                  padding: "0 10px",
                  gap: 4,
                  borderRadius: "var(--r-sm)",
                  background: "oklch(0.55 0.18 80 / 0.16)",
                  border: "1px solid oklch(0.6 0.18 80 / 0.45)",
                  color: "oklch(0.92 0.14 90)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Visibility chip — accent-blue Tag (same DS variant as a
            beat's COMP / LOOP chip). */}
        <Tag
          variant="accent"
          icon={data.visibility === "public" ? "globe" : "lock"}
        >
          {data.visibility}
        </Tag>

        {/* Title — small enough that "Atlanta-Night" fits on one
            line even on narrow phones. */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(26px, 6.5vw, 40px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textAlign: "center",
            margin: 0,
          }}
        >
          {data.name}
        </h1>

        {/* Remaining meta — beats count + mood tags below the title. */}
        <GateMeta data={data} />

        {/* Sub */}
        <p
          style={{
            color: "oklch(0.78 0.02 270)",
            textAlign: "center",
            fontSize: 15,
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 340,
          }}
        >
          From <strong style={{ color: "#fff" }}>{handleAt}</strong>.{" "}
          {data.visibility === "private"
            ? "Request access to listen."
            : "Drop your email to listen."}
        </p>

        {/* Description — producer's pitch (style/exclusivity/lease
            terms). Optional so we render conditionally. */}
        {data.description && (
          <p
            style={{
              color: "oklch(0.72 0.02 270)",
              textAlign: "center",
              fontSize: 14,
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 360,
              whiteSpace: "pre-wrap",
            }}
          >
            {data.description}
          </p>
        )}

        {/* ── Producer extras — socials + placements. Handle +
              certifications moved up under the avatar; this block
              keeps only the "reach + receipts" content that sits
              naturally before the form. */}
        <ProducerBlock data={data} />

        {/* Form or success card */}
        {submitted ? (
          <SuccessCard
            handle={handleAt}
            visibility={data.visibility}
          />
        ) : (
          <form
            onSubmit={submit}
            className="flex flex-col w-full"
            style={{ gap: 14, marginTop: 6 }}
          >
            <GateField
              label="EMAIL"
              icon="mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              required
            />
            <GateField
              label={
                socialRequired
                  ? "SOCIAL — REQUIRED"
                  : "SOCIAL — OPTIONAL"
              }
              icon="link"
              value={social}
              onChange={setSocial}
              placeholder="@handle (Instagram, X…)"
              required={socialRequired}
            />
            <button
              type="submit"
              disabled={
                !email.trim() ||
                (socialRequired && !social.trim()) ||
                submitting
              }
              className="inline-flex items-center justify-center cursor-pointer transition-all duration-fast"
              style={{
                gap: 10,
                marginTop: 4,
                padding: "14px 18px",
                height: 50,
                width: "100%",
                borderRadius: "var(--r-md)",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 0,
                opacity:
                  !email.trim() ||
                  (socialRequired && !social.trim()) ||
                  submitting
                    ? 0.5
                    : 1,
              }}
            >
              {submitting
                ? "Sending request…"
                : data.visibility === "private"
                  ? "Request access"
                  : "Get access"}
              {!submitting && <Icon name="arrow-right" size={16} />}
            </button>
          </form>
        )}

        {/* Footer */}
        <div
          className="t-mono-s flex flex-col items-center text-center"
          style={{
            color: "oklch(0.6 0.02 270)",
            letterSpacing: "0.1em",
            gap: 6,
            marginTop: 18,
          }}
        >
          <div>
            {data.visibility === "private"
              ? `MANUAL APPROVAL BY ${handleAt.toUpperCase()}`
              : `INSTANT ACCESS · CURATED BY ${handleAt.toUpperCase()}`}
          </div>
          <div>POWERED BY WAVLOOPS · NO ACCOUNT NEEDED</div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   ProducerBlock — socials + placements carousel. Handle + certs
   moved out (rendered above, right under the avatar) so this block
   keeps only the "extras" that sit naturally before the form.
   ============================================================ */

function ProducerBlock({ data }: { data: ArtistGateData }) {
  const socialEntries = Object.entries(data.producer_socials ?? {}).filter(
    ([k, v]) => v && PLATFORM_ICON[k],
  );
  if (
    socialEntries.length === 0 &&
    data.producer_placements.length === 0
  ) {
    return null;
  }
  return (
    <div
      className="flex flex-col items-center w-full"
      style={{ gap: 14 }}
    >
      {/* Socials */}
      {socialEntries.length > 0 && (
        <div className="flex items-center" style={{ gap: 10 }}>
          {socialEntries.map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${platform}`}
              className="inline-flex items-center justify-center transition-colors duration-fast"
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "oklch(1 0 0 / 0.08)",
                border: "1px solid oklch(1 0 0 / 0.12)",
                color: "#fff",
              }}
            >
              <Icon
                name={PLATFORM_ICON[platform] as IconName}
                size={15}
              />
            </a>
          ))}
        </div>
      )}

      {/* Placements carousel — horizontal scroll snap. */}
      {data.producer_placements.length > 0 && (
        <PlacementsCarousel
          placements={data.producer_placements}
        />
      )}
    </div>
  );
}

function PlacementsCarousel({
  placements,
}: {
  placements: ArtistGateData["producer_placements"];
}) {
  return (
    <div
      className="w-full"
      style={{
        marginTop: 6,
        // Bleed slightly past the column padding so the cards look
        // edge-to-edge on mobile.
        marginLeft: -10,
        marginRight: -10,
      }}
    >
      <div
        className="flex overflow-x-auto"
        style={{
          gap: 10,
          padding: "0 12px",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
        }}
      >
        {placements.map((p) => {
          const thumb =
            p.platform === "YouTube" && p.url
              ? youtubeThumbnail(p.url)
              : null;
          const cardInner = (
            <div
              className="flex flex-col shrink-0"
              style={{
                width: 200,
                scrollSnapAlign: "start",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                background: "oklch(1 0 0 / 0.06)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <div
                className="relative"
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  background:
                    p.platform === "Spotify"
                      ? "oklch(0.55 0.18 145)"
                      : "oklch(0.55 0.22 25)",
                }}
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "oklch(0 0 0 / 0.5)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    name={
                      p.platform === "Spotify" ? "spotify" : "youtube"
                    }
                    size={14}
                  />
                </div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div
                  className="truncate"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {p.title}
                </div>
                <div
                  className="t-mono-s"
                  style={{
                    color: "oklch(0.6 0.02 270)",
                    marginTop: 3,
                  }}
                >
                  {p.platform.toUpperCase()}
                </div>
              </div>
            </div>
          );
          return p.url ? (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              {cardInner}
            </a>
          ) : (
            <div key={p.id}>{cardInner}</div>
          );
        })}
      </div>
    </div>
  );
}

/** Extract the video id from common YouTube URL shapes and return
 *  the medium-resolution thumbnail URL. Returns null if the URL
 *  doesn't look like YouTube. */
function youtubeThumbnail(rawUrl: string): string | null {
  try {
    const u = new URL(
      /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`,
    );
    const host = u.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = u.pathname.replace(/^\//, "").split("/")[0] || null;
    } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/embed/"))
        id = u.pathname.split("/")[2] ?? null;
      else if (u.pathname.startsWith("/shorts/"))
        id = u.pathname.split("/")[2] ?? null;
    }
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  } catch {
    return null;
  }
}

/* ============================================================
   GateMeta — beats count + mood chips, rendered under the title.
   Visibility moved above the title (rendered there directly) so
   it doesn't share the chip strip and can read as the "what kind
   of pack is this" headline tag.
   ============================================================ */

function GateMeta({ data }: { data: ArtistGateData }) {
  const moodTags = (data.style_text ?? "")
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Use the DS Tag with a darker shade override — same shape as the
  // app's Tag variant="solid" but tuned for a dark surface.
  const darkSolid: React.CSSProperties = {
    height: 24,
    padding: "0 10px",
    gap: 5,
    borderRadius: "var(--r-sm)",
    background: "oklch(1 0 0 / 0.08)",
    border: "1px solid transparent",
    color: "oklch(0.88 0.02 270)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  };
  return (
    <div
      className="flex items-center justify-center flex-wrap"
      style={{ gap: 6 }}
    >
      <span className="inline-flex items-center" style={darkSolid}>
        <Icon name="library" size={11} />
        {data.beats_count} {data.beats_count === 1 ? "beat" : "beats"}
      </span>
      {moodTags.map((m) => (
        <span
          key={m}
          className="inline-flex items-center"
          style={darkSolid}
        >
          {m}
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   GateBanner — top banner that shows the server's artwork. The
   avatar overlaps its bottom edge (sketch reference Theo shared).
   ============================================================ */

function GateBanner({ data }: { data: ArtistGateData }) {
  return (
    <section
      aria-hidden
      className="relative overflow-hidden w-full"
      style={{
        height: "clamp(180px, 32vw, 260px)",
      }}
    >
      {data.artwork_mode === "image" && data.artwork_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.artwork_image_url}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : data.artwork_mode === "color" && data.accent_hue != null ? (
        <CoverArt fill seed={data.slug} hue={data.accent_hue} />
      ) : (
        <BeatMosaic data={data} />
      )}
      {/* Bottom fade — banner blends into the page background so the
          avatar circle reads as cleanly cut out, with no hard edge. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, transparent 35%, oklch(0.08 0.02 270 / 0.4) 70%, oklch(0.08 0.02 270) 100%)",
        }}
      />
    </section>
  );
}

function BeatMosaic({ data }: { data: ArtistGateData }) {
  const tiles =
    data.beat_covers.length > 0
      ? data.beat_covers
      : [{ artwork_url: null, wave_seed: data.slug }];
  return (
    <div
      className="flex"
      style={{
        position: "absolute",
        inset: 0,
        gap: 2,
      }}
    >
      {tiles.map((t, i) => (
        <div
          key={i}
          className="relative"
          style={{ flex: 1, overflow: "hidden" }}
        >
          {t.artwork_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.artwork_url}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <CoverArt fill seed={t.wave_seed} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   GateField — dark-themed text input with leading icon + mono label
   ============================================================ */

function GateField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  icon: IconName;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: "text" | "email";
  required?: boolean;
}) {
  return (
    <label className="flex flex-col" style={{ gap: 8 }}>
      <span
        className="t-mono-s"
        style={{
          color: "oklch(0.6 0.02 270)",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
      <span
        className="inline-flex items-center transition-all duration-fast focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
        style={{
          height: 46,
          padding: "0 14px",
          gap: 10,
          borderRadius: "var(--r-md)",
          background: "oklch(1 0 0 / 0.06)",
          border: "1px solid oklch(1 0 0 / 0.12)",
        }}
      >
        <Icon
          name={icon}
          size={15}
          style={{ color: "oklch(0.6 0.02 270)" }}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent outline-none min-w-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            color: "#fff",
          }}
        />
      </span>
    </label>
  );
}

/* ============================================================
   SuccessCard
   ============================================================ */

function SuccessCard({
  handle,
  visibility,
}: {
  handle: string;
  visibility: "public" | "private";
}) {
  return (
    <div
      className="flex flex-col items-center text-center w-full"
      style={{
        gap: 10,
        marginTop: 4,
        padding: "22px 18px",
        borderRadius: "var(--r-md)",
        background: "oklch(1 0 0 / 0.06)",
        border: "1px solid oklch(0.6 0.16 145 / 0.5)",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "oklch(0.55 0.18 145 / 0.18)",
          color: "oklch(0.8 0.18 145)",
          marginBottom: 4,
        }}
      >
        <Icon name="check" size={22} />
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 17,
          fontWeight: 600,
          color: "#fff",
        }}
      >
        {visibility === "private"
          ? "Request sent"
          : "You're in"}
      </div>
      <div
        className="t-body-s"
        style={{ color: "oklch(0.7 0.02 270)", lineHeight: 1.5 }}
      >
        {visibility === "private"
          ? `${handle} reviews these manually. You'll get an email as soon as they approve.`
          : `${handle} just emailed you a private link to listen. Check your inbox.`}
      </div>
    </div>
  );
}
