/**
 * Blog post registry.
 *
 * Each entry pairs the URL slug with eager metadata (used by the
 * /blog index page so it doesn't import every MDX module just to
 * render cards) and a lazy `load()` function that returns the
 * compiled MDX module on demand (used by /blog/[slug] to render
 * the body).
 *
 * Adding a post:
 *   1. Drop `content/blog/<slug>.mdx` with a default-exported MDX
 *      body and a top-level `export const meta = { ... }` block
 *      that matches the BlogPostMeta shape below.
 *   2. Append a new BlogPostEntry to BLOG_POSTS pointing at it.
 *
 * Why a manual registry (vs auto-glob)?
 *   - generateStaticParams + dynamic imports work cleanly with
 *     literal slugs and let the build prerender every post.
 *   - Editorial ordering / featured-first stays explicit.
 *   - We avoid filesystem reads at build time on Vercel.
 */

import type { ComponentType } from "react";

export interface BlogPostMeta {
  /** Final URL = /blog/<slug>. Lowercase + dash-separated. */
  slug: string;
  /** Title in the document <head> + page <h1>. */
  title: string;
  /** Hook line under the title + meta description fallback. */
  description: string;
  /** ISO date — YYYY-MM-DD. Used for sort + sitemap lastModified. */
  publishedAt: string;
  /** Optional human-friendly category, displayed as eyebrow text. */
  category?: string;
  /** Estimated read time ("8 min read"). */
  readTime?: string;
  /** Display author name. Defaults to "Théo Gherbi" if omitted. */
  author?: string;
  /** Hero image — falls back to the default opengraph-image route. */
  ogImage?: string;
  /** Tags surfaced under the title chip. */
  tags?: string[];
}

export interface BlogPostEntry {
  meta: BlogPostMeta;
  /** Lazy load of the MDX module so the index route doesn't bundle
   *  every post body. The default export is the compiled component. */
  load: () => Promise<{ default: ComponentType }>;
}

export const BLOG_POSTS: BlogPostEntry[] = [
  {
    meta: {
      slug: "private-beat-sharing-guide",
      title: "Private beat sharing — the producer's guide",
      description:
        "Why the WeTransfer-to-Gmail loop is broken for music producers in 2026, and how to ship beats to artists with one link that stays alive forever.",
      publishedAt: "2026-06-24",
      category: "Guides",
      readTime: "9 min read",
      tags: ["beat sharing", "producer workflow", "Wavloops"],
    },
    load: () => import("./private-beat-sharing-guide.mdx"),
  },
];

/** Convenience lookup used by /blog/[slug] route — narrows the
 *  registry to a single entry by slug or returns undefined when
 *  the slug doesn't exist (route then 404s). */
export function getBlogPost(slug: string): BlogPostEntry | undefined {
  return BLOG_POSTS.find((p) => p.meta.slug === slug);
}
