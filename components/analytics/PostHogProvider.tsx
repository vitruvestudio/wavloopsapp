/**
 * PostHog provider — client-side capture bootstrap.
 *
 * Wraps the app in <PostHogProvider> so `usePostHog()` / `posthog.capture()`
 * work anywhere below. Uses `person_profiles: "identified_only"` on purpose:
 *
 *   - Unidentified visitors (people browsing the public landing) generate
 *     ANONYMOUS events. Their $device_id is tracked for funnel continuity but
 *     PostHog never creates a "person" for them → no GDPR consent banner needed
 *     because no personal identifier is stored server-side until the user
 *     signs in.
 *   - The moment `posthog.identify(userId, {...})` fires in the auth callback
 *     side (see PostHogUserIdentifier), the anonymous events retroactively
 *     alias to that person. So the funnel Landing → Signup → Server → Beat
 *     stays intact across the identify boundary.
 *
 * Pageviews are captured MANUALLY via <PostHogPageviews> below because
 * App Router doesn't fire `router.change` events the SDK could listen to.
 * The default `capture_pageview: true` in the App Router misses client-side
 * transitions between /dashboard → /servers/... etc.
 *
 * Session Replay is enabled by default in the SDK — you flip it on/off from
 * the PostHog project settings. No client-side toggle needed.
 */

"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";

export function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || !host) {
      // Silent bail — dev environments without the env vars set shouldn't
      // spam the console; the missing key is obvious when zero events reach
      // the PostHog project.
      return;
    }
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: false, // handled manually below to catch App Router transitions
      capture_pageleave: true,
      // Enable session replay by default; toggle off from PostHog project settings.
      disable_session_recording: false,
      // Autocapture picks up clicks / form submissions automatically — useful
      // for surfacing UX friction without instrumenting every button.
      autocapture: true,
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageviews />
      </Suspense>
      {children}
    </PHProvider>
  );
}

/** Manual pageview capture — the App Router doesn't fire the events the
 *  default `capture_pageview: true` listens for on client-side transitions.
 *  This effect re-fires `$pageview` whenever pathname or search params change,
 *  which is the App Router's canonical "navigation happened" signal.
 *
 *  Kept inside a <Suspense> boundary because `useSearchParams` opts the
 *  parent tree into dynamic rendering; the boundary contains the switch
 *  and keeps the rest of the tree statically renderable when possible. */
function PostHogPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph || !pathname) return;
    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}
