/**
 * PostHog user identifier — turns the anonymous browsing session into
 * an identified PostHog person once the auth cookie carries a Supabase
 * user.
 *
 * Runs client-side inside the root layout, below <PostHogProvider>. On
 * mount:
 *   1. Reads the current Supabase session via the browser client.
 *   2. If a user is present AND PostHog hasn't already been told about
 *      them, calls `posthog.identify(user.id, {...})`. The properties
 *      come from a lightweight `/api/me` endpoint (below) that reads
 *      producer/artist/subscription state server-side — no extra
 *      Supabase round-trip client-side.
 *   3. Subscribes to Supabase auth-state changes so a sign-in mid-
 *      session identifies immediately and a sign-out fires
 *      `posthog.reset()` to break the anonymous → identified link so
 *      the next visitor doesn't inherit the previous identity.
 *
 * Kept as a tiny dedicated component so the identify logic lives in
 * exactly one place, out of the way of the pageview capture and the
 * provider bootstrap. */

"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

interface MeResponse {
  ok: boolean;
  user?: {
    id: string;
    email: string | null;
    is_producer: boolean;
    is_artist: boolean;
    plan: string;
    handle: string | null;
  };
}

export function PostHogUserIdentifier() {
  // Refs so effect runs stay cheap: guard against re-identifying the same
  // user twice, and against resetting an already-anonymous session.
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function identifyFromSession(userId: string) {
      if (identifiedUserId.current === userId) return;
      try {
        const r = await fetch("/api/me", { credentials: "same-origin" });
        if (!r.ok) return;
        const { user }: MeResponse = await r.json();
        if (!user) return;
        posthog.identify(user.id, {
          email: user.email,
          is_producer: user.is_producer,
          is_artist: user.is_artist,
          plan: user.plan,
          handle: user.handle,
        });
        identifiedUserId.current = user.id;
      } catch {
        // Best-effort: identification failures shouldn't break the page.
        // Missing NEXT_PUBLIC_POSTHOG_KEY silently disables all captures
        // upstream so the identify call is a no-op there anyway.
      }
    }

    // Initial pass — page may have loaded already authenticated.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) identifyFromSession(data.user.id);
    });

    // Reactive pass — sign-ins, sign-outs, token refreshes.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        posthog.reset();
        identifiedUserId.current = null;
        return;
      }
      if (session?.user?.id) {
        identifyFromSession(session.user.id);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
