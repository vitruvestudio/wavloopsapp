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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !social.trim() || submitting) return;
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

      {/* ── Avatar — circle that overlaps the banner's bottom edge
            No accent ring (Theo's pass): just a 4px page-bg cut-out
            so the avatar reads cleanly against the banner. */}
      <div
        className="relative"
        style={{
          marginTop: -68, // straddles the banner edge
          zIndex: 10,
          padding: 4,
          borderRadius: "50%",
          background: "oklch(0.08 0.02 270)",
        }}
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

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(34px, 7vw, 44px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textAlign: "center",
            margin: 0,
          }}
        >
          {data.name}
        </h1>

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
          {data.beats_count} beat{data.beats_count === 1 ? "" : "s"} from{" "}
          <strong style={{ color: "#fff" }}>{handleAt}</strong>.{" "}
          {data.visibility === "private"
            ? "Request access to listen."
            : "Drop your email to listen."}
        </p>

        {/* Producer socials */}
        {socialEntries.length > 0 && (
          <div className="flex items-center" style={{ gap: 12 }}>
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${platform}`}
                className="inline-flex items-center justify-center transition-colors duration-fast"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "oklch(1 0 0 / 0.08)",
                  border: "1px solid oklch(1 0 0 / 0.12)",
                  color: "#fff",
                }}
              >
                <Icon
                  name={PLATFORM_ICON[platform] as IconName}
                  size={16}
                />
              </a>
            ))}
          </div>
        )}

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
              label="SOCIAL — REQUIRED"
              icon="link"
              value={social}
              onChange={setSocial}
              placeholder="@handle (Instagram, X…)"
              required
            />
            <button
              type="submit"
              disabled={
                !email.trim() || !social.trim() || submitting
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
                  !email.trim() || !social.trim() || submitting
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
