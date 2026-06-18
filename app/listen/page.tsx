/**
 * /listen — landing for the artist panel.
 *
 * Reads the authed user's real producer contacts via
 * loadArtistContext() and redirects to the first server they
 * actually have access to. The Phase 1 stub used the static mock
 * which 404'd the moment the chosen slug didn't exist in the live
 * DB (Theo hit this after Switch-to-Artist routed him here).
 *
 * If the user has no producer contacts yet (artist-pure with no
 * invites), render a minimal empty-state instead of redirecting
 * to a non-existent slug.
 */

import { redirect } from "next/navigation";
import { loadArtistContext } from "./_data";

export default async function ListenLanding() {
  const ctx = await loadArtistContext();

  // Pick the first server across all the user's producer contacts.
  // ArtistContext groups by producer, so we walk both layers and
  // grab the first hit. The artist sidebar uses the same shape, so
  // landing on that server matches what the sidebar will highlight.
  const firstServer = ctx?.producers
    .flatMap((p) => p.servers)
    .find((s) => Boolean(s));

  if (firstServer) {
    redirect(`/listen/${firstServer.slug}`);
  }

  return (
    <main
      className="flex-1 min-w-0 flex flex-col items-center justify-center"
      style={{ padding: "48px 24px", minHeight: "70dvh" }}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ maxWidth: 440, gap: 14 }}
      >
        <div
          className="t-mono-s"
          style={{
            color: "var(--accent-text)",
            letterSpacing: "0.08em",
          }}
        >
          WELCOME
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 38px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--fg-1)",
            margin: 0,
          }}
        >
          No packs yet
        </h1>
        <p
          className="t-body"
          style={{
            color: "var(--fg-3)",
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 360,
          }}
        >
          Producers invite you to their servers via email. Once you
          have at least one invitation, the pack lands here.
        </p>
      </div>
    </main>
  );
}
