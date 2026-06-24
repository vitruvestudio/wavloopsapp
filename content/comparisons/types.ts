/**
 * Shared type for every /compare/<slug> page.
 *
 * Comparison pages are STRUCTURED data, not free-form MDX — every
 * field maps to a known section of the ComparisonLayout. That lets
 * us:
 *   - Render a consistent, scannable visual across all comparisons
 *   - Lift the matrix into JSON-LD (Article + ComparisonChart
 *     schema) without parsing MDX
 *   - Cross-link comparison pages (the index page reads the same
 *     data to build the grid of all versus pages)
 *
 * Adding a new comparison:
 *   1. Drop a new TypeScript file under content/comparisons/.
 *   2. Default-export a Comparison object.
 *   3. Register the slug in content/comparisons/index.ts.
 */

export interface ComparisonPlan {
  /** Plan name shown in the pricing table. */
  name: string;
  /** Human-readable price (e.g. "Free", "$20/mo", "$129 once"). */
  price: string;
  /** Optional notes that explain caveats. */
  notes?: string;
}

export interface ComparisonFeatureRow {
  /** Feature label shown in the leftmost column. */
  feature: string;
  /** Wavloops's status: true = yes, false = no, string = qualified
   *  answer ("Auto-detected", "Limited", etc.). */
  wavloops: boolean | string;
  /** Competitor's status — same shape. */
  competitor: boolean | string;
  /** Optional 1-line caveat shown under the row. */
  note?: string;
}

export interface ComparisonUseCaseFit {
  /** Heading inside the "When to pick X" card. */
  pickWhen: string;
  /** Bullets under the heading. */
  bullets: string[];
}

export interface ComparisonFaq {
  question: string;
  answer: string;
}

export interface Comparison {
  /** URL slug — /compare/<slug>. */
  slug: string;
  /** Competitor display name shown in the hero and matrix. */
  competitorName: string;
  /** Optional URL of the competitor — only used in copy, never
   *  rendered as a backlink to avoid leaking SEO juice. */
  competitorUrl?: string;
  /** SEO title — falls back to "Wavloops vs <name>" if omitted. */
  seoTitle?: string;
  /** Meta description for the page head. */
  seoDescription: string;
  /** One-sentence pitch that sits under the H1. */
  intro: string;
  /** 2-3 sentence honest verdict that opens the page body. */
  verdict: string;
  /** Headline shown above the verdict block. */
  verdictHeadline?: string;
  /** Feature matrix — the heart of the comparison page. */
  features: ComparisonFeatureRow[];
  /** Side-by-side pricing summary. */
  pricing: {
    wavloops: ComparisonPlan[];
    competitor: ComparisonPlan[];
  };
  /** Two-column use case fit summary. */
  useCases: {
    wavloops: ComparisonUseCaseFit;
    competitor: ComparisonUseCaseFit;
  };
  /** Optional FAQ block — feeds the FAQPage JSON-LD. */
  faq?: ComparisonFaq[];
}
