/**
 * Transactional emails sent via Resend.
 *
 * All senders are best-effort: a missing RESEND_API_KEY or a
 * transient Resend failure logs a warning but does NOT throw —
 * the calling action (claim, approve, …) succeeds either way; the
 * email is a "would be nice" layer on top of the DB notification.
 *
 * Sender identity is fixed: `Wavloops <noreply@wavloops.co>`.
 * The domain is verified in the Resend workspace.
 *
 * Brand
 * ─────
 * Light card on `#f5f5f7` page bg, Unbounded display titles,
 * Hanken Grotesk body, JetBrains Mono caps for meta + footer.
 * Mirrors the Supabase Auth Magic Link template at
 * `supabase/email-templates/magic-link.html` so an artist who
 * gets one transactional email and one auth email in a row sees
 * the same product.
 *
 * Every sender pipes user-controlled fields through `escape()` so
 * the templates are safe to interpolate raw HTML around.
 */

import "server-only";

import { getResend } from "./client";

const FROM = "Wavloops <noreply@wavloops.co>";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

interface SendResult {
  ok: boolean;
  error?: string;
}

async function send(payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend client not configured" };
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    if (error) {
      console.warn("[emails] Resend returned error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[emails] send threw", msg);
    return { ok: false, error: msg };
  }
}

/* ============================================================
   Brand shell — shared wrapper for every transactional template.
   ============================================================ */

interface ShellOptions {
  /** Pre-header text (shown in inbox preview, after subject).
   *  Hidden in the rendered email. */
  preheader: string;
  /** Optional mono-caps line above the title (e.g.
   *  "4 BEATS · BY @YUKISOUND"). Pass null to omit. */
  meta: string | null;
  /** Big Unbounded display heading. */
  title: string;
  /** Body HTML — paragraphs rendered after the title. Already
   *  escaped where it interpolates user-controlled fields. */
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Mono-caps footer line. Escape user-controlled portions
   *  before passing in. */
  footer: string;
  /** Optional secondary line under the CTA, mono-caps style
   *  (e.g. "OR PASTE THIS LINK · WAVLOOPS.IO/S/SLUG"). */
  secondary?: string | null;
}

function brandShell(opts: ShellOptions): string {
  const metaBlock = opts.meta
    ? `<div style="margin:0 0 12px;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8e8e98;">${opts.meta}</div>`
    : "";
  const secondaryBlock = opts.secondary
    ? `<tr><td style="padding:24px 32px 0;"><div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8e8e98;line-height:1.7;word-break:break-all;">${opts.secondary}</div></td></tr>`
    : "";
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wavloops</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;">
<!-- Preheader (preview text — hidden in body) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${opts.preheader}</div>

<div style="background:#f5f5f7;padding:40px 16px;font-family:'Hanken Grotesk','Inter',system-ui,-apple-system,'Segoe UI',sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="560" style="max-width:560px;width:100%;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #ececef;overflow:hidden;">

    <!-- Logo header — uses the verified Wavloops wordmark from
            /public/Photos. URL-encoded because the filename
            contains spaces. Alt text doubles as the fallback for
            inboxes that block remote images by default. -->
    <tr>
      <td style="padding:28px 32px 0;">
        <a href="${siteUrl()}" style="text-decoration:none;border:none;">
          <img src="${siteUrl()}/Photos/Logo%20Wavloop.co%20-%201.png" alt="Wavloops" width="160" style="display:block;border:0;height:auto;max-width:160px;">
        </a>
      </td>
    </tr>

    <!-- Hero -->
    <tr>
      <td style="padding:32px 32px 8px;">
        ${metaBlock}
        <h1 style="margin:0 0 14px;color:#0c0c0e;font-family:'Unbounded','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;">
          ${opts.title}
        </h1>
        <div style="color:#5e5e6a;font-size:15px;line-height:1.55;">
          ${opts.bodyHtml}
        </div>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:24px 32px 8px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="border-radius:12px;background:#2b25ff;">
              <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 26px;color:#ffffff;font-family:'Hanken Grotesk','Inter',sans-serif;font-size:15px;font-weight:600;text-decoration:none;">
                ${opts.ctaLabel} &nbsp;&rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${secondaryBlock}

    <!-- Footer -->
    <tr>
      <td style="padding:28px 32px 24px;background:#fafafb;border-top:1px solid #ececef;margin-top:24px;">
        <p style="margin:0;color:#8e8e98;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.7;">
          ${opts.footer}
        </p>
      </td>
    </tr>

  </table>
</div>
</body>
</html>`;
}

/** Compose the short host-only URL line shown under the CTA
 *  (mono caps style "OR PASTE THIS LINK · WAVLOOPS.IO/S/SLUG").
 *  Uses the configured site origin so prod vs. dev are honest. */
function pasteLine(targetUrl: string): string {
  const display = targetUrl
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  return `Or paste this link &middot; <a href="${targetUrl}" style="color:#2b25ff;text-decoration:none;">${escape(display)}</a>`;
}

/* ============================================================
   sendAccessRequestEmail — producer gets pinged when an artist
   requests access to a private server.
   ============================================================ */

export interface AccessRequestEmailPayload {
  producerEmail: string;
  producerHandle: string;
  artistEmail: string;
  /** Social handle the artist entered on the gate form. Empty
   *  string when not provided. */
  artistSocial: string;
  serverName: string;
  serverSlug: string;
}

export async function sendAccessRequestEmail(
  p: AccessRequestEmailPayload,
): Promise<SendResult> {
  const url = `${siteUrl()}/servers/${p.serverSlug}?tab=requests`;
  const socialLine = p.artistSocial
    ? `<div style="margin:6px 0 0;color:#8e8e98;font-size:14px;">${escape(p.artistSocial)}</div>`
    : "";
  const html = brandShell({
    preheader: `${p.artistEmail} requested access to ${p.serverName}.`,
    meta: `NEW REQUEST &middot; ${escape(p.serverName)}`,
    title: `${escape(p.artistEmail)} wants access.`,
    bodyHtml: `
      <p style="margin:0 0 18px;">
        Someone just hit the gate on <strong style="color:#0c0c0e;">${escape(p.serverName)}</strong>. Approve or decline from the Requests tab on your server page.
      </p>
      <div style="padding:14px 18px;border-radius:12px;background:#f5f5f7;margin-bottom:8px;">
        <div style="font-weight:600;color:#0c0c0e;font-size:15px;">${escape(p.artistEmail)}</div>
        ${socialLine}
      </div>
    `,
    ctaLabel: "Review request",
    ctaUrl: url,
    footer: `Sent because someone requested access to ${escape(p.serverName)} on Wavloops`,
  });
  return send({
    to: p.producerEmail,
    subject: `[Wavloops] ${p.artistEmail} requested access to ${p.serverName}`,
    html,
  });
}

/* ============================================================
   sendBeatsUploadedEmail — artist digest of new beats the producer
   dropped in a server they're in. Batched by the cron.
   ============================================================ */

export interface BeatsUploadedEmailPayload {
  artistEmail: string;
  producerHandle: string;
  serverName: string;
  serverSlug: string;
  beatTitles: string[];
}

export async function sendBeatsUploadedEmail(
  p: BeatsUploadedEmailPayload,
): Promise<SendResult> {
  const url = `${siteUrl()}/listen/${p.serverSlug}`;
  const count = p.beatTitles.length;
  const headline =
    count === 1
      ? `1 new beat in ${p.serverName}.`
      : `${count} new beats in ${p.serverName}.`;
  const list = p.beatTitles
    .slice(0, 10)
    .map(
      (t) =>
        `<li style="margin:6px 0;font-size:14.5px;color:#0c0c0e;">${escape(t)}</li>`,
    )
    .join("");
  const more =
    count > 10
      ? `<div style="margin:8px 0 0;color:#8e8e98;font-size:13px;">+${count - 10} more…</div>`
      : "";
  const html = brandShell({
    preheader: `${p.producerHandle} just dropped ${count} beat${count === 1 ? "" : "s"} in ${p.serverName}.`,
    meta: `${count} NEW &middot; BY ${escape(p.producerHandle).toUpperCase()}`,
    title: headline,
    bodyHtml: `
      <p style="margin:0 0 18px;">
        <strong style="color:#0c0c0e;">${escape(p.producerHandle)}</strong> just dropped fresh material in <strong style="color:#0c0c0e;">${escape(p.serverName)}</strong>.
      </p>
      <div style="padding:14px 20px;border-radius:12px;background:#f5f5f7;margin-bottom:8px;">
        <ul style="margin:0;padding-left:18px;list-style:disc;">${list}</ul>
        ${more}
      </div>
    `,
    ctaLabel: "Listen now",
    ctaUrl: url,
    secondary: pasteLine(url),
    footer: `Sent because ${escape(p.producerHandle)} added you to ${escape(p.serverName)} on Wavloops`,
  });
  return send({
    to: p.artistEmail,
    subject: `[Wavloops] ${headline}`,
    html,
  });
}

/* ============================================================
   sendAddedToServerEmail — artist notified when producer adds
   them manually via AddArtistsModal.
   ============================================================ */

export interface AddedToServerEmailPayload {
  artistEmail: string;
  producerHandle: string;
  serverName: string;
  serverSlug: string;
}

export async function sendAddedToServerEmail(
  p: AddedToServerEmailPayload,
): Promise<SendResult> {
  // /s/<slug> works for authed (auto-redirect to /listen) and
  // unauthed (magic-link flow) — keeps a single entry URL.
  const url = `${siteUrl()}/s/${p.serverSlug}`;
  const html = brandShell({
    preheader: `${p.producerHandle} added you to ${p.serverName}.`,
    meta: `INVITE &middot; BY ${escape(p.producerHandle).toUpperCase()}`,
    title: `${escape(p.producerHandle)} added you to "${escape(p.serverName)}".`,
    bodyHtml: `
      <p style="margin:0;">
        You now have access to <strong style="color:#0c0c0e;">${escape(p.producerHandle)}</strong>'s beats. Join the server to listen, like your favorites and get every new drop — no password, just one tap.
      </p>
    `,
    ctaLabel: "Join the server",
    ctaUrl: url,
    secondary: pasteLine(url),
    footer: `Sent because ${escape(p.producerHandle)} added you on Wavloops`,
  });
  return send({
    to: p.artistEmail,
    subject: `[Wavloops] ${p.producerHandle} added you to ${p.serverName}`,
    html,
  });
}

/* ============================================================
   sendAccessGrantedEmail — artist notified when producer approves
   their pending access request.
   ============================================================ */

export interface AccessGrantedEmailPayload {
  artistEmail: string;
  producerHandle: string;
  serverName: string;
  serverSlug: string;
}

export async function sendAccessGrantedEmail(
  p: AccessGrantedEmailPayload,
): Promise<SendResult> {
  const url = `${siteUrl()}/listen/${p.serverSlug}`;
  const html = brandShell({
    preheader: `${p.producerHandle} approved your access to ${p.serverName}.`,
    meta: `APPROVED &middot; ${escape(p.serverName).toUpperCase()}`,
    title: `You're in.`,
    bodyHtml: `
      <p style="margin:0;">
        <strong style="color:#0c0c0e;">${escape(p.producerHandle)}</strong> approved your access to <strong style="color:#0c0c0e;">${escape(p.serverName)}</strong>. Like beats, leave notes, or share feedback — every reaction goes back to ${escape(p.producerHandle)}.
      </p>
    `,
    ctaLabel: "Open the server",
    ctaUrl: url,
    secondary: pasteLine(url),
    footer: `Sent because you requested access to ${escape(p.serverName)} on Wavloops`,
  });
  return send({
    to: p.artistEmail,
    subject: `[Wavloops] ${p.producerHandle} approved your access to ${p.serverName}`,
    html,
  });
}

/** Minimal HTML escape so user-controlled fields (email, handle,
 *  server name, beat titles) can't break out of the template. */
function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
