import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Privacy Policy — Wavloops",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="June 21, 2026">
      <p>
        This Privacy Policy explains what personal data{" "}
        <strong>Wavloops</strong> (operated by Vitruve) collects, how it is
        used, and the rights you have under the European General Data
        Protection Regulation (GDPR).
      </p>

      <h2>1. Data we collect</h2>
      <h3>From producers (account holders)</h3>
      <ul>
        <li><strong>Email address</strong> — for sign-in and notifications.</li>
        <li>
          <strong>Profile</strong> — display name, optional handle, optional
          avatar.
        </li>
        <li>
          <strong>Content</strong> — beats, cover art, server settings,
          contact lists, comments, descriptions you upload or write.
        </li>
        <li>
          <strong>Usage data</strong> — pages visited, session timestamps,
          IP address, browser user-agent (used to detect abuse).
        </li>
        <li>
          <strong>Billing</strong> — when you upgrade, Stripe collects card
          details and shares with us a customer ID, last 4 digits, brand,
          country and billing email. We never see or store full card
          numbers.
        </li>
      </ul>
      <h3>From artists (server visitors)</h3>
      <ul>
        <li><strong>Email address</strong> — for sign-in to private servers.</li>
        <li>
          <strong>Optional social profile</strong> — when an access request
          is required by a private server.
        </li>
        <li>
          <strong>Listening signal</strong> — which beats are played, liked,
          and at what time, for analytics shown to the producer.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To operate the Service (sign-in, content delivery, analytics);</li>
        <li>To process payments and prevent fraud (Stripe);</li>
        <li>
          To send transactional emails (sign-in links, billing receipts,
          critical security notices). We do not send marketing emails
          without a clear opt-in;
        </li>
        <li>
          To improve the Service: aggregate, non-personal usage trends
          inform product decisions.
        </li>
      </ul>

      <h2>3. Legal basis</h2>
      <p>
        We process personal data on the basis of (a){" "}
        <strong>contract</strong> — to provide the Service you signed up for;
        (b) <strong>legitimate interest</strong> — to secure the platform
        and prevent abuse; and (c) <strong>consent</strong> — for any
        optional feature that requires it (e.g. marketing email opt-in).
      </p>

      <h2>4. Sub-processors</h2>
      <p>We rely on the following providers, each bound by a data-processing agreement:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — database + file storage + auth (EU
          region).
        </li>
        <li>
          <strong>Vercel</strong> — application hosting, CDN, edge functions
          (region: EU/US depending on the request).
        </li>
        <li>
          <strong>Stripe</strong> — payment processing (Ireland + US for
          fraud detection).
        </li>
        <li>
          <strong>Resend</strong> — transactional email delivery (US).
        </li>
      </ul>

      <h2>5. Data retention</h2>
      <ul>
        <li>
          <strong>Active accounts</strong>: data is kept as long as your
          account is open.
        </li>
        <li>
          <strong>Closed accounts</strong>: content (beats, servers,
          contacts, analytics) is deleted within thirty (30) days. Billing
          records are kept for ten (10) years for accounting law compliance.
        </li>
        <li>
          <strong>Server logs</strong>: kept for ninety (90) days for
          incident-response purposes, then purged.
        </li>
      </ul>

      <h2>6. Your rights</h2>
      <p>Under GDPR you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you;</li>
        <li>Correct inaccurate data;</li>
        <li>Delete your account and personal data;</li>
        <li>Receive a copy of your data in a portable format;</li>
        <li>
          Object to or restrict certain processing activities (where
          applicable);
        </li>
        <li>
          Lodge a complaint with the CNIL (the French data-protection
          authority) at{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            cnil.fr
          </a>
          .
        </li>
      </ul>
      <p>
        To exercise any of these rights, email{" "}
        <a href="mailto:hello@wavloops.co">hello@wavloops.co</a> from the
        address linked to your account. We respond within thirty (30) days.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Some sub-processors operate outside the European Economic Area. When
        data is transferred, we rely on the Standard Contractual Clauses
        approved by the European Commission as a transfer mechanism.
      </p>

      <h2>8. Children</h2>
      <p>
        Wavloops is not intended for children under 16. We do not knowingly
        collect data from anyone below that age. If you believe a minor has
        opened an account, write to{" "}
        <a href="mailto:hello@wavloops.co">hello@wavloops.co</a> and we will
        remove it.
      </p>

      <h2>9. Cookies</h2>
      <p>
        See the dedicated <a href="/legal/cookies">Cookie Policy</a> for the
        complete list and your control over them.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        Material changes will be announced by email or a prominent in-app
        notice at least seven (7) days before they take effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions:{" "}
        <a href="mailto:hello@wavloops.co">hello@wavloops.co</a>.
      </p>
    </LegalShell>
  );
}
