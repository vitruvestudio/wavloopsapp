import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Server-side Resend client. NEVER import from a client component.
 * Returns null if API key is missing — callers should handle gracefully
 * so a missing email config doesn't break the submission flow.
 */
export function getResend(): Resend | null {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[resend] RESEND_API_KEY not set — emails will not be sent.",
    );
    return null;
  }

  cached = new Resend(apiKey);
  return cached;
}
