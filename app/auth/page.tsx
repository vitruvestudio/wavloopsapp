/**
 * /auth — unified producer + artist entry.
 *
 * Server component. Reads search params and forwards them to
 * AuthScreen, which renders one of three states:
 *   - CHOOSE  (no `as` param)        → 2 role cards
 *   - EMAIL   (?as=producer|artist)  → email field + Google OAuth
 *   - SENT    (?sent=1)              → "Check your inbox"
 *
 * Lives at the top level of the App Router — not inside (app) —
 * so it inherits only the root layout (fonts + theme) and renders
 * without the producer App shell (Sidebar/TopBar/PlayerDock).
 */

import type { Metadata } from "next";
import { AuthScreen } from "./AuthScreen";
import type { AuthRole } from "./actions";

export const metadata: Metadata = {
  title: "Get started — Wavloops",
  description:
    "Share your beats with the artists you trust, or pick beats from producers you work with.",
};

interface AuthPageProps {
  searchParams: Promise<{
    as?: string;
    sent?: string;
    email?: string;
    next?: string;
    error?: string;
    requested?: string;
  }>;
}

function parseRole(v: string | undefined): AuthRole | null {
  if (v === "producer" || v === "artist") return v;
  return null;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  return (
    <AuthScreen
      initialRole={parseRole(params.as)}
      sent={params.sent === "1"}
      sentEmail={params.email ?? ""}
      requested={params.requested === "1"}
      next={params.next ?? ""}
      initialError={params.error ?? ""}
    />
  );
}
