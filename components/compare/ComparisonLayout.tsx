/**
 * ComparisonLayout — shared shell for every /compare/<slug> page.
 *
 * Eats a single Comparison data object and renders a consistent
 * page across all versus pages:
 *   1. Hero (Wavloops vs X)
 *   2. Two-card top with positioning + price headline
 *   3. Verdict callout
 *   4. Full feature matrix
 *   5. Side-by-side pricing tables
 *   6. Two-column "when to pick X" use case fit
 *   7. FAQ (optional)
 *   8. Final CTA
 *
 * Stays a server component. JSON-LD (FAQPage if FAQs provided +
 * Article schema) is rendered inline alongside the body so Google
 * parses it in the same pass as the meta tags.
 */

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LandingFooter } from "@/components/landing/Footer";
import { LandingHeader } from "@/components/landing/Header";
import type { Comparison, ComparisonFeatureRow } from "@/content/comparisons/types";

interface ComparisonLayoutProps {
  comparison: Comparison;
  /** Sign-in state resolved by the route. */
  isAuthed: boolean;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wavloops.co";

export function ComparisonLayout({
  comparison,
  isAuthed,
}: ComparisonLayoutProps) {
  const heroTitle = `Wavloops vs ${comparison.competitorName}`;
  const url = `${SITE_URL}/compare/${comparison.slug}`;

  return (
    <main style={{ backgroundColor: "var(--bg-0)" }}>
      <LandingHeader isAuthed={isAuthed} />

      {/* Hero */}
      <section
        className="relative"
        style={{
          paddingTop: "clamp(110px, 14vw, 160px)",
          paddingBottom: "clamp(48px, 6vw, 72px)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 0%, var(--accent-glow) 0%, transparent 70%)",
            opacity: 0.4,
          }}
        />
        <div
          className="relative mx-auto text-center"
          style={{ maxWidth: 900, padding: "0 24px" }}
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
            COMPARISON
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
            {heroTitle}
          </h1>
          <p
            className="t-body-l"
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            {comparison.intro}
          </p>
        </div>
      </section>

      {/* Verdict */}
      <Section>
        <div
          style={{
            padding: "clamp(24px, 3vw, 32px)",
            borderRadius: "var(--r-xl)",
            background: "var(--bg-1)",
            border: "1px solid var(--border-1)",
            boxShadow:
              "0 30px 60px -24px oklch(0 0 0 / 0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(22px, 2.6vw, 28px)",
              letterSpacing: "-0.018em",
              marginBottom: 12,
              color: "var(--fg-1)",
            }}
          >
            {comparison.verdictHeadline ?? "At a glance"}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 17,
              lineHeight: 1.65,
              color: "var(--fg-2)",
            }}
          >
            {comparison.verdict}
          </p>
        </div>
      </Section>

      {/* Feature matrix */}
      <Section>
        <h2
          className="t-display"
          style={{
            fontSize: "clamp(26px, 3.4vw, 36px)",
            letterSpacing: "-0.018em",
            marginBottom: 24,
            color: "var(--fg-1)",
          }}
        >
          Feature comparison
        </h2>
        <FeatureMatrix
          rows={comparison.features}
          competitorName={comparison.competitorName}
        />
      </Section>

      {/* Pricing side by side */}
      <Section>
        <h2
          className="t-display"
          style={{
            fontSize: "clamp(26px, 3.4vw, 36px)",
            letterSpacing: "-0.018em",
            marginBottom: 24,
            color: "var(--fg-1)",
          }}
        >
          Pricing
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 20 }}
        >
          <PricingCard
            heading="Wavloops"
            highlight
            plans={comparison.pricing.wavloops}
          />
          <PricingCard
            heading={comparison.competitorName}
            plans={comparison.pricing.competitor}
          />
        </div>
      </Section>

      {/* Use case fit */}
      <Section>
        <h2
          className="t-display"
          style={{
            fontSize: "clamp(26px, 3.4vw, 36px)",
            letterSpacing: "-0.018em",
            marginBottom: 24,
            color: "var(--fg-1)",
          }}
        >
          Which one is right for you?
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 20 }}
        >
          <UseCaseCard
            heading={comparison.useCases.wavloops.pickWhen}
            bullets={comparison.useCases.wavloops.bullets}
            highlight
          />
          <UseCaseCard
            heading={comparison.useCases.competitor.pickWhen}
            bullets={comparison.useCases.competitor.bullets}
          />
        </div>
      </Section>

      {/* FAQ */}
      {comparison.faq && comparison.faq.length > 0 && (
        <Section>
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(26px, 3.4vw, 36px)",
              letterSpacing: "-0.018em",
              marginBottom: 24,
              color: "var(--fg-1)",
            }}
          >
            FAQ
          </h2>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {comparison.faq.map((q) => (
              <details
                key={q.question}
                style={{
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-1)",
                  background: "var(--bg-1)",
                  padding: "16px 20px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: 16,
                    color: "var(--fg-1)",
                    listStyle: "none",
                  }}
                >
                  {q.question}
                </summary>
                <p
                  style={{
                    marginTop: 12,
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "var(--fg-2)",
                  }}
                >
                  {q.answer}
                </p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {/* Final CTA */}
      <Section>
        <div
          style={{
            padding: "clamp(28px, 4vw, 44px)",
            borderRadius: "var(--r-xl)",
            background:
              "linear-gradient(135deg, var(--accent-surface) 0%, color-mix(in oklch, var(--bg-1) 92%, var(--accent-text)) 100%)",
            border:
              "1px solid color-mix(in oklch, var(--accent-text) 30%, transparent)",
            boxShadow:
              "0 30px 60px -20px oklch(0 0 0 / 0.5), 0 0 60px -20px var(--accent-glow)",
            textAlign: "center",
          }}
        >
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(26px, 3.2vw, 36px)",
              lineHeight: 1.1,
              letterSpacing: "-0.018em",
              color: "var(--fg-1)",
              marginBottom: 12,
            }}
          >
            Try Wavloops free
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              marginBottom: 22,
              maxWidth: 540,
              marginInline: "auto",
            }}
          >
            One server, full analytics, no card needed. Lifetime $129 once if
            you stick with it.
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
      </Section>

      <LandingFooter />

      {/* JSON-LD: Article + (optional) FAQPage. Combined into one
              script block so Google parses both in the same pass. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildSchemas(comparison, url)),
        }}
      />
    </main>
  );
}

/* ============================================================
   Section wrapper — keeps the page rhythm consistent.
   ============================================================ */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="relative"
      style={{
        paddingTop: "clamp(40px, 5vw, 64px)",
        paddingBottom: 0,
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1040, padding: "0 24px" }}
      >
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   Feature matrix — true/false/string rendering.
   ============================================================ */
function FeatureMatrix({
  rows,
  competitorName,
}: {
  rows: ComparisonFeatureRow[];
  competitorName: string;
}) {
  return (
    <div
      style={{
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-1)",
        overflow: "hidden",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-body)",
        }}
      >
        <thead style={{ background: "var(--bg-2)" }}>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "12px 18px",
                color: "var(--fg-3)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                borderBottom: "1px solid var(--border-1)",
              }}
            >
              Feature
            </th>
            <th
              style={{
                textAlign: "center",
                padding: "12px 18px",
                color: "var(--accent-text)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                borderBottom: "1px solid var(--border-1)",
                width: 160,
              }}
            >
              WAVLOOPS
            </th>
            <th
              style={{
                textAlign: "center",
                padding: "12px 18px",
                color: "var(--fg-3)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                borderBottom: "1px solid var(--border-1)",
                width: 160,
              }}
            >
              {competitorName.toUpperCase()}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature}>
              <td
                style={{
                  padding: "14px 18px",
                  color: "var(--fg-1)",
                  fontSize: 15,
                  borderBottom: "1px solid var(--border-1)",
                  verticalAlign: "top",
                }}
              >
                <div>{row.feature}</div>
                {row.note && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: "var(--fg-3)",
                    }}
                  >
                    {row.note}
                  </div>
                )}
              </td>
              <td
                style={{
                  padding: "14px 18px",
                  textAlign: "center",
                  borderBottom: "1px solid var(--border-1)",
                  verticalAlign: "top",
                }}
              >
                <FeatureCell value={row.wavloops} highlight />
              </td>
              <td
                style={{
                  padding: "14px 18px",
                  textAlign: "center",
                  borderBottom: "1px solid var(--border-1)",
                  verticalAlign: "top",
                }}
              >
                <FeatureCell value={row.competitor} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureCell({
  value,
  highlight,
}: {
  value: boolean | string;
  highlight?: boolean;
}) {
  if (value === true) {
    return (
      <Icon
        name="check"
        size={18}
        style={{
          color: highlight ? "var(--accent-text)" : "var(--ok)",
        }}
      />
    );
  }
  if (value === false) {
    return (
      <Icon
        name="x"
        size={18}
        style={{ color: "var(--fg-4)" }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: 13,
        color: highlight ? "var(--accent-text)" : "var(--fg-2)",
        fontWeight: 500,
      }}
    >
      {value}
    </span>
  );
}

/* ============================================================
   Pricing card.
   ============================================================ */
function PricingCard({
  heading,
  plans,
  highlight,
}: {
  heading: string;
  plans: Array<{ name: string; price: string; notes?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "clamp(20px, 2.5vw, 28px)",
        borderRadius: "var(--r-xl)",
        background: highlight ? "var(--accent-surface)" : "var(--bg-1)",
        border: highlight
          ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
          : "1px solid var(--border-1)",
        boxShadow: highlight
          ? "0 0 28px -10px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 20,
          color: highlight ? "var(--accent-text)" : "var(--fg-1)",
          marginBottom: 16,
        }}
      >
        {heading}
      </h3>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {plans.map((p) => (
          <li
            key={p.name}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "10px 0",
              borderBottom: "1px dashed var(--border-1)",
            }}
          >
            <div
              className="flex items-baseline justify-between"
              style={{ gap: 8 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "var(--fg-1)",
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 15,
                  color: highlight ? "var(--accent-text)" : "var(--fg-1)",
                }}
              >
                {p.price}
              </span>
            </div>
            {p.notes && (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--fg-3)",
                }}
              >
                {p.notes}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   Use-case fit card.
   ============================================================ */
function UseCaseCard({
  heading,
  bullets,
  highlight,
}: {
  heading: string;
  bullets: string[];
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "clamp(20px, 2.5vw, 28px)",
        borderRadius: "var(--r-xl)",
        background: highlight ? "var(--accent-surface)" : "var(--bg-1)",
        border: highlight
          ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
          : "1px solid var(--border-1)",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 18,
          color: highlight ? "var(--accent-text)" : "var(--fg-1)",
          marginBottom: 14,
        }}
      >
        {heading}
      </h3>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start"
            style={{ gap: 10 }}
          >
            <Icon
              name="check"
              size={16}
              style={{
                color: highlight ? "var(--accent-text)" : "var(--ok)",
                marginTop: 4,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                lineHeight: 1.55,
                color: "var(--fg-2)",
              }}
            >
              {b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   Schemas — array of JSON-LD nodes for the page.
   ============================================================ */
function buildSchemas(comparison: Comparison, url: string) {
  const nodes: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Wavloops vs ${comparison.competitorName}`,
      description: comparison.seoDescription,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: {
        "@type": "Organization",
        name: "Wavloops",
        url: SITE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "Wavloops",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/opengraph-image` },
      },
    },
  ];
  if (comparison.faq && comparison.faq.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: comparison.faq.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.answer,
        },
      })),
    });
  }
  return nodes.length === 1 ? nodes[0] : nodes;
}
