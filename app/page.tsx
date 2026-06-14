/**
 * Wavloops V3 — placeholder home.
 *
 * Temporary minimal page surfaced at `/` while the producer app
 * (auth → onboarding → dashboard) is being built. Replaces the
 * V1/V2 marketing landings (archived under git tag
 * `v1-landings-archive`).
 *
 * Doubles as a smoke test for the new design system — if you can
 * read centred Unbounded over a cool-tinted dark surface with an
 * uppercase mono kicker, the tokens are wired correctly.
 */

import Image from "next/image";

export default function HomePlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-sp-6 text-center">
      <div className="flex max-w-[480px] flex-col items-center gap-sp-6">
        <Image
          src="/Photos/wavloops-icon.png"
          alt="Wavloops"
          width={56}
          height={56}
          priority
        />

        <div className="t-mono-s text-accent-text">RELAUNCHING SOON · V1</div>

        <h1 className="t-display" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>
          Your beats, a&nbsp;living link.
        </h1>

        <p className="t-body-l max-w-[40ch]">
          Drop beats into shareable servers. Send one link — capture every
          contact and see who listens, in real time.
        </p>

        <div className="t-mono-s text-fg-4">FOR PRODUCERS · 20 FOUNDING SPOTS</div>
      </div>
    </main>
  );
}
