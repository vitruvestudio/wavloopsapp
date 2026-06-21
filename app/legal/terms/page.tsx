import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Terms of Service — Wavloops",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated="June 21, 2026">
      <h2>1. Acceptance</h2>
      <p>
        By creating an account or using <strong>Wavloops</strong> (the
        &ldquo;Service&rdquo;), you agree to these Terms of Service. If you do
        not agree, you may not use the Service.
      </p>
      <p>
        Wavloops is operated by <strong>VITRUVE STUDIO</strong> (SIREN
        884 465 089), registered in France. Throughout this document
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, and &ldquo;our&rdquo; refer to
        Vitruve Studio.
      </p>

      <h2>2. Your account</h2>
      <p>
        You must be at least 16 years old, or the age of digital consent in
        your country, to create an account. You are responsible for keeping
        your sign-in email secure and for any activity that happens under
        your account.
      </p>
      <p>
        You may close your account at any time from <strong>Settings →
        Account</strong>. Closing your account removes your servers, beats,
        contacts and analytics data within thirty (30) days.
      </p>

      <h2>3. Plans and billing</h2>
      <p>
        Wavloops offers three plans:
      </p>
      <ul>
        <li>
          <strong>Free</strong> — limited quotas (1 server, 15 beats, 25
          artists), MP3 uploads only, aggregated analytics. No payment
          required.
        </li>
        <li>
          <strong>Lifetime</strong> — single payment of 129 €. Three servers,
          150 beats, 500 artists, MP3 uploads, full per-artist tracking. No
          recurring billing.
        </li>
        <li>
          <strong>Pro</strong> — recurring subscription (12 €/month or
          99 €/year). Unlimited servers and beats, 1,000 artists, all audio
          formats supported, full per-artist tracking.
        </li>
      </ul>
      <p>
        Payments are processed by <a href="https://stripe.com">Stripe</a>. By
        upgrading you authorise the appropriate one-time or recurring charge
        on the card you provide.
      </p>
      <p>
        Subscription renewals are automatic at the end of each billing
        cycle. You can cancel at any time from <strong>Settings → Billing</strong>;
        cancellation takes effect at the end of the current cycle and is not
        prorated.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Upload audio or imagery you do not own the rights to share;</li>
        <li>
          Use Wavloops to distribute malware, illegal content, or content
          that infringes any third party&apos;s intellectual-property or
          privacy rights;
        </li>
        <li>
          Interfere with the Service, scrape its data outside the published
          API, or attempt to bypass its security or quota controls;
        </li>
        <li>Impersonate another person or misrepresent your affiliation;</li>
        <li>Resell the Service or rebrand it without our written consent.</li>
      </ul>
      <p>
        We may suspend or terminate any account that violates these rules,
        and remove any content that does, without notice when the issue is
        legal, with notice otherwise.
      </p>

      <h2>5. Content ownership</h2>
      <p>
        You retain full ownership of every beat, server cover, contact list
        and analytics record you upload or generate. We never claim a
        license over your audio.
      </p>
      <p>
        To operate the Service we need a limited, non-exclusive licence to
        store, transmit, transcode (e.g. waveform generation), and serve
        your content to the artists you have authorised. That licence ends
        when you delete the content or close your account.
      </p>

      <h2>6. Service availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted
        operation. Scheduled maintenance, third-party outages
        (<a href="https://supabase.com">Supabase</a>,
        <a href="https://vercel.com"> Vercel</a>, Stripe, your ISP) and force
        majeure events may degrade or interrupt the Service.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service and close your account at any time. We
        may suspend or terminate your access for a material breach of these
        Terms, or if continued operation becomes legally or technically
        impossible. On termination, the licence under section 5 ends.
      </p>

      <h2>8. Disclaimer & limitation of liability</h2>
      <p>
        The Service is provided <strong>&ldquo;as is&rdquo;</strong> and
        <strong> &ldquo;as available&rdquo;</strong>. To the maximum extent
        permitted by law, Vitruve disclaims all warranties (express or
        implied) and is not liable for indirect, incidental, special,
        consequential or punitive damages, nor for any loss of revenue,
        profits, data, goodwill, or business opportunities.
      </p>
      <p>
        Our aggregate liability under these Terms is capped at the greater of
        (a) the amount you have paid us in the twelve (12) months preceding
        the claim and (b) 100 €.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may amend these Terms to reflect product changes or legal
        requirements. Material changes will be announced by email or a
        prominent in-app notice at least seven (7) days before they take
        effect. Continued use after the effective date constitutes
        acceptance.
      </p>

      <h2>10. Governing law and dispute resolution</h2>
      <p>
        These Terms are governed by the laws of France. Any dispute will be
        submitted to the competent courts of the jurisdiction where the
        Editor is registered, except where consumer protection law assigns a
        different jurisdiction to you.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions or notices about these Terms should be sent to{" "}
        <a href="mailto:contact@wavloops.co">contact@wavloops.co</a>.
      </p>
    </LegalShell>
  );
}
