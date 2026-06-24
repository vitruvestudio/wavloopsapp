/**
 * JSON-LD structured data for the landing root.
 *
 * Ships three graphs as a single @graph payload so Google parses
 * them in one pass:
 *
 *   1. SoftwareApplication — Wavloops itself. Surfaces a price
 *      (Free + Lifetime + Pro) so Google's app rich-result
 *      treatment can light up. category=MusicApplication.
 *   2. Organization — Vitruve Studio, the publisher.
 *      Links to wavloops.co, the legal page, and social handles.
 *   3. FAQPage — the same 7 questions the visible FAQ section
 *      surfaces. Answers are inlined as plain-text strings here
 *      (the live FAQ uses ReactNode for formatting; SEO answers
 *      are the same content, stripped of JSX). Lets Google show
 *      the accordion-style FAQ rich result under the listing.
 *
 * @type and @id use full URLs so the graph resolves cleanly when
 * crawlers de-duplicate references to the same entity across
 * pages.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://wavloops.co";

interface FaqEntry {
  q: string;
  a: string;
}

/** Mirrors the visible FAQ in components/landing/FAQ.tsx — keep
 *  answers in sync when the marketing copy changes. The live UI
 *  renders rich JSX; this version is plain text for the JSON-LD
 *  payload Google reads. */
const FAQ_ENTRIES: FaqEntry[] = [
  {
    q: "What is Wavloops, exactly?",
    a: "Wavloops is a private beat-sharing platform for music producers. You drop beats into a server, share one link with the artists, labels and A&Rs you choose, and see who plays what — in real time. No public marketplace, no marketplace fees.",
  },
  {
    q: "How do artists get access to my server?",
    a: "Two modes. Private: you add an artist from your contacts (or by email) and they get a one-click magic link to listen. Public: anyone with the link enters with their email and lands straight on your beats. You always own the access list.",
  },
  {
    q: "Which audio formats can I upload?",
    a: "MP3 and WAV. We auto-detect BPM and key on upload, and measure integrated loudness (LUFS) so artists hear your beats at consistent playback levels.",
  },
  {
    q: "What can I actually track?",
    a: "Every play, every like, every comment, every download — per beat and per artist. You also see who's hooked (multiple replays), who's coming back (return visits), and who's ready to lock in.",
  },
  {
    q: "What's the difference between Free, Lifetime, and Pro?",
    a: "Free gives you 1 server, 10 beats and 25 artists to try the product. Lifetime ($129 once) unlocks 3 servers, 150 beats and 500 artists forever. Pro (monthly or yearly) is unlimited servers, beats and artists, plus advanced analytics.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Free is permanent and doesn't ask for a card. You only enter card details when you upgrade to Lifetime or Pro.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Pro cancels at the end of the current billing cycle — no proration, no questions asked. Lifetime is a one-time purchase, so there's nothing to cancel; you keep access forever.",
  },
];

export function LandingStructuredData() {
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "Wavloops",
        url: SITE_URL,
        description:
          "Private beat-sharing platform for music producers. Drop beats into shareable servers, invite artists, and see who plays what in real time.",
        applicationCategory: "MusicApplication",
        applicationSubCategory: "BeatSharingPlatform",
        operatingSystem: "Web",
        publisher: { "@id": `${SITE_URL}/#org` },
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/#pricing`,
          },
          {
            "@type": "Offer",
            name: "Lifetime",
            price: "129",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/#pricing`,
            description:
              "One-time payment. 3 servers, 150 beats, 500 artists. Forever.",
          },
        ],
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "Vitruve Studio",
        url: "https://vitruve.studio",
        legalName: "VITRUVE STUDIO",
        // SIREN + VAT are surfaced on /legal/legal-notice for human
        // readers; embedding them here helps Google entity-match
        // when researchers / journalists look up the company.
        taxID: "FR49884465089",
        vatID: "FR49884465089",
        contactPoint: {
          "@type": "ContactPoint",
          email: "contact@wavloops.co",
          contactType: "customer support",
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: "33 Rue Hippolyte Rouquette",
          addressLocality: "Clermont-l'Hérault",
          postalCode: "34800",
          addressCountry: "FR",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ_ENTRIES.map((entry) => ({
          "@type": "Question",
          name: entry.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: entry.a,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // SEO crawlers parse the script content verbatim. JSON.stringify
      // produces deterministic output; dangerouslySetInnerHTML is the
      // standard pattern for inlining JSON-LD in React (the schema is
      // entirely first-party, not user input).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
