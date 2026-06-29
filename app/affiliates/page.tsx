/**
 * /affiliates — public affiliate program landing.
 *
 * Sales-page format: hero with the headline payoff (30 % on every
 * sale), three-card "why join" rail, four-step "how it works"
 * walk-through, commission breakdown (Lifetime $17.70 once vs Pro
 * recurring up to 12 months of LTV), short FAQ, closing CTA.
 *
 * Invitation-only flag: while the program is curated we ship a
 * landing page that explicitly says "invitation only — DM us to
 * apply" rather than a public form. The hidden form lives at
 * /affiliates/apply?invite_code=XXX (gated by env so search bots
 * can't crawl it). Once the curated pool produces case studies
 * we flip the headline and surface the form here.
 *
 * Server component, no client deps. Reuses LandingHeader and
 * LandingFooter from the marketing site so the chrome stays
 * consistent with /, /pricing, etc.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "@/components/landing/Header";
import { LandingFooter } from "@/components/landing/Footer";

export const metadata = {
  title: "Affiliate program — Wavloops",
  description:
    "Earn 30 % on every Wavloops customer you refer. Invitation-only program for active producers building an audience.",
};

const INSTAGRAM_URL = "https://www.instagram.com/wavloops.co/";

export default async function AffiliatesPage() {
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
        <Hero />
        <WhyJoin />
        <HowItWorks />
        <Commission />
        <FAQ />
        <ClosingCTA />
      </main>
      <LandingFooter />
    </>
  );
}

/* ============================================================
   HERO
   ============================================================ */

function Hero() {
  return (
    <section
      style={{
        padding: "120px 24px 80px",
        maxWidth: 1120,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 28,
      }}
    >
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
        AFFILIATE PROGRAM · INVITATION ONLY
      </span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(40px, 6vw, 72px)",
          lineHeight: 1.02,
          letterSpacing: "-0.02em",
          margin: 0,
          maxWidth: 880,
        }}
      >
        Earn <span style={{ color: "var(--accent-text)" }}>30 %</span>{" "}
        on every Wavloops customer you refer.
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 18,
          lineHeight: 1.5,
          color: "var(--fg-3)",
          margin: 0,
          maxWidth: 640,
        }}
      >
        We&rsquo;re currently growing the program with a curated group
        of producers who actively use Wavloops. Active members are
        earning real money on every customer they bring in.
      </p>
      <div
        className="flex items-center"
        style={{ gap: 14, flexWrap: "wrap", justifyContent: "center" }}
      >
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="t-mono"
          style={{
            padding: "14px 24px",
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
            boxShadow: "0 0 30px -8px var(--accent-glow)",
          }}
        >
          DM us on Instagram to apply →
        </a>
        <Link
          href="#how-it-works"
          className="t-mono"
          style={{
            padding: "14px 24px",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--border-1)",
            color: "var(--fg-2)",
            textDecoration: "none",
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          How it works
        </Link>
      </div>
      <span
        className="t-mono-s"
        style={{ color: "var(--fg-4)", marginTop: 6 }}
      >
        @wavloops.co · expect a reply within 48 h
      </span>
    </section>
  );
}

/* ============================================================
   WHY JOIN
   ============================================================ */

function WhyJoin() {
  const cards = [
    {
      label: "30 % flat",
      title: "Industry-high commission",
      body: "Most SaaS programs pay 10–20 %. We pay 30 % on every plan, every time, with no tiers or thresholds to climb.",
    },
    {
      label: "Recurring",
      title: "Pro renewals stack up",
      body: "Refer a Pro Monthly customer once, earn for the next 12 invoices. Refer a Lifetime, earn $17.70 in one shot.",
    },
    {
      label: "60-day window",
      title: "First-click attribution",
      body: "Your link drops a cookie that lasts 60 days. The user signs up later? They're still tied to you.",
    },
  ];
  return (
    <section
      style={{
        padding: "60px 24px",
        maxWidth: 1120,
        margin: "0 auto",
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.title}
            style={{
              padding: 28,
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              border: "1px solid var(--border-1)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            <span
              className="t-mono"
              style={{ color: "var(--accent-text)", fontSize: 11 }}
            >
              {c.label}
            </span>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
                margin: 0,
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14.5,
                lineHeight: 1.55,
                color: "var(--fg-3)",
                margin: 0,
              }}
            >
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Apply",
      body: "DM @wavloops.co on Instagram. We review every application manually and reply within 48 h.",
    },
    {
      n: "02",
      title: "Get your link",
      body: "Once approved you receive your handle — e.g. wavloops.co?ref=yourname — and access to a dashboard.",
    },
    {
      n: "03",
      title: "Share it",
      body: "Drop the link in your Stories, in your DMs, in the description of your YouTube videos — wherever your producer audience lives.",
    },
    {
      n: "04",
      title: "Get paid",
      body: "Every time someone signs up via your link and upgrades, you earn 30 %. We pay out via PayPal once you cross $25.",
    },
  ];
  return (
    <section
      id="how-it-works"
      style={{
        padding: "60px 24px",
        maxWidth: 1120,
        margin: "0 auto",
      }}
    >
      <SectionHeading
        kicker="HOW IT WORKS"
        title="From application to first commission."
      />
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
          marginTop: 36,
        }}
      >
        {steps.map((s) => (
          <div
            key={s.n}
            style={{
              padding: 24,
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              border: "1px solid var(--border-1)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <span
              className="t-mono"
              style={{
                color: "var(--fg-4)",
                fontSize: 12,
                letterSpacing: "0.06em",
              }}
            >
              {s.n}
            </span>
            <h4
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 19,
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.012em",
              }}
            >
              {s.title}
            </h4>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--fg-3)",
                margin: 0,
              }}
            >
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   COMMISSION BREAKDOWN
   ============================================================ */

function Commission() {
  const tiers = [
    {
      plan: "Lifetime",
      price: "$59 once",
      yourCut: "$17.70",
      note: "Paid as soon as the customer's payment clears Stripe.",
    },
    {
      plan: "Pro Monthly",
      price: "$12.90 / month",
      yourCut: "Up to $46.44",
      note: "$3.87 per month for 12 months, then the customer keeps paying but the commission caps out.",
    },
    {
      plan: "Pro Yearly",
      price: "$99 / year",
      yourCut: "$29.70",
      note: "Single yearly invoice = one commission per referred customer.",
    },
  ];
  return (
    <section
      style={{
        padding: "60px 24px",
        maxWidth: 1120,
        margin: "0 auto",
      }}
    >
      <SectionHeading
        kicker="WHAT YOU EARN"
        title="One commission rate. Every plan."
      />
      <div
        style={{
          marginTop: 36,
          borderRadius: "var(--r-lg)",
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          overflow: "hidden",
        }}
      >
        {tiers.map((t, i) => (
          <div
            key={t.plan}
            className="flex items-center"
            style={{
              padding: "22px 24px",
              borderTop:
                i === 0 ? "none" : "1px solid var(--border-1)",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 140, flex: "1 1 140px" }}>
              <div
                className="t-mono"
                style={{
                  color: "var(--fg-4)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                }}
              >
                PLAN
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 19,
                  marginTop: 4,
                }}
              >
                {t.plan}
              </div>
              <div
                className="t-mono-s"
                style={{ color: "var(--fg-4)", marginTop: 4 }}
              >
                {t.price}
              </div>
            </div>
            <div style={{ minWidth: 160, flex: "1 1 160px" }}>
              <div
                className="t-mono"
                style={{
                  color: "var(--fg-4)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                }}
              >
                YOUR CUT
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 26,
                  marginTop: 4,
                  color: "var(--accent-text)",
                }}
              >
                {t.yourCut}
              </div>
            </div>
            <p
              style={{
                flex: "2 1 300px",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--fg-3)",
                margin: 0,
              }}
            >
              {t.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */

function FAQ() {
  const items = [
    {
      q: "Who do you accept?",
      a: "Active producers — people who already use Wavloops or could realistically start. We say no to spam-traffic, coupon sites, and folks pitching unrelated audiences. Quality > volume.",
    },
    {
      q: "How long does an application take?",
      a: "We review within 48 h. If approved you get an email with your handle, your share link, and a dashboard URL.",
    },
    {
      q: "When am I paid?",
      a: "We pay out monthly via PayPal once your unpaid balance crosses $25. Below that it rolls over.",
    },
    {
      q: "What if a customer refunds?",
      a: "If Stripe refunds the payment within their 30-day window, we claw back the commission automatically. No paperwork on your side.",
    },
    {
      q: "How do you attribute the sale to me?",
      a: "When someone visits wavloops.co with your ?ref= link, we set a cookie that lasts 60 days. As long as they sign up + upgrade in that window, the sale is yours — even if they came back later.",
    },
    {
      q: "Can I link to specific pages?",
      a: "Yes. Any URL with ?ref=yourhandle works — wavloops.co?ref=yourhandle, wavloops.co/pricing?ref=yourhandle, etc. Same attribution applies.",
    },
  ];
  return (
    <section
      style={{
        padding: "80px 24px 40px",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <SectionHeading kicker="FAQ" title="The fine print, plain." />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 36,
        }}
      >
        {items.map((it) => (
          <details
            key={it.q}
            style={{
              padding: "20px 22px",
              borderRadius: "var(--r-md)",
              background: "var(--bg-1)",
              border: "1px solid var(--border-1)",
            }}
          >
            <summary
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                listStyle: "none",
                color: "var(--fg-1)",
              }}
            >
              {it.q}
            </summary>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--fg-3)",
                margin: "12px 0 0",
              }}
            >
              {it.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   CLOSING CTA
   ============================================================ */

function ClosingCTA() {
  return (
    <section
      style={{
        padding: "80px 24px 40px",
        maxWidth: 880,
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
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 42px)",
            lineHeight: 1.05,
            letterSpacing: "-0.018em",
            margin: 0,
            marginBottom: 16,
          }}
        >
          Think you&rsquo;d be a good fit?
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            lineHeight: 1.5,
            color: "var(--fg-3)",
            margin: "0 auto 28px",
            maxWidth: 480,
          }}
        >
          Slide into the DMs with a 2-line pitch — who you are, what
          you do, and where your audience hangs out. We reply to
          every message.
        </p>
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
            boxShadow: "0 0 30px -8px var(--accent-glow)",
          }}
        >
          DM @wavloops.co →
        </a>
      </div>
    </section>
  );
}

/* ============================================================
   Shared: section heading
   ============================================================ */

function SectionHeading({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <span
        className="t-mono"
        style={{
          color: "var(--accent-text)",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        {kicker}
      </span>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(28px, 4vw, 42px)",
          lineHeight: 1.05,
          letterSpacing: "-0.018em",
          margin: "16px 0 0",
        }}
      >
        {title}
      </h2>
    </div>
  );
}
