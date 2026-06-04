import "server-only";

import { getResend } from "./client";

type OnboardingPayload = {
  producerName: string;
  email: string;
  workUrl: string;
  growGoals: string[];
  interestLevel: string;
};

const SITE_URL = "https://wavloops.app";

const INTEREST_LABELS: Record<string, string> = {
  "early-access": "Wants early access",
  "test-real-kit": "Wants to test with a real free kit",
  curious: "Just curious for now",
};

/* ---------- Shared HTML helpers ---------- */

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:48px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#111111;border:1px solid #333333;border-radius:6px;">
        <tr><td style="padding:20px 32px;border-bottom:1px solid #262626;">
          <div style="color:#FAFAFA;font-weight:800;text-transform:uppercase;font-size:18px;letter-spacing:-0.04em;line-height:1;">
            <span style="display:inline-block;width:10px;height:10px;background:#2B25FF;vertical-align:middle;margin-right:8px;border-radius:1px;"></span>Wavloops
          </div>
        </td></tr>
        ${body}
        <tr><td style="padding:20px 32px;border-top:1px solid #262626;">
          <p style="margin:0;color:#5C5C5C;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;line-height:1.6;">
            Wavloops · Drop a beat. We build the rest.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- User confirmation email ---------- */

function userEmailContent(producerName: string) {
  const subject = "Your founding spot is reserved — Wavloops";

  const html = emailShell(
    subject,
    `
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 16px;color:#FAFAFA;font-size:24px;font-weight:600;line-height:1.2;">
        Your founding spot is reserved.
      </h1>
      <p style="margin:0 0 16px;color:#9A9A9A;font-size:14px;line-height:1.6;">
        Hey ${escapeHtml(producerName)},
      </p>
      <p style="margin:0 0 24px;color:#9A9A9A;font-size:14px;line-height:1.6;">
        Your application is in. We&rsquo;re reviewing the first 20 founding producer spots before the private launch.
      </p>
      <p style="margin:0 0 12px;color:#5C5C5C;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;">
        If selected, you get
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr><td style="padding:4px 0;color:#FAFAFA;font-size:14px;line-height:1.6;">
          <span style="display:inline-block;width:2px;height:12px;background:#2B25FF;vertical-align:middle;margin-right:12px;"></span>
          Early access before public launch
        </td></tr>
        <tr><td style="padding:4px 0;color:#FAFAFA;font-size:14px;line-height:1.6;">
          <span style="display:inline-block;width:2px;height:12px;background:#2B25FF;vertical-align:middle;margin-right:12px;"></span>
          Early-access price locked for life
        </td></tr>
        <tr><td style="padding:4px 0;color:#FAFAFA;font-size:14px;line-height:1.6;">
          <span style="display:inline-block;width:2px;height:12px;background:#2B25FF;vertical-align:middle;margin-right:12px;"></span>
          Help connecting your YouTube channel and your first drop
        </td></tr>
        <tr><td style="padding:4px 0;color:#FAFAFA;font-size:14px;line-height:1.6;">
          <span style="display:inline-block;width:2px;height:12px;background:#2B25FF;vertical-align:middle;margin-right:12px;"></span>
          Priority influence on the roadmap
        </td></tr>
      </table>
      <p style="margin:0 0 24px;color:#9A9A9A;font-size:14px;line-height:1.6;">
        We&rsquo;ll reach out within <strong style="color:#FAFAFA;">48 hours</strong> with next steps.
      </p>
      <p style="margin:0;color:#9A9A9A;font-size:14px;line-height:1.6;">
        &mdash; The Wavloops team
      </p>
    </td></tr>
  `,
  );

  const text = `Your founding spot is reserved — Wavloops

Hey ${producerName},

Your application is in. We're reviewing the first 20 founding producer spots before the private launch.

If selected, you get:
- Early access before public launch
- Early-access price locked for life
- Help connecting your YouTube channel and your first drop
- Priority influence on the roadmap

We'll reach out within 48 hours with next steps.

— The Wavloops team`;

  return { subject, html, text };
}

/* ---------- Admin notification email ---------- */

function adminEmailContent(payload: OnboardingPayload) {
  const subject = `[Wavloops] New application — ${payload.producerName}`;
  const interestLabel =
    INTEREST_LABELS[payload.interestLevel] ?? payload.interestLevel;

  const html = emailShell(
    subject,
    `
    <tr><td style="padding:32px;">
      <p style="margin:0 0 4px;color:#2B25FF;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;font-weight:600;">
        New onboarding submission
      </p>
      <h1 style="margin:0 0 24px;color:#FAFAFA;font-size:22px;font-weight:600;line-height:1.2;">
        ${escapeHtml(payload.producerName)}
      </h1>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${row("Email", `<a href="mailto:${escapeHtml(payload.email)}" style="color:#FAFAFA;text-decoration:none;">${escapeHtml(payload.email)}</a>`)}
        ${row("Work URL", `<a href="${escapeHtml(payload.workUrl)}" style="color:#FAFAFA;text-decoration:none;">${escapeHtml(payload.workUrl)}</a>`)}
        ${row("Interest", escapeHtml(interestLabel))}
        ${row("Pain points", payload.growGoals.length > 0 ? escapeHtml(payload.growGoals.join(" · ")) : "<span style=\"color:#5C5C5C;\">none selected</span>")}
      </table>
      <p style="margin:24px 0 0;color:#5C5C5C;font-size:11px;line-height:1.6;">
        Review and update status in Supabase &rarr; <a href="https://supabase.com/dashboard/project/_/editor" style="color:#2B25FF;text-decoration:none;">onboarding_early</a> table.
      </p>
    </td></tr>
  `,
  );

  const text = `[Wavloops] New application — ${payload.producerName}

Producer: ${payload.producerName}
Email: ${payload.email}
Work URL: ${payload.workUrl}
Interest: ${interestLabel}
Pain points: ${payload.growGoals.join(", ") || "none selected"}

Review in Supabase → onboarding_early table.`;

  return { subject, html, text };
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #262626;width:110px;color:#5C5C5C;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #262626;color:#FAFAFA;font-size:14px;line-height:1.5;">${value}</td>
  </tr>`;
}

/* ---------- Orchestrator ---------- */

export async function sendOnboardingEmails(
  payload: OnboardingPayload,
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const from = process.env.RESEND_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!from) {
    console.warn("[resend] RESEND_FROM_EMAIL not set — skipping emails.");
    return;
  }

  const userMsg = userEmailContent(payload.producerName);
  const adminMsg = adminEmailContent(payload);

  const tasks: Promise<unknown>[] = [
    resend.emails.send({
      from,
      to: [payload.email],
      subject: userMsg.subject,
      html: userMsg.html,
      text: userMsg.text,
      replyTo: adminEmail || undefined,
    }),
  ];

  if (adminEmail) {
    tasks.push(
      resend.emails.send({
        from,
        to: [adminEmail],
        subject: adminMsg.subject,
        html: adminMsg.html,
        text: adminMsg.text,
        replyTo: payload.email,
      }),
    );
  } else {
    console.warn("[resend] ADMIN_EMAIL not set — skipping admin notification.");
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[resend] email ${i} failed:`, r.reason);
    }
  });
}

export { SITE_URL };
