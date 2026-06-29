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
/** Sender identity for the producer-nurture email sequence. Uses
 *  `hello@` instead of `noreply@` for two reasons: (1) Microsoft /
 *  Outlook explicitly de-prioritises noreply-style senders on cold
 *  domains, (2) the nurture sequence is conversational — replies
 *  to it would actually be valuable signal, so the address should
 *  be reply-friendly. */
const FROM_NURTURE = "40mins · Wavloops <hello@wavloops.co>";

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
  /** Optional sender override. Defaults to the transactional
   *  `noreply@` identity; the producer-nurture senders pass
   *  FROM_NURTURE instead so replies are routed somewhere
   *  reachable and Microsoft / Outlook stops penalising the
   *  noreply pattern. */
  from?: string;
  /** Optional reply-to. The nurture sequence sets this so an
   *  artist hitting "reply" lands on a real inbox 40mins reads
   *  rather than the wavloops.co catch-all. */
  replyTo?: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend client not configured" };
  }
  try {
    const { error } = await resend.emails.send({
      from: payload.from ?? FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
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
   sendArtistJoinedPublicEmail — producer gets pinged when an
   artist joins one of their PUBLIC servers (instant-grant flow).
   Counterpart to sendAccessRequestEmail, which only covers the
   private-server pending-request case. Public servers grant on
   submit, so the framing is celebratory ("they're already in")
   rather than action-required ("review request").
   ============================================================ */

export interface ArtistJoinedPublicEmailPayload {
  producerEmail: string;
  producerHandle: string;
  artistEmail: string;
  /** Social handle the artist optionally entered on the gate. */
  artistSocial: string;
  serverName: string;
  serverSlug: string;
}

export async function sendArtistJoinedPublicEmail(
  p: ArtistJoinedPublicEmailPayload,
): Promise<SendResult> {
  const url = `${siteUrl()}/servers/${p.serverSlug}?tab=artists`;
  const socialLine = p.artistSocial
    ? `<div style="margin:6px 0 0;color:#8e8e98;font-size:14px;">${escape(p.artistSocial)}</div>`
    : "";
  const html = brandShell({
    preheader: `${p.artistEmail} just joined ${p.serverName}.`,
    meta: `NEW JOIN &middot; ${escape(p.serverName)}`,
    title: "A new artist just joined.",
    bodyHtml: `
      <p style="margin:0 0 18px;">
        Someone just joined <strong style="color:#0c0c0e;">${escape(p.serverName)}</strong> through the public link. No action needed &mdash; they already have access and they're in your contacts.
      </p>
      <div style="padding:14px 18px;border-radius:12px;background:#f5f5f7;margin-bottom:14px;">
        <div style="font-weight:600;color:#0c0c0e;font-size:15px;">${escape(p.artistEmail)}</div>
        ${socialLine}
      </div>
      <p style="margin:0;color:#5e5e6a;">
        Open the server to see what they listen to, what they like, and what they download. The signals start landing the moment they hit play.
      </p>
    `,
    ctaLabel: "See the new artist",
    ctaUrl: url,
    footer: `Sent because someone joined ${escape(p.serverName)} on Wavloops`,
  });
  return send({
    to: p.producerEmail,
    subject: `[Wavloops] ${p.artistEmail} joined ${p.serverName}`,
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
  /** Public URL of the producer's avatar (from the `avatars`
   *  bucket, public-read). Null if the producer never uploaded
   *  one — we render an accent-coloured initial circle instead. */
  producerAvatarUrl: string | null;
  serverName: string;
  serverSlug: string;
  beats: Array<{
    title: string;
    /** Public URL of the beat artwork (from `beat-covers`).
     *  Null beats fall back to an accent square placeholder. */
    artworkUrl: string | null;
  }>;
}

export async function sendBeatsUploadedEmail(
  p: BeatsUploadedEmailPayload,
): Promise<SendResult> {
  const url = `${siteUrl()}/listen/${p.serverSlug}`;
  const count = p.beats.length;
  const headline =
    count === 1
      ? `1 new beat in ${p.serverName}.`
      : `${count} new beats in ${p.serverName}.`;

  const initial = (p.producerHandle.replace(/^@/, "")[0] ?? "?").toUpperCase();
  // Reusable square placeholder for missing artwork — accent block
  // with a centered initial. Keeps the visual rhythm of the list
  // even when some beats have no cover yet.
  const placeholderTile = (letter: string, size: number) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${size}" height="${size}" style="background:#2b25ff;border-radius:10px;">
      <tr><td align="center" valign="middle" style="color:#ffffff;font-family:'Unbounded','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:800;font-size:${Math.round(size * 0.45)}px;line-height:1;">${escape(letter)}</td></tr>
    </table>
  `;
  // Producer avatar — circular 44 px, with first-letter fallback.
  const avatarBlock = p.producerAvatarUrl
    ? `<img src="${escape(p.producerAvatarUrl)}" alt="" width="44" height="44" style="display:block;border:0;border-radius:50%;object-fit:cover;">`
    : `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="44" height="44" style="background:#2b25ff;border-radius:50%;">
        <tr><td align="center" valign="middle" style="color:#ffffff;font-family:'Unbounded','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:800;font-size:18px;line-height:1;">${escape(initial)}</td></tr>
      </table>`;

  // Beat list as table rows so cover + title align cleanly across
  // every email client. <td> intrinsic widths beat flex hacks here.
  const rows = p.beats
    .slice(0, 8)
    .map((b) => {
      const cover = b.artworkUrl
        ? `<img src="${escape(b.artworkUrl)}" alt="" width="56" height="56" style="display:block;border:0;border-radius:10px;object-fit:cover;">`
        : placeholderTile(
            (b.title[0] ?? "?").toUpperCase(),
            56,
          );
      return `
        <tr>
          <td style="padding:8px 0;" width="56" valign="middle">${cover}</td>
          <td style="padding:8px 0 8px 14px;color:#0c0c0e;font-family:'Hanken Grotesk','Inter',sans-serif;font-size:15px;font-weight:600;line-height:1.3;vertical-align:middle;">${escape(b.title)}</td>
        </tr>`;
    })
    .join("");
  const more =
    count > 8
      ? `<tr><td colspan="2" style="padding:8px 0 0;color:#8e8e98;font-family:'Hanken Grotesk','Inter',sans-serif;font-size:13px;">+${count - 8} more…</td></tr>`
      : "";

  const html = brandShell({
    preheader: `${p.producerHandle} just dropped ${count} beat${count === 1 ? "" : "s"} in ${p.serverName}.`,
    meta: `${count} NEW &middot; BY ${escape(p.producerHandle).toUpperCase()}`,
    title: headline,
    bodyHtml: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;">
        <tr>
          <td width="44" valign="middle">${avatarBlock}</td>
          <td valign="middle" style="padding-left:12px;color:#0c0c0e;font-size:15px;line-height:1.4;">
            <strong style="color:#0c0c0e;">${escape(p.producerHandle)}</strong> just dropped fresh material in <strong style="color:#0c0c0e;">${escape(p.serverName)}</strong>.
          </td>
        </tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding:14px 18px;border-radius:12px;background:#f5f5f7;">
        ${rows}
        ${more}
      </table>
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
  /** When set, the 'Join the server' CTA points here instead of
   *  the public /s/<slug> gate. Used by the fan-out to embed an
   *  admin-generated magic-link so the recipient lands on
   *  /listen/<slug> in one click instead of being asked to
   *  request access on the gate. */
  inviteUrl?: string | null;
}

export async function sendAddedToServerEmail(
  p: AddedToServerEmailPayload,
): Promise<SendResult> {
  // Prefer the one-click magic-link when the fan-out managed to
  // generate one. Falls back to the public /s/<slug> gate URL
  // when the inviteUrl is null (Supabase admin generateLink
  // hiccup, or the email arrives via a path that doesn't
  // pre-generate).
  const url = p.inviteUrl ?? `${siteUrl()}/s/${p.serverSlug}`;
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
    // No 'OR PASTE THIS LINK' line — the inviteUrl encodes the
    // raw Supabase action_link as ?u=…&lt;long encoded supabase
    // URL&gt;. Surfacing it in the email body broke the brand
    // illusion ('why is wavloops sending me a supabase.co
    // link?'). The CTA button is enough; the magic-link sits
    // safely inside its href instead of in plain text.
    secondary: null,
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

/* ============================================================
   Producer-nurture sequence
   ────────────────────────────────────────────────────────────
   4 emails sent over 10 days to artists who joined a producer-
   audience server. Goal: educate them on Wavloops the platform
   and convert them into producer-users themselves.

   Senders below are pure templates — the cron picks which to
   fire based on contact_nurture_sequence.current_step. Each
   uses FROM_NURTURE (hello@) + a Reply-To so a reply lands in
   40mins' inbox, not the catch-all.

   Unsub: every footer carries a /api/nurture-unsubscribe link
   with an HMAC token. The endpoint flips the sequence row to
   'unsubscribed' so the cron stops sending. Required for GDPR
   + CAN-SPAM compliance.
   ============================================================ */

const NURTURE_REPLY_TO = "hello@wavloops.co";

/** Build the unsubscribe URL for the nurture footer. The token
 *  is an HMAC-SHA256 of the contact id keyed on CRON_SECRET — the
 *  same secret already in Vercel for the existing cron routes,
 *  so no new env var to ship. */
function nurtureUnsubLink(contactId: string): string {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return `${siteUrl()}/api/nurture-unsubscribe?c=${contactId}`;
  // crypto is a Node global at this layer — no need to import.
  const crypto = require("node:crypto") as typeof import("node:crypto");
  const token = crypto
    .createHmac("sha256", secret)
    .update(contactId)
    .digest("hex")
    .slice(0, 32); // 128 bits is plenty
  return `${siteUrl()}/api/nurture-unsubscribe?c=${contactId}&t=${token}`;
}

/** Footer line for every nurture email. Shared so the unsub copy
 *  + signature stay consistent across the 4 steps. */
function nurtureFooter(contactId: string): string {
  const unsub = nurtureUnsubLink(contactId);
  return `40mins · Wavloops &middot; wavloops.co &middot; <a href="${unsub}" style="color:#8e8e98;text-decoration:underline;">Unsubscribe</a>`;
}

/** Config-driven sequence — each step is a pure data object so
 *  the cron, the live sender, and the /admin preview route all
 *  build the exact same HTML from the same source. Adding /
 *  editing a step = touching one entry in this array. */
interface NurtureStepConfig {
  subject: string;
  preheader: string;
  meta: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  /** Suffix appended to the CTA URL's utm_campaign so per-step
   *  conversions are attributable in analytics. */
  ctaCampaign: string;
}

export const NURTURE_STEPS: readonly NurtureStepConfig[] = [
  // Voice convention: every step opens with an explicit founder
  // self-intro ("40mins here — I built Wavloops") so the
  // recipient never has to guess WHO's writing. Once a second
  // producer joins the platform, the sequence still makes sense
  // because the contact knows the founder is reaching out, not
  // the producer whose server they joined.
  {
    subject: "You're in. Here's what Wavloops actually is.",
    preheader:
      "Server access is just the start — here's what Wavloops actually unlocks.",
    meta: "WAVLOOPS &middot; FROM THE FOUNDER",
    title: "You're in. Here's what Wavloops actually is.",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hey,</p>
      <p style="margin:0 0 16px;"><strong style="color:#0c0c0e;">40mins here</strong> &mdash; I built Wavloops.</p>
      <p style="margin:0 0 16px;">You just got access to a server on the platform. Welcome.</p>
      <p style="margin:0 0 16px;">You came for the loops &mdash; fair. But there's something most producers miss when they land on Wavloops for the first time:</p>
      <p style="margin:0 0 16px;"><strong style="color:#0c0c0e;">It's not just a place to download. It's a place to build your own audience &mdash; and a clean workflow that turns it into placements</strong> &mdash; the same way the producer who shared this link does.</p>
      <p style="margin:0 0 16px;">Over the next few days I'll show you exactly how &mdash; and why every producer doing real numbers right now is moving away from WeTransfer, DMs, and the broken workflow that costs them placements every week.</p>
      <p style="margin:0;">If you're already running your own sound, this is for you.</p>
    `,
    ctaLabel: "See the producer side",
    ctaCampaign: "step1",
  },
  {
    subject: "Your workflow is killing your placements.",
    preheader: "And it's not the beats.",
    meta: "WAVLOOPS &middot; PAIN POINT 01",
    title: "Your workflow is killing your placements.",
    // Storytelling-first: open with a peer quote (social proof
    // from a producer), drop the reader into a Tuesday-afternoon
    // scene they recognise immediately, then pivot to the
    // landing-page copy reframed as two scannable solution
    // cards. The two cards mirror Wavloops' real pillars —
    // 'never send a pack again' (audience side) + 'turn contacts
    // into placements' (placement side).
    bodyHtml: `
      <p style="margin:0 0 16px;">Hey,</p>
      <p style="margin:0 0 16px;">40mins again &mdash; <strong style="color:#0c0c0e;">founder of Wavloops</strong>, working producer.</p>
      <p style="margin:0 0 12px;">Got this from a producer last week:</p>
      <div style="margin:0 0 22px;padding:14px 18px;border-left:3px solid #2b25ff;background:#f5f5f7;border-radius:0 8px 8px 0;color:#5e5e6a;font-size:14.5px;line-height:1.55;font-style:italic;">
        &ldquo;Organizing contacts and keeping track of who I already sent stuff to is a huge headache. It takes too much time away from actually producing.&rdquo;
        <div style="margin-top:8px;font-style:normal;font-size:11px;color:#8e8e98;letter-spacing:0.06em;text-transform:uppercase;">&mdash; a producer</div>
      </div>
      <p style="margin:0 0 16px;">Sound familiar?</p>
      <p style="margin:0 0 12px;"><strong style="color:#0c0c0e;">Here's the scene.</strong></p>
      <p style="margin:0 0 12px;">Tuesday afternoon. You finish a fire new pack. 8 loops, ready to ship.</p>
      <p style="margin:0 0 12px;">You open WeTransfer &rarr; drag the files &rarr; wait for the upload &rarr; copy the link &rarr; paste it in 12 DMs, 5 emails, 2 group chats.</p>
      <p style="margin:0 0 12px;">30 minutes gone before a single artist has heard the first kick.</p>
      <p style="margin:0 0 12px;">By Friday, half the links expired. Half the artists never clicked. The rest? You'll never know &mdash; no read receipt, no listen tracking, no proof anyone vibed.</p>
      <p style="margin:0 0 24px;">Then it's the next week. Repeat.</p>
      <p style="margin:0 0 14px;"><strong style="color:#0c0c0e;">Now imagine this instead.</strong></p>
      <div style="margin:0 0 14px;padding:18px 20px;background:#fafafb;border-radius:12px;border:1px solid #ececef;">
        <div style="font-family:'Unbounded','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;color:#0c0c0e;margin-bottom:8px;letter-spacing:-0.01em;">Never send a pack again.</div>
        <p style="margin:0;color:#5e5e6a;font-size:14.5px;line-height:1.55;">You drag a beat into your server. Done. Every artist with your link gets it &mdash; instantly, forever. No re-uploads, no expired transfers, no &ldquo;did you get my pack?&rdquo;. Just one living link that updates itself.</p>
      </div>
      <div style="margin:0 0 22px;padding:18px 20px;background:#fafafb;border-radius:12px;border:1px solid #ececef;">
        <div style="font-family:'Unbounded','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;color:#0c0c0e;margin-bottom:8px;letter-spacing:-0.01em;">Turn your contacts into placements.</div>
        <p style="margin:0;color:#5e5e6a;font-size:14.5px;line-height:1.55;">Your dashboard shows exactly who played the new beat. Who looped it 4 times. Who downloaded the stem. Those signals = your next placement. No more guessing who's hot on what. The data is right there.</p>
      </div>
      <p style="margin:0;"><strong style="color:#0c0c0e;">One link. Two outcomes. Zero busywork.</strong></p>
    `,
    ctaLabel: "Build my placement system",
    ctaCampaign: "step2",
  },
  {
    subject: "Founder's story: 583 leads in 30 days.",
    preheader: "The exact play — and why it worked.",
    meta: "WAVLOOPS &middot; FOUNDER'S STORY",
    title: "How I personally captured 583 leads in 30 days.",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hey,</p>
      <p style="margin:0 0 16px;">40mins here. <strong style="color:#0c0c0e;">Founder of Wavloops &mdash; but also Wavloops user #1</strong>. I built it for myself first, then opened it up.</p>
      <p style="margin:0 0 16px;">30 days after opening my first server (Toronto CHOP), here's what happened on my own account:</p>
      <ul style="margin:0 0 16px;padding-left:20px;">
        <li style="margin:0 0 8px;"><strong style="color:#0c0c0e;">583 artists</strong> joined the server.</li>
        <li style="margin:0 0 8px;"><strong style="color:#0c0c0e;">15 placements</strong> booked through artists I never would've reached via DM.</li>
        <li style="margin:0;"><strong style="color:#0c0c0e;">$0 spent</strong> on ads.</li>
      </ul>
      <p style="margin:0 0 16px;">The trick wasn't a fancy tool. It was finally having a system that scales.</p>
      <p style="margin:0 0 16px;">One link. Pinned in every YouTube video, every Instagram bio. Artists join with their email. They get every new loop I drop. I see exactly who's engaged.</p>
      <p style="margin:0;"><strong style="color:#0c0c0e;">Every producer on Wavloops gets this exact setup.</strong> YouTube channel, Instagram following, Discord &mdash; doesn't matter where your audience lives. You can run the same play tomorrow.</p>
    `,
    ctaLabel: "Open my account",
    ctaCampaign: "step3",
  },
  {
    subject: "Last one from me — your turn.",
    preheader: "90 seconds. Free forever. No card.",
    meta: "WAVLOOPS &middot; LAST ONE",
    title: "Last one — your turn.",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hey,</p>
      <p style="margin:0 0 16px;">40mins &mdash; last email from me on this. I'm not gonna spam.</p>
      <p style="margin:0 0 16px;">If everything I've sent has made sense, here's the entry point:</p>
      <ul style="margin:0 0 16px;padding-left:20px;">
        <li style="margin:0 0 8px;"><strong style="color:#0c0c0e;">Free forever</strong> to start (no card needed).</li>
        <li style="margin:0 0 8px;"><strong style="color:#0c0c0e;">90 seconds</strong> to set up your first server.</li>
        <li style="margin:0;"><strong style="color:#0c0c0e;">Your first link</strong> ready to share by tonight.</li>
      </ul>
      <p style="margin:0 0 16px;">Whether you're a beatmaker with 200 followers or 200K &mdash; Wavloops scales with you.</p>
      <p style="margin:0 0 16px;">And if it's not for you, no hard feelings. I'll stop emailing after this one.</p>
      <p style="margin:0;font-style:italic;color:#5e5e6a;">&mdash; 40mins<br />Founder, Wavloops</p>
    `,
    ctaLabel: "Start free",
    ctaCampaign: "step4",
  },
];

/** Build the HTML + subject for a given step. Pure function — same
 *  output from the cron, the preview route, or anywhere else that
 *  imports it. */
export function buildNurtureEmail(
  /** Zero-indexed: 0 = welcome, 3 = last one. */
  stepIndex: number,
  /** Used in the unsub link's HMAC token. Pass any uuid for
   *  preview / smoke-test surfaces — only the live cron path
   *  needs it to be a real contact id. */
  contactId: string,
): { subject: string; html: string } {
  const step = NURTURE_STEPS[stepIndex];
  if (!step) {
    throw new Error(`Invalid nurture step index: ${stepIndex}`);
  }
  const html = brandShell({
    preheader: step.preheader,
    meta: step.meta,
    title: step.title,
    bodyHtml: step.bodyHtml,
    ctaLabel: step.ctaLabel,
    ctaUrl: `${siteUrl()}/auth?as=producer&utm_source=nurture&utm_campaign=${step.ctaCampaign}`,
    secondary: null,
    footer: nurtureFooter(contactId),
  });
  return { subject: step.subject, html };
}

/** Fire the producer-nurture step for one contact. The cron picks
 *  the index from contact_nurture_sequence.current_step + 1. */
export async function sendNurtureStep(
  stepIndex: number,
  toEmail: string,
  contactId: string,
): Promise<SendResult> {
  const { subject, html } = buildNurtureEmail(stepIndex, contactId);
  return send({
    to: toEmail,
    from: FROM_NURTURE,
    replyTo: NURTURE_REPLY_TO,
    subject,
    html,
  });
}

/** Step delays from contact.first_seen_at. The cron uses these to
 *  decide whether the next step is due. Picked to land each email
 *  on a different day-of-week so the recipient doesn't tune the
 *  cadence out. */
export const NURTURE_STEP_DELAYS_MS = [
  15 * 60 * 1000, //          step 1 — +15 minutes
  2 * 24 * 60 * 60 * 1000, // step 2 — +2 days
  5 * 24 * 60 * 60 * 1000, // step 3 — +5 days
  10 * 24 * 60 * 60 * 1000, // step 4 — +10 days
] as const;
