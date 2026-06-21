import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Cookie Policy — Wavloops",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" lastUpdated="June 21, 2026">
      <p>
        This page explains what cookies and similar technologies{" "}
        <strong>Wavloops</strong> uses, why we use them, and how you can
        control them.
      </p>

      <h2>1. What is a cookie?</h2>
      <p>
        A cookie is a small text file stored by your browser when you visit
        a website. Cookies let the site remember information about your
        visit — for example, that you are signed in, or which theme you
        prefer.
      </p>

      <h2>2. Cookies we set</h2>
      <h3>Strictly necessary</h3>
      <p>
        These cookies are required for Wavloops to function and cannot be
        turned off. They never store personal data outside the session
        context.
      </p>
      <ul>
        <li>
          <strong>sb-*</strong> (set by Supabase auth) — sign-in session
          tokens. Removed on sign-out.
        </li>
        <li>
          <strong>wlp_last_mode</strong> — remembers whether you last used
          Wavloops as a producer or as an artist, so we route you to the
          right surface on next visit.
        </li>
      </ul>

      <h3>Functional</h3>
      <p>
        These cookies remember preferences that improve your experience but
        are not strictly required.
      </p>
      <ul>
        <li>
          <strong>theme</strong> — light or dark theme override (defaults to
          your system preference).
        </li>
      </ul>

      <h3>Analytics</h3>
      <p>
        We do not currently load third-party analytics scripts (Google
        Analytics, Mixpanel, etc.) on the public landing or in the app. If
        that changes, this section will be updated and you will be offered
        a consent banner first.
      </p>

      <h3>Advertising</h3>
      <p>
        We do not run advertising on Wavloops, and we do not set advertising
        cookies.
      </p>

      <h2>3. How to control cookies</h2>
      <p>
        Every modern browser lets you block or delete cookies — usually
        under <strong>Settings → Privacy</strong>. Blocking strictly
        necessary cookies will sign you out of Wavloops and prevent paid
        features from loading. Blocking functional cookies will reset your
        theme preference each visit.
      </p>
      <p>
        If you have any questions or want to know which cookies are set in
        your browser right now, open your browser&apos;s dev tools{" "}
        (<strong>F12</strong> on most desktops) and inspect{" "}
        <strong>Application → Cookies → wavloops.co</strong>.
      </p>

      <h2>4. Changes to this policy</h2>
      <p>
        We will update this page whenever we add or remove a cookie. The
        &ldquo;Last updated&rdquo; date at the top reflects the most recent
        revision.
      </p>

      <h2>5. Contact</h2>
      <p>
        Questions about cookies:{" "}
        <a href="mailto:hello@wavloops.co">hello@wavloops.co</a>.
      </p>
    </LegalShell>
  );
}
