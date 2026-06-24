/**
 * Sitemap.xml — exposed at /sitemap.xml at build time. Lists every
 * public route so Google + Bing know what exists. Private routes
 * (admin, dashboard, listen, s/, i/, etc.) are explicitly excluded
 * here AND blocked in robots.ts.
 *
 * The sitemap auto-includes every blog post + comparison page from
 * their respective content registries — adding a new MDX post or
 * comparison TS file makes it appear here without code changes.
 *
 * `lastModified` is set to publishedAt for blog posts and build
 * time for everything else (no per-page versioning yet).
 *
 * `changeFrequency` + `priority` are advisory — Google has
 * publicly said it ignores priority and only loosely uses
 * changeFrequency. Kept for completeness + because Bing still
 * respects them.
 */

import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/content/blog";
import { COMPARISONS } from "@/content/comparisons";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://wavloops.co";

// Build-time stamp — reused for routes that don't carry their own
// publishedAt metadata.
const BUILT_AT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  // Static, marketing-surface routes — the ones we ship and own
  // editorially. Hub pages get a slightly higher priority than the
  // leaves they aggregate so Google reads them as canonical entries.
  const staticRoutes: MetadataRoute.Sitemap = [
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
      url: `${SITE_URL}/blog`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 0.8,
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

  // Blog posts — lastModified pulled from each post's frontmatter.
  // Stable across builds so Google doesn't refresh the index just
  // because we redeployed.
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${SITE_URL}/blog/${p.meta.slug}`,
    lastModified: new Date(p.meta.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Comparison pages — lastModified is build time (no per-comparison
  // timestamp on the data object yet). Reasonable since these pages
  // get refreshed whenever Wavloops's feature matrix changes, which
  // is shipped via deploys anyway.
  const compareRoutes: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    lastModified: BUILT_AT,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes, ...compareRoutes];
}
