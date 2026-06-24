/**
 * Wavloops vs Beatstars — head-to-head against the 800-lb gorilla
 * of beat distribution. Beatstars is a marketplace + Pro Page combo
 * with a massive built-in audience. Wavloops is a private platform
 * with a producer-bring-your-own-audience model and no marketplace
 * take rate. Both are legitimate — the page is honest about WHEN
 * Beatstars beats us (mass-leasing to strangers).
 */

import type { Comparison } from "./types";

const beatstars: Comparison = {
  slug: "beatstars",
  competitorName: "Beatstars",
  seoTitle: "Wavloops vs Beatstars (2026) — private platform vs marketplace",
  seoDescription:
    "Side-by-side comparison of Wavloops and Beatstars for music producers in 2026. Private living link vs public marketplace, pricing, fees, and when to pick each.",
  intro:
    "Beatstars is a marketplace. Wavloops is the private platform you ship to the artists you already know. Same producer pain, two different bets.",
  verdictHeadline: "At a glance",
  verdict:
    "Beatstars wins on mass-leasing reach: the marketplace funnels stranger buyers your way, and the Pro Page storefront is mature. Wavloops wins on relationships: one living link per server, per-artist play tracking, public-server lead capture, no take-rate on sales, and a Lifetime plan that locks pricing forever. Pick Beatstars if you sell leases at scale through a storefront. Pick Wavloops if your business is the artists, labels and A&Rs you already know — and you want a private, evolving link to them.",
  features: [
    {
      feature: "Marketplace exposure (built-in audience)",
      wavloops: false,
      competitor: true,
      note: "Wavloops is private by design — you bring your own audience.",
    },
    {
      feature: "Private living link per server",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Lifetime plan",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Per-artist play tracking",
      wavloops: true,
      competitor: "Aggregate only",
    },
    {
      feature: "Like / pass signal per artist",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Public server gate (email + social lead capture)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Auto BPM / key / loudness detection on upload",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Built-in producer CRM (contacts + notes per artist)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Leasing infrastructure (contracts, distro, licensing)",
      wavloops: false,
      competitor: true,
    },
    {
      feature: "Marketplace take rate on sales",
      wavloops: "0%",
      competitor: "5%–10% on lease tier",
      note: "Wavloops doesn't broker sales — pricing stays simple.",
    },
    {
      feature: "Free tier",
      wavloops: "1 server, full analytics",
      competitor: "Limited uploads",
    },
    {
      feature: "Solo dev / indie ergonomics",
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
      { name: "Free", price: "$0", notes: "Limited uploads, marketplace fees" },
      { name: "Pro", price: "~$9.99/mo", notes: "Yearly billing, 0% on Pro Page sales" },
      { name: "Premium", price: "~$29.99/mo", notes: "Higher tier features" },
    ],
  },
  useCases: {
    wavloops: {
      pickWhen: "When to pick Wavloops",
      bullets: [
        "You already have a list of artists, labels and A&Rs you ship to",
        "You want one private link that evolves as you add beats",
        "You want to see WHICH artist played WHICH beat (not aggregate plays)",
        "You're done paying a take rate on every lease",
        "You'd rather buy Lifetime $129 once than $120/year forever",
        "You ship loop packs producer-to-producer (not just beats to artists)",
      ],
    },
    competitor: {
      pickWhen: "When to pick Beatstars",
      bullets: [
        "Your business is leasing beats to strangers at volume",
        "You want a public storefront with marketplace discovery",
        "You need a heritage leasing / contract / split sheet engine",
        "You want to ride the platform's built-in artist traffic",
      ],
    },
  },
  faq: [
    {
      question: "Is Wavloops a Beatstars replacement?",
      answer:
        "For private artist relationships and beat-pack outreach, yes. For mass-leasing to strangers through a marketplace, no — Wavloops doesn't aggregate buyer demand. Many serious producers run both: Beatstars for marketplace leases, Wavloops for the artists they already know.",
    },
    {
      question: "Is the Lifetime $129 plan really cheaper than Beatstars?",
      answer:
        "Beatstars Pro is roughly $9.99/mo billed annually, so ~$120/year. Wavloops Lifetime is $129 once — break-even hits in year one and it's free forever after that. If you'll stay an active producer for 3+ years, Wavloops Lifetime is dramatically cheaper.",
    },
    {
      question: "Does Wavloops handle leasing contracts and split sheets?",
      answer:
        "Not at this stage. Wavloops focuses on private delivery + tracking, not the legal layer of beat sales. If you need built-in lease contracts, Beatstars or Airbit cover that.",
    },
    {
      question: "Can I migrate my Beatstars catalog to Wavloops?",
      answer:
        "Yes — your audio is yours. Download your tracks from Beatstars, upload them to a Wavloops server, and share the new server link with your artist list. You don't have to leave Beatstars; many producers run both side by side.",
    },
  ],
};

export default beatstars;
