/**
 * /blog/<slug> — dynamic blog post route.
 *
 * Pulls the entry from the BLOG_POSTS registry (slug-keyed), lazy-
 * imports the matching MDX module, and renders the body inside
 * the shared BlogPostLayout.
 *
 * generateStaticParams returns every known slug so the build
 * prerenders the lot. `dynamicParams = false` means slugs that
 * aren't in the registry hard-404 instead of trying to stream.
 *
 * generateMetadata reuses the same registry to emit a per-post
 * title/description/OG image.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostLayout } from "@/components/blog/BlogPostLayout";
import { BLOG_POSTS, getBlogPost } from "@/content/blog";
import { createClient } from "@/lib/supabase/server";

interface BlogPostRouteProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.meta.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getBlogPost(slug);
  if (!entry) {
    return { title: "Article not found — Wavloops" };
  }
  return {
    title: `${entry.meta.title} — Wavloops Blog`,
    description: entry.meta.description,
    alternates: { canonical: `/blog/${entry.meta.slug}` },
    openGraph: {
      title: entry.meta.title,
      description: entry.meta.description,
      type: "article",
      publishedTime: entry.meta.publishedAt,
      authors: [entry.meta.author ?? "Théo Gherbi (40mins)"],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.meta.title,
      description: entry.meta.description,
    },
  };
}

export default async function BlogPostRoute({ params }: BlogPostRouteProps) {
  const { slug } = await params;
  const entry = getBlogPost(slug);
  if (!entry) notFound();

  const { default: PostBody } = await entry.load();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  return (
    <BlogPostLayout meta={entry.meta} isAuthed={isAuthed}>
      <PostBody />
    </BlogPostLayout>
  );
}
