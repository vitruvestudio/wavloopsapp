/**
 * Landing — Section 07. Catalog carousel.
 *
 * Inspired by the 'Your New Favorite Cloud' reference Theo
 * shared: big centered title + a horizontal marquee of square
 * cover-art tiles, edges bleeding off the panel. Adapted for
 * the Wavloops dark aesthetic — elevated bg-1 panel with
 * rounded corners, indigo accent on the title's hook word,
 * and a brand-flavored hover state per cover (scale up +
 * accent-glow shadow + accent play disc overlay).
 *
 * Dynamic behaviour
 * ─────────────────
 *   - Covers scroll continuously L→R via wl-marquee. Pause on
 *     hover anywhere over the carousel.
 *   - Per-cover hover: cover scales 1.04, picks up an accent
 *     drop shadow, and reveals a title + meta gradient strip
 *     at the bottom plus a play disc top-right.
 *   - Audio preview: a single shared <audio> element plays
 *     /audio/preview.mp3 (when present) the moment a cover is
 *     hovered, pauses when the visitor moves off. Silently
 *     fails if no file exists — Theo can drop one in later.
 *
 * Source covers
 * ─────────────
 * Real seeded covers from the Supabase beat-covers bucket
 * (public). Same images that already power the producer's
 * library, so the carousel is showing the *real* product
 * surface rather than stock visuals.
 */

"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";

const BUCKET_BASE =
  "https://sgowrqzkdugbarfbvlqk.supabase.co/storage/v1/object/public/beat-covers/d0ee3e41-45c5-47ce-9ca0-04b52b0474d4";

interface Beat {
  id: string;
  title: string;
  meta: string;
  cover: string;
}

const BEATS: Beat[] = [
  { id: "00", title: "Night Shift 03",  meta: "80 BPM · F MIN",  cover: `${BUCKET_BASE}/seed-00.jpg` },
  { id: "01", title: "Midnight Drift",  meta: "142 BPM · F MIN", cover: `${BUCKET_BASE}/seed-01.jpg` },
  { id: "02", title: "Velvet Glow",     meta: "98 BPM · A MIN",  cover: `${BUCKET_BASE}/seed-02.jpg` },
  { id: "03", title: "Honeybloom",      meta: "110 BPM · C MAJ", cover: `${BUCKET_BASE}/seed-03.jpg` },
  { id: "04", title: "Cobalt",          meta: "134 BPM · G MIN", cover: `${BUCKET_BASE}/seed-04.jpg` },
  { id: "05", title: "Golden Hour",     meta: "78 BPM · C MIN",  cover: `${BUCKET_BASE}/seed-05.jpg` },
  { id: "06", title: "Lavender Sky",    meta: "92 BPM · D MAJ",  cover: `${BUCKET_BASE}/seed-06.jpg` },
  { id: "07", title: "Smoke Lounge",    meta: "86 BPM · E MIN",  cover: `${BUCKET_BASE}/seed-07.jpg` },
  { id: "08", title: "Crystal Coast",   meta: "124 BPM · B MIN", cover: `${BUCKET_BASE}/seed-08.jpg` },
  { id: "09", title: "Sunset Drive",    meta: "100 BPM · F MAJ", cover: `${BUCKET_BASE}/seed-09.jpg` },
];

export function LandingCatalog() {
  const [paused, setPaused] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Drive a single shared <audio> element from the currently
  // hovered cover. play() is wrapped in catch() so a missing
  // /audio/preview.mp3 (or autoplay block) doesn't surface as
  // an unhandled rejection — the visual hover state still
  // works either way.
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (hoveredId !== null) {
      a.currentTime = 0;
      a.volume = 0.7;
      void a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [hoveredId]);

  // Triple the list so the marquee can translate by exactly
  // -33.333% and snap back to a visually identical frame.
  const items = React.useMemo(
    () => [...BEATS, ...BEATS, ...BEATS],
    [],
  );

  return (
    // Full-width edge-to-edge section. Theo: 'it should take the
    // whole screen, full width, color D9D9D9 hardcoded'. The
    // section IS the panel now — no outer dark margins, no
    // max-width constraint, no rounded corners. The light gray
    // contrasts hard with the rest of the dark landing, which
    // mirrors the reference's 'card peeking from the page' move.
    <section
      id="catalog"
      aria-label="Catalog carousel"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "#D9D9D9",
        // 50px rounded top corners — the section juts into the
        // dark canvas above as a 'card peeking from the page'.
        // Bottom stays squared so the next section flows from
        // a clean horizontal edge.
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
      }}
    >
      {/* Title + subtitle — dark text on light gray. 'cloud'
              kept in the brand accent so the typographic move
              stays consistent across every section. */}
      <div
        className="mx-auto text-center"
        style={{
          maxWidth: 1040,
          padding: "0 24px",
          marginBottom: "clamp(32px, 4vw, 56px)",
        }}
      >
        <h2
          className="t-display"
          style={{
            fontSize: "clamp(32px, 4vw, 52px)",
            lineHeight: 1.06,
            letterSpacing: "-0.02em",
            color: "#0F0F12",
            marginBottom: 18,
          }}
        >
          Your{" "}
          <span
            style={{
              color: "var(--accent)",
              textShadow: "0 0 28px color-mix(in oklch, var(--accent) 35%, transparent)",
            }}
          >
            private
          </span>{" "}
          catalog.
          <br />
          Not a public marketplace.
        </h2>
        <p
          className="t-body-l"
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            color: "#4a4a52",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          Every beat in one place — shared only with the artists, labels and
          A&amp;Rs you choose. No noise, no crowd. Just your music, in front
          of the people who can place it.
        </p>
      </div>

      {/* Marquee viewport — overflow-hidden so covers bleed
              cleanly off the left + right edges. */}
      <div className="relative" style={{ overflow: "hidden" }}>
        {/* Edge fade masks — fade into the panel's #D9D9D9 so
                covers don't hard-cut at the viewport edges. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{
            width: "clamp(40px, 6vw, 100px)",
            background:
              "linear-gradient(to right, #D9D9D9 0%, transparent 100%)",
            zIndex: 2,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 pointer-events-none"
          style={{
            width: "clamp(40px, 6vw, 100px)",
            background:
              "linear-gradient(to left, #D9D9D9 0%, transparent 100%)",
            zIndex: 2,
          }}
        />

        <div
          className="flex"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            setPaused(false);
            setHoveredId(null);
          }}
          style={{
            width: "max-content",
            // Wider gap — covers breathe instead of packing.
            gap: "clamp(28px, 3vw, 48px)",
            padding: "16px 0",
            animation: "wl-marquee 60s linear infinite",
            animationPlayState: paused ? "paused" : "running",
            willChange: "transform",
          }}
        >
          {items.map((b, i) => (
            <CoverTile
              key={`${b.id}-${i}`}
              beat={b}
              active={hoveredId === `${b.id}-${i}`}
              onEnter={() => setHoveredId(`${b.id}-${i}`)}
            />
          ))}
        </div>
      </div>

      {/* Shared audio element. Path points to a sample loop the
              producer can drop in. preload='none' keeps the page
              weight zero until first hover. */}
      <audio
        ref={audioRef}
        src="/audio/preview.mp3"
        preload="none"
        loop
      />
    </section>
  );
}

/* ============================================================
   CoverTile — single square cover with hover affordances.
   ============================================================ */

function CoverTile({
  beat,
  active,
  onEnter,
}: {
  beat: Beat;
  active: boolean;
  onEnter: () => void;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      className="relative overflow-hidden shrink-0"
      style={{
        // Larger tiles — covers are the hero of this section.
        width: "clamp(220px, 22vw, 340px)",
        aspectRatio: "1 / 1",
        borderRadius: 20,
        // No border on light bg — the cover's own image content
        // gives it edge against the panel.
        transition:
          "transform 0.35s var(--ease-out), box-shadow 0.35s var(--ease-out)",
        transform: active ? "translateY(-4px) scale(1.04)" : "translateY(0) scale(1)",
        // Softer drop shadows — the previous values left a visible
        // dark horizontal band along the bottom of every tile.
        // Wider spread + lower opacity + larger -Y offset on the
        // softening blur diffuse the shadow into the gray instead
        // of stamping a line.
        boxShadow: active
          ? "0 40px 70px -28px rgba(0,0,0,0.22), 0 0 60px -10px var(--accent-glow)"
          : "0 24px 50px -28px rgba(0,0,0,0.18)",
        cursor: "pointer",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beat.cover}
        alt={beat.title}
        loading="lazy"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          userSelect: "none",
        }}
      />

      {/* Bottom-up gradient + title/meta — revealed on hover */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col justify-end"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 55%, transparent 75%)",
          padding: "14px 16px",
          opacity: active ? 1 : 0,
          transition: "opacity 0.3s var(--ease-out)",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(15px, 1.4vw, 19px)",
            letterSpacing: "-0.01em",
            color: "#fff",
            lineHeight: 1.15,
          }}
        >
          {beat.title}
        </span>
        <span
          className="t-mono"
          style={{
            marginTop: 6,
            color: "rgba(255,255,255,0.78)",
            fontSize: 10.5,
          }}
        >
          {beat.meta}
        </span>
      </div>

      {/* Play disc top-right — appears on hover */}
      <div
        aria-hidden="true"
        className="absolute flex items-center justify-center"
        style={{
          top: 14,
          right: 14,
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "var(--accent-fg)",
          border: "1px solid color-mix(in oklch, var(--accent-fg) 18%, transparent)",
          boxShadow:
            "0 0 0 6px color-mix(in oklch, var(--accent) 18%, transparent), 0 16px 32px -10px var(--accent-glow)",
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(0.82)",
          transition:
            "opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out)",
          zIndex: 3,
        }}
      >
        <Icon name="play" size={20} />
      </div>
    </div>
  );
}
