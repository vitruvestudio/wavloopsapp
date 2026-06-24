/**
 * /compare/<slug> — dynamic comparison page.
 *
 * Reads the Comparison data object from the registry and hands it
 * to the shared ComparisonLayout. dynamicParams = false ensures
 * unknown slugs hard-404.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComparisonLayout } from "@/components/compare/ComparisonLayout";
import { COMPARISONS, getComparison } from "@/content/comparisons";
import { createClient } from "@/lib/supabase/server";

interface ComparePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: ComparePageProps): Promise<Metadata> {
  const { slug } = await params;
  const comp = getComparison(slug);
  if (!comp) return { title: "Comparison not found — Wavloops" };
  return {
    title: comp.seoTitle ?? `Wavloops vs ${comp.competitorName} — Wavloops`,
    description: comp.seoDescription,
    alternates: { canonical: `/compare/${comp.slug}` },
    openGraph: {
      title: comp.seoTitle ?? `Wavloops vs ${comp.competitorName}`,
      description: comp.seoDescription,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: comp.seoTitle ?? `Wavloops vs ${comp.competitorName}`,
      description: comp.seoDescription,
    },
  };
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { slug } = await params;
  const comp = getComparison(slug);
  if (!comp) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  return <ComparisonLayout comparison={comp} isAuthed={isAuthed} />;
}
