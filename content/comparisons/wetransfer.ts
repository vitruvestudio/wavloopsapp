/**
 * Wavloops vs WeTransfer — the "why every producer's stack
 * eventually breaks" page. WeTransfer is the default beat-sending
 * tool of last resort for producers. Wavloops attacks it on
 * persistence (links don't die), purpose (built for audio), and
 * intelligence (you see who listened).
 */

import type { Comparison } from "./types";

const wetransfer: Comparison = {
  slug: "wetransfer",
  competitorName: "WeTransfer",
  seoTitle: "Wavloops vs WeTransfer (2026) — beat sharing for producers",
  seoDescription:
    "WeTransfer vs Wavloops for music producers in 2026. Living links that don't expire, per-artist play tracking, and why dropping a beat pack on WeTransfer is leaking placements.",
  intro:
    "WeTransfer is great for one-off file transfers. It was never built to ship music to artists you want to track. Wavloops is the purpose-built upgrade.",
  verdictHeadline: "At a glance",
  verdict:
    "WeTransfer is generic file sharing — it's friction-free, but the link expires in 7 days, you have no idea if the artist opened it, and the same address gets nothing if you drop another pack next month. Wavloops gives you a living link per project that stays alive forever, tracks every play / like per artist, and turns the share page into a CRM. Pick WeTransfer for one-off transfers to a single label. Pick Wavloops the moment you ship beats to the same audience more than once.",
  features: [
    {
      feature: "Link doesn't expire",
      wavloops: true,
      competitor: false,
      note: "WeTransfer free expires in 7 days; Pro is 12 months max.",
    },
    {
      feature: "One living link that updates as you add beats",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Per-artist play tracking",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Like / pass signal",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Music-aware player (waveform, BPM/key, loudness)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Auto BPM / key / loudness detection on upload",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Built-in producer CRM (artist contacts + notes)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Public gate page (email + social lead capture)",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Generic large-file transfer (any file type)",
      wavloops: false,
      competitor: true,
    },
    {
      feature: "Lifetime plan",
      wavloops: true,
      competitor: false,
    },
    {
      feature: "Brand recognition (artists trust the link)",
      wavloops: "Growing",
      competitor: true,
    },
  ],
  pricing: {
    wavloops: [
      { name: "Free", price: "$0", notes: "1 server, full analytics, no card" },
      { name: "Lifetime", price: "$129 once", notes: "3 servers, forever" },
      { name: "Pro", price: "from $12/mo", notes: "Unlimited servers + beats" },
    ],
    competitor: [
      { name: "Free", price: "$0", notes: "2 GB per transfer, expires 7 days" },
      { name: "Pro", price: "~$12/mo", notes: "Bigger transfers, 12-month link" },
      { name: "Premium", price: "~$23/mo", notes: "Unlimited transfers" },
    ],
  },
  useCases: {
    wavloops: {
      pickWhen: "When to pick Wavloops",
      bullets: [
        "You ship beats to the same artists / labels more than once",
        "You want to see WHO actually listened (not guess)",
        "You're tired of re-sending packs when the WeTransfer link expires",
        "You want a music-aware player (waveform, BPM, loudness) not a download dialog",
        "You'd rather build a contact list than send to the void",
      ],
    },
    competitor: {
      pickWhen: "When to pick WeTransfer",
      bullets: [
        "You're sending a single one-off transfer to a label or studio",
        "You're transferring non-audio files (project sessions, stems, video)",
        "The recipient just needs to download once and the relationship ends there",
      ],
    },
  },
  faq: [
    {
      question: "Why do WeTransfer links expire?",
      answer:
        "WeTransfer's free tier deletes uploads after 7 days to keep storage costs down; Pro extends to 12 months max. There's no way to keep a free link alive long term. Wavloops servers never expire — your share link stays alive as long as your account exists.",
    },
    {
      question: "Can I see if an artist opened my WeTransfer pack?",
      answer:
        "Not really. WeTransfer Pro offers basic download notifications. Wavloops shows you per-artist plays in real time — who pressed play, on which beat, how many times, and what they liked.",
    },
    {
      question: "Is Wavloops as easy to use as WeTransfer?",
      answer:
        "Drag-drop upload is the same. The added step is creating a server (30 seconds, one-time), then sharing the server link. Every subsequent drop is one click — and the same link keeps working forever.",
    },
    {
      question: "Should I keep WeTransfer for non-beat transfers?",
      answer:
        "Yes. WeTransfer is fine for stems, project sessions, video, anything where you don't need analytics or a relationship. Wavloops is for the part of your workflow where you're shipping music to an audience you want to track and grow.",
    },
  ],
};

export default wetransfer;
