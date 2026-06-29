/**
 * /affiliates/apply — hidden application form.
 *
 * Phase 1 of the affiliate program is invitation-only: the public
 * /affiliates landing routes everyone to Instagram DMs. We hand
 * out this URL with a magic `?invite_code=` query param to the
 * producers we want in the door. The env var AFFILIATE_INVITE_CODE
 * is the single shared secret; rotate it when the public Apply
 * surface opens.
 *
 * Defense:
 *   - Missing or wrong invite_code → render a "currently
 *     invitation-only" message + Instagram CTA. Same look as the
 *     /affiliates landing so a curious visitor doesn't see the
 *     form schema even by URL-guessing.
 *   - `robots` meta noindex so search bots never index this even
 *     when the code is right.
 *
 * Form fields mirror the `affiliates` table columns so the server
 * action can insert with minimal mapping:
 *   - handle (becomes ?ref=handle)
 *   - email + display_name
 *   - payout_method + payout_email
 *   - audience_platform + audience_size
 *   - application_note (free-text "tell us about you" box)
 */

import Link from "next/link";
import { LandingHeader } from "@/components/landing/Header";
import { LandingFooter } from "@/components/landing/Footer";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "./ApplyForm";

export const metadata = {
  title: "Apply — Wavloops affiliate program",
  description: "Affiliate program application — invitation only.",
  robots: { index: false, follow: false },
};

const INSTAGRAM_URL = "https://www.instagram.com/wavloops.co/";

export default async function AffiliateApplyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const code = typeof sp.invite_code === "string" ? sp.invite_code : "";
  const expected = process.env.AFFILIATE_INVITE_CODE ?? "";

  // Constant-time comparison would be paranoid here — the secret
  // isn't sensitive enough for a timing attack to matter (worst
  // case: the URL gets leaked, we rotate the env). Equality is
  // fine for the phase-1 gate.
  const isAllowed = expected.length > 0 && code === expected;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  return (
    <>
      <LandingHeader isAuthed={isAuthed} />
      <main
        style={{
          background: "var(--bg-0)",
          color: "var(--fg-1)",
          paddingBottom: 120,
        }}
      >
        {isAllowed ? <ApplyShell /> : <ClosedShell />}
      </main>
      <LandingFooter />
    </>
  );
}

/* ============================================================
   Allowed — show the form
   ============================================================ */

function ApplyShell() {
  return (
    <section
      style={{
        padding: "100px 24px 40px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <span
          className="t-mono"
          style={{
            color: "var(--accent-text)",
            padding: "6px 14px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent-surface)",
            border:
              "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)",
            fontSize: 11,
            letterSpacing: "0.08em",
          }}
        >
          AFFILIATE APPLICATION
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 52px)",
            lineHeight: 1.05,
            letterSpacing: "-0.018em",
            margin: "20px 0 12px",
          }}
        >
          Apply to join the program.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            lineHeight: 1.5,
            color: "var(--fg-3)",
            margin: 0,
          }}
        >
          Fill the form below — we&rsquo;ll review and reply within
          48 h. Approved members earn 30 % on every Wavloops
          customer they refer.
        </p>
      </div>
      <ApplyForm />
    </section>
  );
}

/* ============================================================
   Closed — invite_code missing / wrong
   ============================================================ */

function ClosedShell() {
  return (
    <section
      style={{
        padding: "120px 24px 40px",
        maxWidth: 720,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <div
        style={{
          padding: "48px 32px",
          borderRadius: "var(--r-lg)",
          background:
            "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)",
          border:
            "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)",
          boxShadow: "0 0 60px -20px var(--accent-glow)",
        }}
      >
        <span
          className="t-mono"
          style={{
            color: "var(--accent-text)",
            fontSize: 11,
            letterSpacing: "0.08em",
          }}
        >
          INVITATION ONLY
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 40px)",
            lineHeight: 1.05,
            letterSpacing: "-0.018em",
            margin: "16px 0",
          }}
        >
          The Wavloops affiliate program is currently invitation-only.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--fg-3)",
            margin: "0 auto 28px",
            maxWidth: 480,
          }}
        >
          We&rsquo;re growing the program with a curated group of
          active producers. Slide into the DMs with a short pitch —
          we reply to every message.
        </p>
        <div
          className="flex"
          style={{ gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="t-mono"
            style={{
              padding: "14px 26px",
              borderRadius: "var(--r-pill)",
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            DM @wavloops.co →
          </a>
          <Link
            href="/affiliates"
            className="t-mono"
            style={{
              padding: "14px 26px",
              borderRadius: "var(--r-pill)",
              border: "1px solid var(--border-1)",
              color: "var(--fg-2)",
              textDecoration: "none",
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Program details →
          </Link>
        </div>
      </div>
    </section>
  );
}
