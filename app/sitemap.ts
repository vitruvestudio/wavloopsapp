/**
 * Sitemap.xml — exposed at /sitemap.xml at build time. Lists every
 * public route so Google + Bing know what exists. Private routes
 * (admin, dashboard, listen, s/, i/, etc.) are explicitly excluded
 * here AND blocked in robots.ts.
 *
 * `lastModified` is set to build time for every entry — fine for
 * v1, since none of the public pages change per-day. If we later
 * ship a blog with timestamped posts, those should pass their own
 * publishedAt as lastModified.
 *
 * `changeFrequency` + `priority` are advisory — Google has
 * publicly said it ignores priority and only loosely uses
 * changeFrequency. Kept for completeness + because Bing still
 * respects them.
 */

import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://wavloops.co";

// Build-time stamp — same value across the whole sitemap. Acceptable
// for v1 since pages aren't versioned independently yet.
const BUILT_AT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/auth`,
      lastModified: BUILT_AT,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/legal/terms`,
      lastModified: BUILT_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/privacy`,
      lastModified: BUILT_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/refunds`,
      lastModified: BUILT_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/cookies`,
      lastModified: BUILT_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/legal-notice`,
      lastModified: BUILT_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
