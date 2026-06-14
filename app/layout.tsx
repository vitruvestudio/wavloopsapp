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

export const metadata: Metadata = {
  title: "Wavloops — Your beats, a living link.",
  description:
    "Drop beats into shareable servers. Send one link — capture every contact and see who listens, in real time. Lifetime $129 · Founding access.",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
