/**
 * PostHog — server-side capture + identify.
 *
 * Used from Route Handlers, Server Actions, cron jobs, and the
 * Stripe webhook — anywhere a browser session doesn't exist but
 * we still want to record a funnel event (server_created,
 * subscription_upgraded, artist_invited via server-side flow…).
 *
 * Two exported entry-points:
 *
 *   - `capture(distinctId, event, properties?)` — records an
 *     event on the person identified by `distinctId` (always the
 *     Supabase auth user id; matches the id the client-side
 *     PostHogUserIdentifier calls `identify()` with, so timelines
 *     stay in sync between the two sides).
 *
 *   - `identify(distinctId, properties)` — updates person
 *     properties (plan changes, onboarded_at). Used by the auth
 *     callback so the very first PostHog event after signup
 *     already has the enriched traits, without waiting for the
 *     client-side identify effect to fire.
 *
 * All calls are best-effort: PostHog errors are logged and
 * swallowed. Analytics must not take down a producer flow.
 *
 * Uses `posthog-node`'s auto-flush interval so callers never
 * need to await network I/O. In edge/serverless we explicitly
 * call `shutdown()` inside `waitUntil()` if the runtime allows,
 * because a Vercel function that returns before the flush loses
 * the event.
 */

import "server-only";
import { PostHog } from "posthog-node";

let client: PostHog | null = null;
let warnedMissingKey = false;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) {
    if (!warnedMissingKey) {
      // One-shot log so local dev without the env vars stays
      // quiet after the first request.
      console.warn(
        "[analytics] NEXT_PUBLIC_POSTHOG_KEY missing — server-side capture disabled",
      );
      warnedMissingKey = true;
    }
    return null;
  }
  if (!client) {
    client = new PostHog(key, {
      host,
      // flushAt/flushInterval defaults are fine for the traffic
      // Wavloops sees today. If a route needs guaranteed delivery
      // before the response ships, it should call
      // `flushServerEvents()` before returning.
    });
  }
  return client;
}

/** Record a server-side event. Silently no-ops when PostHog
 *  isn't configured or the client throws. */
export async function capture(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({ distinctId, event, properties });
  } catch (e) {
    console.warn("[analytics] capture failed", { event, error: e });
  }
}

/** Update person properties on the server so a producer's plan
 *  change or first-onboard flag is available before the browser
 *  identifies again. */
export async function identify(
  distinctId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.identify({ distinctId, properties });
  } catch (e) {
    console.warn("[analytics] identify failed", { error: e });
  }
}

/** Flush + close the PostHog client. Call from `waitUntil()` in
 *  Route Handlers that would otherwise return before the SDK's
 *  background flush loop ticks. */
export async function flushServerEvents(): Promise<void> {
  if (!client) return;
  try {
    await client.shutdown();
  } catch (e) {
    console.warn("[analytics] shutdown failed", e);
  } finally {
    client = null;
  }
}
