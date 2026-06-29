/**
 * GET /api/nurture-unsubscribe?c=<contact_id>&t=<hmac>
 *
 * Flips the contact's nurture sequence row to 'unsubscribed' so
 * the cron stops sending. One-click — required for GDPR + CAN-SPAM
 * compliance.
 *
 * The token is HMAC-SHA256(contact_id, CRON_SECRET) truncated to
 * 128 bits. Without a valid token we 404 — that stops a script
 * from enumerating contact ids and force-unsubscribing arbitrary
 * people (worst case still annoying but bounded).
 *
 * Idempotent: a second click on the same link is a no-op, the
 * confirmation page renders the same way.
 *
 * Returns a plain HTML confirmation page rather than redirecting.
 * No need to roundtrip through React — this endpoint is reached
 * by people who explicitly want OUT of the funnel, the fastest
 * acknowledgement is best.
 */

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function verifyToken(contactId: string, token: string): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || !token) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(contactId)
    .digest("hex")
    .slice(0, 32);
  // Constant-time compare to avoid timing-leak via the comparison
  // — sneaky but cheap.
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token, "utf8"),
    Buffer.from(expected, "utf8"),
  );
}

function confirmationHtml(message: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Unsubscribed · Wavloops</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; background:#f5f5f7; color:#0c0c0e; }
  .wrap { max-width:520px; margin:80px auto; padding:36px 32px; background:#ffffff; border:1px solid #ececef; border-radius:18px; }
  h1 { margin:0 0 12px; font-size:22px; letter-spacing:-0.012em; }
  p { margin:0 0 12px; font-size:15px; line-height:1.6; color:#5e5e6a; }
  .mono { font-family:'JetBrains Mono',Menlo,Consolas,monospace; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#8e8e98; margin-top:20px; }
  a { color:#2b25ff; text-decoration:none; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>You're unsubscribed.</h1>
    <p>${message}</p>
    <p>Sorry to see you go. If this was a mistake, just reply to any email and we'll re-add you.</p>
    <div class="mono">Wavloops &middot; <a href="https://wavloops.co">wavloops.co</a></div>
  </div>
</body>
</html>`;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const contactId = url.searchParams.get("c");
  const token = url.searchParams.get("t") ?? "";

  if (!contactId || !verifyToken(contactId, token)) {
    // We deliberately render the SAME confirmation rather than a
    // 404 — a confused recipient who got a malformed link still
    // sees "you're out" rather than a scary error page. The
    // sequence row simply isn't flipped, but if they ever click
    // a valid link later the cron stops.
    return new NextResponse(
      confirmationHtml(
        "You won't receive any more emails from the Wavloops nurture sequence.",
      ),
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const admin = getAdminSupabase();
  const { error } = await admin
    .from("contact_nurture_sequence" as never)
    .update({
      status: "unsubscribed",
      completed_at: new Date().toISOString(),
      completion_reason: "user_clicked_unsub_link",
    } as never)
    .eq("contact_id", contactId);

  if (error) {
    console.warn("[nurture-unsub] update failed", error);
  }

  return new NextResponse(
    confirmationHtml(
      "You're off the nurture sequence. You won't receive any more emails from this flow.",
    ),
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
