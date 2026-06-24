/**
 * Wavloops vs Soundee — closest functional comparison. Soundee is
 * the modern Beatstars alternative: smart links + marketing
 * automation, lower commissions, Stripe-native. Wavloops differs
 * in shape: server-based living link (vs link-per-beat smart
 * links), public-server gate as lead capture, Lifetime offer.
 */

import type { Comparison } from "./types";

const soundee: Comparison = {
  slug: "soundee",
  competitorName: "Soundee",
  seoTitle: "Wavloops vs Soundee (2026) — beat distribution compared",
  seoDescription:
    "Soundee vs Wavloops for music producers in 2026. Smart links vs living server links, lead capture, marketing automation, pricing, and when to pick each.",
  intro:
    "Both ship modern beat-distribution links with analytics. Soundee bets on smart links + marketing automation. Wavloops bets on one living server link per project that turns the gate page into a lead-capture funnel.",
  verdictHeadline: "At a glance",
  verdict:
    "Soundee is a sharp modern alternative to Beatstars — smart links, Stripe-native payments, lower take rates. Wavloops shares the link-based DNA but bets differently: instead of one smart link per beat, you ship one living server link per project that artists can come back to as you add beats. Wavloops also turns public servers into a lead-capture engine (email + social before listen), which Soundee doesn't ship. Pick Soundee for smart-link marketing automation. Pick Wavloops if you'd rather have one durable link per project and a CRM that grows with every shared listen.",
  features: [
    {
      feature: "Living server link (updates as you add beats)",
      wavloops: true,
      competitor: false,
      note: "Soundee uses smart links per beat / track.",
    },
    {
      feature: "Smart link analytics per beat",
      wavloops: true,
      competitor: true,
    },
    {
      feature: "Per-artist play tracking",
      wavloops: true,
      competitor: "Aggregate by link",
    },
    {
      feature: "Public server gate (email + social lead capture)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Marketing automation (drip sequences, abandoned cart)",
      wavloops: false,
      competitor: true,
    },
    {
      feature: "Auto BPM / key / loudness detection on upload",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Built-in producer CRM (contacts + notes)",
      wavloops: true,
      competitor: "Limited",
    },
    {
      feature: "Lifetime plan",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Native Stripe + Crypto payments for sales",
      wavloops: "Stripe (subs + lifetime)",
      competitor: true,
    },
    {
      feature: "Free tier",
      wavloops: "1 server, full analytics",
      competitor: "Yes with sales fee",
    },
    {
      feature: "Loop pack distribution producer-to-producer",
      wavloops: true,
      competitor: false,
    },
  ],
  pricing: {
    wavloops: [
      { name: "Free", price: "$0", notes: "1 server, full analytics, no card" },
      { name: "Lifetime", price: "$129 once", notes: "3 servers, forever" },
      { name: "Pro", price: "from $12/mo", notes: "Unlimited servers + beats" },
    ],
    competitor: [
      { name: "Free", price: "$0", notes: "Sales fee applies" },
      { name: "Pro", price: "~$9.99/mo", notes: "Lower take rate" },
      { name: "Premium", price: "~$19.99/mo", notes: "0% commission tier" },
    ],
  },
  useCases: {
    wavloops: {
      pickWhen: "When to pick Wavloops",
      bullets: [
        "You want ONE link per project that lives across multiple drops",
        "You want a public server gate to capture leads (email + social)",
        "You prefer Lifetime $129 once over a subscription",
        "You want per-artist play tracking, not aggregate link analytics",
        "You also ship loop packs producer-to-producer",
        "You don't need marketing automation drip sequences",
      ],
    },
    competitor: {
      pickWhen: "When to pick Soundee",
      bullets: [
        "You sell beats at volume and want smart-link analytics per beat",
        "You want native marketing automation (drip emails, abandoned cart)",
        "You sell directly and want native Stripe + crypto checkout",
        "You're comfortable on a monthly subscription model",
      ],
    },
  },
  faq: [
    {
      question: "Is Soundee or Wavloops more affordable long-term?",
      answer:
        "Wavloops Lifetime $129 is a one-time payment. Soundee's Pro tier is roughly $9.99/mo, so ~$120/year. Break-even hits in year one; Wavloops is free forever after that. If you stay active 3+ years, Wavloops Lifetime is significantly cheaper.",
    },
    {
      question: "Does Wavloops do smart links like Soundee?",
      answer:
        "Wavloops uses server-based links instead of per-beat smart links. One link per project covers every beat you add to that server. If you need a unique URL per beat with per-beat conversion tracking, Soundee is built for that pattern.",
    },
    {
      question: "Which platform has stronger lead-capture features?",
      answer:
        "Wavloops. Public servers gate access behind email + social — every listener becomes a lead in your contacts page automatically. Soundee focuses on selling, not list building.",
    },
    {
      question: "Can I run Wavloops alongside Soundee?",
      answer:
        "Yes — many producers do. Soundee for transactional smart-link selling, Wavloops for the private artist relationships you ship beat packs to. The two cover different parts of the workflow.",
    },
  ],
};

export default soundee;
