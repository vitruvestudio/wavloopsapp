/**
 * /blog — content hub index.
 *
 * Server component. Reads BLOG_POSTS (eager metadata, no MDX
 * bodies needed here) and renders a card grid sorted newest-first.
 * Each card links to /blog/<slug> where the dynamic route imports
 * the MDX module on demand.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter } from "@/components/landing/Footer";
import { LandingHeader } from "@/components/landing/Header";
import { BLOG_POSTS } from "@/content/blog";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Blog — Wavloops",
  description:
    "Guides and tutorials for music producers shipping beats to artists, labels and A&Rs. Real-world workflows, no marketing fluff.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  const sorted = [...BLOG_POSTS].sort((a, b) =>
    a.meta.publishedAt < b.meta.publishedAt ? 1 : -1,
  );

  return (
    <main style={{ backgroundColor: "var(--bg-0)" }}>
      <LandingHeader isAuthed={isAuthed} />

      {/* Top spacer to clear the fixed header */}
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
            BLOG
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
            Guides for producers shipping beats.
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
            How to track who listens, how to grow your contact list, how to
            stop losing placements to expired WeTransfer links. Written by a
            producer.
          </p>
        </div>
      </section>

      {/* Post grid */}
      <section style={{ paddingBottom: "clamp(80px, 10vw, 120px)" }}>
        <div
          className="mx-auto"
          style={{ maxWidth: 1120, padding: "0 24px" }}
        >
          {sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{ gap: 24 }}
            >
              {sorted.map((p) => (
                <PostCard key={p.meta.slug} meta={p.meta} />
              ))}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

function PostCard({
  meta,
}: {
  meta: (typeof BLOG_POSTS)[number]["meta"];
}) {
  return (
    <Link
      href={`/blog/${meta.slug}`}
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
      <div
        className="flex items-center"
        style={{ gap: 8, marginBottom: 14 }}
      >
        {meta.category && (
          <span
            className="t-mono"
            style={{
              color: "var(--accent-text)",
              letterSpacing: "0.12em",
            }}
          >
            {meta.category.toUpperCase()}
          </span>
        )}
        {meta.readTime && (
          <>
            <span
              aria-hidden
              style={{
                width: 3,
                height: 3,
                borderRadius: 999,
                background: "var(--fg-4)",
              }}
            />
            <span
              className="t-mono"
              style={{ color: "var(--fg-3)" }}
            >
              {meta.readTime}
            </span>
          </>
        )}
      </div>
      <h2
        className="t-display"
        style={{
          fontSize: 22,
          lineHeight: 1.2,
          letterSpacing: "-0.018em",
          marginBottom: 10,
          color: "var(--fg-1)",
        }}
      >
        {meta.title}
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
        {meta.description}
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
        Read article →
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
        First articles landing soon — check back in a few days.
      </p>
    </div>
  );
}
