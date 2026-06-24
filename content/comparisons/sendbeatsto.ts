/**
 * Wavloops vs SendBeatsTo — the most important comparison page in
 * our SEO portfolio. SendBeatsTo currently owns the "send beats +
 * track listens" SERP across multiple high-intent queries; this
 * page is the head-to-head we need to win to claim that traffic.
 *
 * Verdict written in our voice — honest about where SendBeatsTo
 * wins, sharp about where Wavloops is structurally better.
 */

import type { Comparison } from "./types";

const sendbeatsto: Comparison = {
  slug: "sendbeatsto",
  competitorName: "SendBeatsTo",
  seoTitle: "Wavloops vs SendBeatsTo (2026) — private beat sharing compared",
  seoDescription:
    "Side-by-side comparison of Wavloops and SendBeatsTo for music producers in 2026. Living links vs single-share, analytics depth, pricing, and when to pick each.",
  intro:
    "Both deliver beats and track listens. The structural difference is what you're sharing — a living server link vs a single beat-pack drop.",
  verdictHeadline: "At a glance",
  verdict:
    "SendBeatsTo is the established option for single-shot beat-pack delivery with click tracking. Wavloops is built around one living server link per project that stays alive forever, adds beats automatically, and turns the gate page into a lead-capture funnel. Pick SendBeatsTo if you ship one pack per outreach. Pick Wavloops if the same audience receives multiple drops over time.",
  features: [
    {
      feature: "One living link per server",
      wavloops: true,
      competitor: false,
      note: "Wavloops link stays alive across uploads. SendBeatsTo is link-per-pack.",
    },
    {
      feature: "Per-artist play tracking",
      wavloops: true,
      competitor: true,
    },
    {
      feature: "Like / pass signal",
      wavloops: true,
      competitor: true,
    },
    {
      feature: "Auto BPM / key / loudness detection",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Public server gate (email + social lead capture)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Built-in artist CRM (contacts + notes)",
      wavloops: true,
      competitor: "Limited",
    },
    {
      feature: "Lifetime plan",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Free tier",
      wavloops: "1 server, full analytics",
      competitor: "Limited tracks",
    },
    {
      feature: "Producer-side dashboard with engagement signals",
      wavloops: true,
      competitor: true,
    },
    {
      feature: "Bulk artist add (CSV-ready)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Native loop pack distribution to producers",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Open-source / self-host fallback",
      wavloops: false,
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
      { name: "Free", price: "$0", notes: "Limited monthly tracks" },
      { name: "Paid", price: "~$10/mo", notes: "Pricing varies by plan" },
    ],
  },
  useCases: {
    wavloops: {
      pickWhen: "When to pick Wavloops",
      bullets: [
        "You share beats with the same artists / labels every month",
        "You want a living link that updates itself as you add beats",
        "You want a public server that captures leads (email + social)",
        "You value a one-time Lifetime payment over a monthly subscription",
        "You ship loop packs to other producers (not just beats to artists)",
      ],
    },
    competitor: {
      pickWhen: "When to pick SendBeatsTo",
      bullets: [
        "You ship a single beat pack per outreach and don't need ongoing updates",
        "You want a heritage SaaS that's been used in the producer community for years",
        "You prefer pure subscription pricing without lifetime offers",
      ],
    },
  },
  faq: [
    {
      question: "Is SendBeatsTo cheaper than Wavloops long term?",
      answer:
        "Wavloops Lifetime ($129 once) breaks even versus SendBeatsTo's ~$10/mo plan in ~13 months. After that, Wavloops costs nothing while a SendBeatsTo subscription continues. If you stay active 2+ years, Wavloops is significantly cheaper.",
    },
    {
      question: "Can I migrate from SendBeatsTo to Wavloops?",
      answer:
        "Yes — your audio files are yours. Export them from SendBeatsTo, upload to a new Wavloops server, and share the new server link with your artist list. Contacts can be imported via CSV.",
    },
    {
      question: "Do both platforms work with WAV files?",
      answer:
        "Both support WAV upload. Wavloops also auto-detects BPM, key and loudness on upload — SendBeatsTo expects you to tag these manually.",
    },
    {
      question: "Which one is better for lead capture?",
      answer:
        "Wavloops. The public server gate collects email + social before listen, building your contact list automatically. SendBeatsTo doesn't have a public-share lead capture flow.",
    },
  ],
};

export default sendbeatsto;
