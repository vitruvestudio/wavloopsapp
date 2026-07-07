/**
 * Wavloops V3 — root layout.
 *
 * - Loads brand fonts via next/font (zero-CLS, self-hosted):
 *     Unbounded   → --font-display (titles)
 *     Hanken      → --font-body    (UI + body)
 *     JetBrains   → --font-mono    (metadata, ALWAYS UPPERCASE)
 * - Defaults the document to `data-theme="dark"` — dark is the canonical
 *   surface, light is opt-in via the theme toggle (persisted in localStorage).
 */

import type { Metadata } from "next";
import { Unbounded, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { PostHogUserIdentifier } from "@/components/analytics/PostHogUserIdentifier";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** Canonical origin every URL in metadata + Open Graph + sitemap
 *  resolves against. Set NEXT_PUBLIC_SITE_URL on Vercel for prod
 *  (https://wavloops.co); falls back to localhost in dev. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wavloops — Your beats, a living link.",
    template: "%s — Wavloops",
  },
  description:
    "Stop sending beats. Start sharing one link. Drop beats into private servers, invite artists, labels and A&Rs, and see who plays what — in real time. Lifetime $129 · Founding access.",
  keywords: [
    "share beats with artists",
    "send beats online",
    "private beat sharing platform",
    "wetransfer alternative for producers",
    "beat sharing for music producers",
    "track who listens to my beats",
    "beat server",
    "beat catalog",
    "Wavloops",
  ],
  authors: [{ name: "Vitruve Studio", url: "https://vitruve.studio" }],
  creator: "Vitruve Studio",
  publisher: "Vitruve Studio",
  category: "Music",
  applicationName: "Wavloops",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Wavloops",
    title: "Wavloops — Your beats, a living link.",
    description:
      "Drop beats into private servers, share one link with the artists, labels and A&Rs you choose, and see who plays what in real time.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wavloops",
    creator: "@wavloops",
    title: "Wavloops — Your beats, a living link.",
    description:
      "Drop beats into private servers, share one link, see who plays what — in real time.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // Google Search Console URL-prefix verification for
    // https://wavloops.co. Renders as
    //   <meta name="google-site-verification" content="..." />
    // inside <head> at build time. Don't rotate this value
    // unless you also re-verify in GSC.
    google: "i0wy0QSchFxUh5anFEi8-umnUI371W426aNWIxzUY2k",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${unbounded.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      <body className="bg-bg-0 text-fg-1">
        <PostHogProvider>
          <PostHogUserIdentifier />
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
