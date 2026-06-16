/**
 * /auth/magic — passwordless artist sign-in.
 *
 * Form is split into MagicLinkScreen.tsx (client) so the page can
 * stay server-rendered and export metadata cleanly.
 *
 * Server-side search params:
 *   ?sent=1       → render the "Check your inbox" success state
 *   ?email=<x>    → display the email in the success state
 *   ?next=<path>  → carried into the form so the post-auth redirect
 *                   lands the user where they came from
 *   ?error=<msg>  → pre-fill the form's error slot (from callback)
 */

import type { Metadata } from "next";
import { MagicLinkScreen } from "./MagicLinkScreen";

export const metadata: Metadata = {
  title: "Sign in to Wavloops",
  description: "We'll email you a one-tap link. No password to remember.",
};

export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  return (
    <MagicLinkScreen
      sent={first("sent") === "1"}
      sentEmail={first("email")}
      initialError={first("error")}
      next={first("next") || "/listen"}
    />
  );
}
