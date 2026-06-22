/**
 * Landing — Section 02. The 'old way' headache (v8).
 *
 * Theo (v8): 'garde uniquement le design old way. Met le
 * design à droite et à gauche title + sub. Retire l'image
 * screen de l'app et le fluide, nous allons rester simple'.
 *
 * Layout:
 *   ┌────────────────────────┬────────────────────────┐
 *   │ 02 ─── OUR PROMISE     │                        │
 *   │ The beat-sending       │  📧 Gmail              │
 *   │ headache ends here.    │       📷 Instagram     │
 *   │                        │  💬 WhatsApp           │
 *   │ "Organizing            │         💬 Discord     │
 *   │  contacts…" — quote    │                        │
 *   │                        │                        │
 *   └────────────────────────┴────────────────────────┘
 *
 * No product shot, no S-curve, no overlay. The chaos card
 * collage IS the visual: producers see their current life
 * (Gmail / IG / WhatsApp / Discord notification dump) sitting
 * across from the text that names the pain.
 */

"use client";

import * as React from "react";

export function LandingProblem() {
  return (
    <section
      id="problem"
      aria-labelledby="problem-title"
      className="relative"
      style={{
        paddingTop: "clamp(64px, 10vw, 120px)",
        paddingBottom: "clamp(64px, 10vw, 120px)",
        backgroundColor: "var(--bg-0)",
      }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 1280, padding: "0 24px" }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 items-center"
          style={{ gap: "clamp(40px, 6vw, 80px)" }}
        >
          <SectionHeader />
          <FloatingNotifications />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LEFT — editorial header (kicker + title + verbatim quote)
   ============================================================ */

function SectionHeader() {
  return (
    <div className="flex flex-col" style={{ gap: 28 }}>
      <div className="flex items-center" style={{ gap: 18 }}>
        <span className="t-mono" style={{ color: "var(--accent-text)" }}>
          02
        </span>
        <span
          aria-hidden="true"
          style={{ height: 1, flex: 1, background: "var(--border-1)" }}
        />
        <span className="t-mono" style={{ color: "var(--fg-3)" }}>
          Our promise
        </span>
      </div>

      <h2
        id="problem-title"
        className="t-display"
        style={{
          fontSize: "clamp(32px, 4vw, 52px)",
          letterSpacing: "-0.02em",
          lineHeight: 1.04,
        }}
      >
        The beat-sending headache{" "}
        <span
          style={{
            color: "var(--accent-text)",
            textShadow: "0 0 32px var(--accent-glow)",
          }}
        >
          ends here
        </span>
        .
      </h2>

      <figure style={{ margin: 0 }}>
        <blockquote
          className="t-body-l"
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            fontStyle: "italic",
            color: "var(--fg-1)",
            paddingLeft: 22,
            borderLeft: "2px solid var(--accent-text)",
            margin: 0,
          }}
        >
          &ldquo;Organizing contacts and keeping track of who I already sent
          stuff to is a huge headache. It takes too much time away from
          actually producing.&rdquo;
        </blockquote>
        <figcaption
          className="t-mono"
          style={{ marginTop: 14, color: "var(--fg-3)", paddingLeft: 22 }}
        >
          — a producer
        </figcaption>
      </figure>
    </div>
  );
}

/* ============================================================
   RIGHT — Free-floating notifications (no card frame)
   ────────────────────────────────────────────────────────────
   Each individual notification keeps its own glass shell
   (NotifShell), they're not contained in a parent panel —
   they float directly on the section bg.
   ============================================================ */

function FloatingNotifications() {
  // Theo: 'ressert les card socials'. v7.3 spread the four
  // tiles across the full column height with ~28-percentage-
  // -point gaps between rows. Tighter now: container is
  // shorter (aspect 1 / 0.7 instead of 1 / 0.92) and the
  // rows sit closer together (≈ 18 pp between rows) so the
  // four tiles read as one packed collage instead of a sparse
  // list. The slight overlap between adjacent tiles is
  // intentional — that's what makes it look like a
  // notification dump.
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: "1 / 0.7",
      }}
    >
      <FloatingNotif
        top="0%"
        left="0%"
        width="74%"
        rotate={-3}
        delay={0}
        duration={5.2}
      >
        <NotifGmail />
      </FloatingNotif>
      <FloatingNotif
        top="22%"
        right="0%"
        width="70%"
        rotate={2.5}
        delay={1.4}
        duration={5.8}
      >
        <NotifInstagram />
      </FloatingNotif>
      <FloatingNotif
        top="54%"
        left="0%"
        width="76%"
        rotate={-1.5}
        delay={0.7}
        duration={5.5}
      >
        <NotifWhatsapp />
      </FloatingNotif>
      <FloatingNotif
        top="76%"
        right="2%"
        width="58%"
        rotate={3}
        delay={2}
        duration={6.1}
      >
        <NotifDiscord />
      </FloatingNotif>
    </div>
  );
}

function FloatingNotif({
  top,
  left,
  right,
  bottom,
  width,
  rotate,
  delay,
  duration,
  children,
}: {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width: string;
  rotate: number;
  delay: number;
  duration: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        top,
        left,
        right,
        bottom,
        width,
        animation: `wl-float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ transform: `rotate(${rotate}deg)` }}>{children}</div>
    </div>
  );
}

function NotifShell({
  brandStripColor,
  children,
}: {
  brandStripColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-md)",
        padding: "12px 14px",
        boxShadow:
          "0 14px 30px -16px oklch(0 0 0 / 0.62), 0 2px 6px -3px oklch(0 0 0 / 0.4)",
        overflow: "hidden",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0"
        style={{ height: 2, background: brandStripColor }}
      />
      {children}
    </div>
  );
}

function NotifHeader({
  brand,
  name,
  right,
}: {
  brand: React.ReactNode;
  name: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center"
      style={{ gap: 10, marginBottom: 8 }}
    >
      {brand}
      <span className="t-mono" style={{ color: "var(--fg-3)", fontSize: 9 }}>
        {name}
      </span>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}

function BrandTile({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: 24,
        height: 24,
        borderRadius: "var(--r-sm)",
        background: bg,
        color,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </span>
  );
}

function NotifGmail() {
  const BRAND = "#EA4335";
  return (
    <NotifShell brandStripColor={BRAND}>
      <NotifHeader
        brand={
          <BrandTile bg="#FFFFFF" color={BRAND}>
            <GmailLogo size={12} />
          </BrandTile>
        }
        name="Gmail"
        right={
          <span
            className="t-mono"
            style={{
              color: BRAND,
              background:
                "color-mix(in oklch, var(--danger) 14%, transparent)",
              padding: "2px 7px",
              borderRadius: "var(--r-pill)",
              fontSize: 8,
            }}
          >
            7 new
          </span>
        }
      />
      <div className="t-title" style={{ color: "var(--fg-1)", fontSize: 12.5 }}>
        Re: Re: Re: BEATS V2 FINAL
      </div>
      <div
        className="t-mono"
        style={{ color: "var(--fg-4)", fontSize: 8.5, marginTop: 4 }}
      >
        From: kai · 14 sep
      </div>
    </NotifShell>
  );
}

function NotifInstagram() {
  const IG_GRADIENT =
    "linear-gradient(135deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)";
  return (
    <NotifShell brandStripColor="#D62976">
      <NotifHeader
        brand={
          <BrandTile bg={IG_GRADIENT} color="#FFFFFF">
            <InstagramLogo size={12} />
          </BrandTile>
        }
        name="@prodbyleo"
        right={
          <span
            className="t-mono"
            style={{ color: "var(--fg-4)", fontSize: 8 }}
          >
            2d
          </span>
        }
      />
      <div
        className="t-body"
        style={{
          color: "var(--fg-1)",
          fontSize: 12,
          background: "var(--bg-3)",
          padding: "8px 10px",
          borderRadius: "var(--r-md)",
          display: "inline-block",
          maxWidth: "100%",
        }}
      >
        yo did u send the pack??
      </div>
    </NotifShell>
  );
}

function NotifWhatsapp() {
  const BRAND = "#25D366";
  return (
    <NotifShell brandStripColor={BRAND}>
      <NotifHeader
        brand={
          <BrandTile bg={BRAND} color="#FFFFFF">
            <WhatsappLogo size={12} />
          </BrandTile>
        }
        name="WhatsApp"
        right={
          <span
            className="t-mono"
            style={{ color: "var(--fg-4)", fontSize: 8 }}
          >
            5m
          </span>
        }
      />
      <div className="t-title" style={{ color: "var(--fg-1)", fontSize: 12.5 }}>
        Manager
      </div>
      <div
        className="t-mono"
        style={{ color: "var(--fg-4)", fontSize: 8.5, marginTop: 4 }}
      >
        drop the new pack pls 🙏
      </div>
    </NotifShell>
  );
}

function NotifDiscord() {
  const BRAND = "#5865F2";
  return (
    <NotifShell brandStripColor={BRAND}>
      <NotifHeader
        brand={
          <BrandTile bg={BRAND} color="#FFFFFF">
            <DiscordLogo size={12} />
          </BrandTile>
        }
        name="ATL Producers"
        right={
          <span
            aria-hidden="true"
            className="t-mono"
            style={{
              background: "var(--danger)",
              color: "#FFFFFF",
              padding: "1px 6px",
              borderRadius: "var(--r-pill)",
              fontSize: 8,
            }}
          >
            3
          </span>
        }
      />
      <div className="t-body" style={{ color: "var(--fg-1)", fontSize: 11.5 }}>
        new pack when??
      </div>
    </NotifShell>
  );
}

/* ============================================================
   Brand SVG icons (inline)
   ============================================================ */

function GmailLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}

function InstagramLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function WhatsappLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.885 3.488" />
    </svg>
  );
}

function DiscordLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

