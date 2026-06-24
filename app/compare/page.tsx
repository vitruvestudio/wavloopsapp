/**
 * /compare — versus hub index.
 *
 * Server component. Reads COMPARISONS and renders a grid of every
 * versus page so visitors who land on /compare can pick the
 * comparison they care about. Also acts as a SEO landing for the
 * "wavloops vs ..." cluster.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter } from "@/components/landing/Footer";
import { LandingHeader } from "@/components/landing/Header";
import { COMPARISONS } from "@/content/comparisons";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Wavloops compared — Beatstars, SendBeatsTo, Soundee, WeTransfer",
  description:
    "Side-by-side comparisons of Wavloops against the platforms producers usually weigh against it. Honest verdicts, feature matrices and pricing.",
  alternates: { canonical: "/compare" },
};

export default async function CompareIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  return (
    <main style={{ backgroundColor: "var(--bg-0)" }}>
      <LandingHeader isAuthed={isAuthed} />

      <div style={{ height: 96 }} />

      {/* Hero */}
      <section
        className="relative"
        style={{
          paddingTop: "clamp(32px, 5vw, 56px)",
          paddingBottom: "clamp(32px, 5vw, 56px)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 0%, var(--accent-glow) 0%, transparent 70%)",
            opacity: 0.3,
          }}
        />
        <div
          className="relative mx-auto text-center"
          style={{ maxWidth: 800, padding: "0 24px" }}
        >
          <div
            className="t-mono inline-flex items-center"
            style={{
              gap: 8,
              padding: "5px 12px",
              borderRadius: "var(--r-pill)",
              background: "var(--accent-surface)",
              border:
                "1px solid color-mix(in oklch, var(--accent-text) 40%, transparent)",
              color: "var(--accent-text)",
              letterSpacing: "0.12em",
              marginBottom: 20,
            }}
          >
            COMPARE
          </div>
          <h1
            className="t-display"
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              lineHeight: 1.04,
              letterSpacing: "-0.022em",
              marginBottom: 16,
              color: "var(--fg-1)",
            }}
          >
            Wavloops vs the rest.
          </h1>
          <p
            className="t-body-l"
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              maxWidth: 620,
              margin: "0 auto",
            }}
          >
            Honest, side-by-side comparisons with the platforms producers
            usually weigh against Wavloops.
          </p>
        </div>
      </section>

      {/* Comparison grid */}
      <section style={{ paddingBottom: "clamp(80px, 10vw, 120px)" }}>
        <div
          className="mx-auto"
          style={{ maxWidth: 1120, padding: "0 24px" }}
        >
          {COMPARISONS.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{ gap: 24 }}
            >
              {COMPARISONS.map((c) => (
                <CompareCard
                  key={c.slug}
                  slug={c.slug}
                  competitorName={c.competitorName}
                  intro={c.intro}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

function CompareCard({
  slug,
  competitorName,
  intro,
}: {
  slug: string;
  competitorName: string;
  intro: string;
}) {
  return (
    <Link
      href={`/compare/${slug}`}
      className="group flex flex-col transition-all"
      style={{
        padding: "clamp(20px, 2.5vw, 28px)",
        borderRadius: "var(--r-xl)",
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        textDecoration: "none",
        height: "100%",
        boxShadow:
          "0 12px 24px -16px oklch(0 0 0 / 0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
        transitionDuration: "var(--dur)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <span
        className="t-mono"
        style={{
          color: "var(--accent-text)",
          letterSpacing: "0.12em",
          marginBottom: 12,
        }}
      >
        VS
      </span>
      <h2
        className="t-display"
        style={{
          fontSize: 24,
          lineHeight: 1.2,
          letterSpacing: "-0.018em",
          marginBottom: 12,
          color: "var(--fg-1)",
        }}
      >
        Wavloops vs {competitorName}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          margin: 0,
        }}
      >
        {intro}
      </p>
      <div
        style={{
          marginTop: "auto",
          paddingTop: 18,
          fontSize: 13,
          color: "var(--fg-3)",
          fontFamily: "var(--font-body)",
        }}
      >
        See the comparison →
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        borderRadius: "var(--r-xl)",
        border: "1px dashed var(--border-1)",
        color: "var(--fg-3)",
      }}
    >
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15 }}>
        Comparison pages landing soon.
      </p>
    </div>
  );
}
