/**
 * GET /admin/email-previews/nurture/[step]
 *
 * Producer-only dev preview of the nurture sequence emails. Returns
 * the exact HTML that ships to Resend so you can eyeball any step
 * (1–4) at any time without bothering the cron, without writing
 * temp HTML files locally, and without sending a real test email.
 *
 * Same auth fence as the rest of /admin: requires a producer
 * profile in the session. RLS on the data isn't relevant here
 * because the emails are static templates — we just don't want
 * the route walked by anyone who lands on the URL by accident.
 *
 * Step is 1-indexed in the URL (matches the way we talk about
 * them) but 0-indexed in the underlying NURTURE_STEPS array.
 */

import { NextResponse } from "next/server";
import { getCurrentProducerProfileId } from "@/lib/supabase/current";
import {
  buildNurtureEmail,
  NURTURE_STEPS,
} from "@/lib/resend/emails";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ step: string }>;
}

const PREVIEW_CONTACT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(
  _req: Request,
  ctx: RouteContext,
): Promise<NextResponse> {
  // Producer-only — anyone landing on this URL without a producer
  // session gets a 404 rather than a peek at the template. We use
  // notFound semantics rather than 401 so the existence of the
  // route doesn't leak to enumeration.
  const profileId = await getCurrentProducerProfileId();
  if (!profileId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { step } = await ctx.params;
  const idx = parseInt(step, 10) - 1;
  if (
    Number.isNaN(idx) ||
    idx < 0 ||
    idx >= NURTURE_STEPS.length
  ) {
    return new NextResponse(
      `Invalid step. Use 1..${NURTURE_STEPS.length}.`,
      { status: 400 },
    );
  }

  const { subject, html } = buildNurtureEmail(idx, PREVIEW_CONTACT_ID);

  // Inject a tiny preview banner above the email so it's clear
  // this is a preview, not a captured live email. Producer sees
  // the subject + step + delay info without having to bounce to
  // the codebase.
  const delays = ["+15 minutes", "+2 days", "+5 days", "+10 days"];
  const banner = `
<div style="position:sticky;top:0;z-index:10;background:#0c0c0e;color:#ffffff;padding:14px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.5;border-bottom:1px solid #2b25ff;">
  <strong style="color:#9b8aff;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;">PREVIEW &middot; STEP ${idx + 1}/${NURTURE_STEPS.length} &middot; ${delays[idx] ?? ""}</strong>
  <div style="margin-top:4px;color:#ececef;">
    <span style="color:#8e8e98;">SUBJECT:</span> ${subject}
    <span style="color:#8e8e98;margin-left:14px;">FROM:</span> hello@wavloops.co
  </div>
  <div style="margin-top:6px;font-size:11px;color:#8e8e98;">
    Other steps:
    ${NURTURE_STEPS.map((_, i) =>
      i === idx
        ? `<span style="color:#9b8aff;font-weight:600;">[${i + 1}]</span>`
        : `<a href="/admin/email-previews/nurture/${i + 1}" style="color:#9b8aff;text-decoration:none;">[${i + 1}]</a>`,
    ).join(" &middot; ")}
  </div>
</div>
`;

  // Splice the banner right after <body>. The brandShell template
  // opens with `<body style="margin:0;...`, so we insert after the
  // first `>` that closes the body tag.
  const withBanner = html.replace(
    /(<body[^>]*>)/i,
    (m) => `${m}${banner}`,
  );

  return new NextResponse(withBanner, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Don't cache — the email copy may change between deploys
      // and the preview should always reflect HEAD.
      "cache-control": "no-store, max-age=0",
    },
  });
}
