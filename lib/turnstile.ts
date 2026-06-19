/**
 * Cloudflare Turnstile — server-side token verification.
 *
 * Turnstile is the captcha that proves a gate-form submission came
 * from a human, not a script hammering the endpoint. The widget
 * renders on the gate page and drops a single-use token into the
 * form (`cf-turnstile-response`); this helper validates it against
 * Cloudflare's siteverify API before we let the request through.
 *
 * Configuration (two env vars, set them together):
 *   - NEXT_PUBLIC_TURNSTILE_SITE_KEY — public, rendered in the
 *     widget. Read client-side in the gate page.
 *   - TURNSTILE_SECRET_KEY — secret, server-only, used here.
 *
 * Fail-open when unconfigured: if TURNSTILE_SECRET_KEY is absent we
 * return `true` and log a warning, so deploying this code does NOT
 * break the gate before the Cloudflare keys are wired. The moment
 * the secret is set, verification is enforced. (The companion
 * migration that revokes anon EXECUTE on submit_access_request is
 * the structural defense that holds regardless — Turnstile is the
 * bot filter on top of it.)
 *
 * Cloudflare test keys (always-pass) for local/staging:
 *   site:   1x00000000000000000000AA
 *   secret: 1x0000000000000000000000000000000AA
 */

import "server-only";

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | null,
  ip?: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn(
      "[turnstile] TURNSTILE_SECRET_KEY not set — skipping bot check. " +
        "Set it (+ NEXT_PUBLIC_TURNSTILE_SITE_KEY) to enforce the gate captcha.",
    );
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    // Fail CLOSED on a verify error when Turnstile is configured —
    // make the human retry rather than wave a possible bot through.
    console.warn("[turnstile] verify request failed", e);
    return false;
  }
}
