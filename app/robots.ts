/**
 * Robots.txt — exposed at /robots.txt at build time.
 *
 * Public surfaces (allowed):
 *   /                        landing
 *   /pricing                 pricing anchor (no separate route yet, included for future)
 *   /auth                    sign-in
 *   /legal/*                 terms, privacy, refunds, cookies, legal notice
 *
 * Disallowed:
 *   /admin                   founder cockpit
 *   /api                     server actions + cron + download endpoints
 *   /dashboard, /library,
 *     /servers, /beats,
 *     /contacts, /settings,
 *     /onboarding            producer surfaces behind auth
 *   /listen                  artist surface behind auth
 *   /s, /i                   gate + invite click-through (token-bearing,
 *                            indexing them just creates dead noise)
 *
 * Bot-specific tweaks:
 *   - googleBot / Bingbot get the same allow/disallow ruleset as the
 *     default '*' agent; we don't differentiate. Adjust here if we
 *     ever want to throttle one specific bot.
 */

import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://wavloops.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/legal/", "/auth"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/library",
          "/library/",
          "/servers",
          "/servers/",
          "/beats",
          "/beats/",
          "/contacts",
          "/contacts/",
          "/settings",
          "/settings/",
          "/onboarding",
          "/onboarding/",
          "/listen",
          "/listen/",
          "/s/",
          "/i",
          "/i/",
          // Auth subroutes that bear tokens or transient state.
          "/auth/callback",
          "/auth/finish",
          "/auth/magic",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
