/**
 * BlogPostLayout — shared shell for every /blog/<slug> page.
 *
 * Renders the page chrome (header + footer) plus the typographic
 * frame around the MDX body: eyebrow + title + sub + meta line +
 * article container. The body itself (MDX) is passed in as
 * children so the per-post page can compose it.
 *
 * Stays a server component — no client hooks here. The LandingHeader
 * pulled in is "use client" but composes fine inside a server tree.
 *
 * SEO note:
 *   - We render the JSON-LD <BlogPosting> inline so Google parses
 *     it in the same pass as the meta tags.
 *   - The visible H1 doubles as the schema headline.
 */

import * as React from "react";
import Link from "next/link";
import type { BlogPostMeta } from "@/content/blog";
import { LandingFooter } from "@/components/landing/Footer";
import { LandingHeader } from "@/components/landing/Header";

interface BlogPostLayoutProps {
  meta: BlogPostMeta;
  /** Sign-in state resolved by the page route (avoids re-fetching
   *  in the layout). */
  isAuthed: boolean;
  /** Compiled MDX body. */
  children: React.ReactNode;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wavloops.co";

export function BlogPostLayout({
  meta,
  isAuthed,
  children,
}: BlogPostLayoutProps) {
  const ogImage = meta.ogImage ?? `${SITE_URL}/opengraph-image`;
  // Default byline carries both identities: the legal name (SEO,
  // schema.org Person, A&R/label credibility) and the producer
  // alias the music audience already recognises. Individual posts
  // can override via meta.author when needed.
  const author = meta.author ?? "Théo Gherbi (40mins)";

  return (
    <main style={{ backgroundColor: "var(--bg-0)" }}>
      <LandingHeader isAuthed={isAuthed} />

      {/* Top spacer so the article doesn't sit under the fixed
              header. Matches the hero's offset on the landing. */}
      <div style={{ height: 96 }} />

      <article
        className="relative mx-auto"
        style={{
          maxWidth: 760,
          padding: "0 24px",
          paddingBottom: "clamp(64px, 8vw, 96px)",
        }}
      >
        {/* Eyebrow row — category + back to blog */}
        <div
          className="flex items-center"
          style={{ gap: 12, marginBottom: 18 }}
        >
          <Link
            href="/blog"
            className="t-mono"
            style={{
              color: "var(--fg-3)",
              textDecoration: "none",
              letterSpacing: "0.12em",
            }}
          >
            ← BLOG
          </Link>
          {meta.category && (
            <>
              <span
                aria-hidden
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: "var(--fg-4)",
                }}
              />
              <span
                className="t-mono"
                style={{
                  color: "var(--accent-text)",
                  letterSpacing: "0.12em",
                }}
              >
                {meta.category.toUpperCase()}
              </span>
            </>
          )}
        </div>

        <h1
          className="t-display"
          style={{
            fontSize: "clamp(34px, 5vw, 56px)",
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            marginBottom: 18,
            color: "var(--fg-1)",
          }}
        >
          {meta.title}
        </h1>

        <p
          className="t-body-l"
          style={{
            fontSize: 19,
            lineHeight: 1.55,
            color: "var(--fg-2)",
            marginBottom: 28,
          }}
        >
          {meta.description}
        </p>

        {/* Meta line — author · date · read time */}
        <div
          className="flex items-center flex-wrap"
          style={{
            gap: 12,
            fontFamily: "var(--font-body)",
            color: "var(--fg-3)",
            fontSize: 14,
            marginBottom: 40,
          }}
        >
          <span>{author}</span>
          <span aria-hidden>·</span>
          <time dateTime={meta.publishedAt}>
            {formatDate(meta.publishedAt)}
          </time>
          {meta.readTime && (
            <>
              <span aria-hidden>·</span>
              <span>{meta.readTime}</span>
            </>
          )}
        </div>

        {/* Body */}
        {children}

        {/* Final CTA — every post nudges to /auth at the bottom */}
        <FinalCta />
      </article>

      <LandingFooter />

      {/* JSON-LD BlogPosting — fed by the same meta the head uses */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: meta.title,
            description: meta.description,
            datePublished: meta.publishedAt,
            dateModified: meta.publishedAt,
            image: ogImage,
            author: {
              "@type": "Person",
              // Schema.org wants the legal name in `name`. The
              // producer alias goes in `alternateName` so search
              // engines understand "Théo Gherbi" and "40mins" point
              // at the same person without the visible byline string
              // getting parsed as a single token.
              name: "Théo Gherbi",
              alternateName: "40mins",
              url: SITE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "Wavloops",
              url: SITE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/opengraph-image`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${SITE_URL}/blog/${meta.slug}`,
            },
          }),
        }}
      />
    </main>
  );
}

function FinalCta() {
  return (
    <div
      className="mx-auto"
      style={{
        marginTop: 56,
        padding: "clamp(28px, 4vw, 40px)",
        borderRadius: "var(--r-xl)",
        background:
          "linear-gradient(135deg, var(--accent-surface) 0%, color-mix(in oklch, var(--bg-1) 92%, var(--accent-text)) 100%)",
        border: "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)",
        boxShadow:
          "0 30px 60px -20px oklch(0 0 0 / 0.5), 0 0 60px -20px var(--accent-glow)",
      }}
    >
      <h2
        className="t-display"
        style={{
          fontSize: "clamp(24px, 3vw, 32px)",
          lineHeight: 1.1,
          letterSpacing: "-0.018em",
          color: "var(--fg-1)",
          marginBottom: 12,
        }}
      >
        Stop sending beats. Start sharing one link.
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          marginBottom: 20,
        }}
      >
        Create your first server in 90 seconds — no card needed.
      </p>
      <Link
        href="/auth?intent=signup"
        className="inline-flex items-center"
        style={{
          gap: 8,
          padding: "12px 22px",
          borderRadius: "var(--r-pill)",
          background: "var(--accent)",
          color: "white",
          textDecoration: "none",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: 15,
        }}
      >
        Create your first server →
      </Link>
    </div>
  );
}

function formatDate(iso: string): string {
  // Server-rendered, deterministic; safe across timezones since
  // the YYYY-MM-DD string carries no time component.
  const [year, month, day] = iso.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
