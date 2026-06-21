import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Legal Notice — Wavloops",
};

export default function LegalNoticePage() {
  return (
    <LegalShell title="Legal Notice · Mentions légales" lastUpdated="June 21, 2026">
      <p>
        In accordance with article 6 of the French law n° 2004-575 of June
        21, 2004 for confidence in the digital economy (LCEN), the editor
        of the wavloops.co website provides the following information to
        its visitors.
      </p>

      <h2>1. Editor of the website</h2>
      <ul>
        <li><strong>Business name</strong> — VITRUVE STUDIO</li>
        <li><strong>Director of publication</strong> — Théo Gherbi</li>
        <li><strong>Address</strong> — 33 Rue Hippolyte Rouquette, 34800 Clermont-l&apos;Hérault, France</li>
        <li><strong>SIREN</strong> — 884 465 089</li>
        <li><strong>SIRET</strong> (head office) — 884 465 089 00024</li>
        <li><strong>VAT number</strong> — FR49884465089</li>
        <li><strong>Email</strong> — <a href="mailto:hello@wavloops.co">hello@wavloops.co</a></li>
      </ul>

      <h2>2. Hosting</h2>
      <p>The wavloops.co website is hosted by:</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> — 440 N Barranca Ave #4133, Covina,
          CA 91723, United States.{" "}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com/legal/privacy-policy
          </a>
        </li>
      </ul>
      <p>Database and storage are provided by:</p>
      <ul>
        <li>
          <strong>Supabase Inc.</strong> — 970 Toa Payoh North, #07-04,
          Singapore 318992 (EU region operated within the European Union).{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            supabase.com/privacy
          </a>
        </li>
      </ul>

      <h2>3. Intellectual property</h2>
      <p>
        The Wavloops platform — its source code, design, logos, copy, and
        in-app illustrations — is the exclusive property of Vitruve, except
        for third-party assets credited where applicable. Any reproduction,
        representation, or distribution, in whole or in part, without
        Vitruve&apos;s prior written consent is prohibited and may
        constitute an infringement under articles L.335-2 and L.335-3 of
        the French Intellectual Property Code.
      </p>
      <p>
        <strong>User content.</strong> Producers retain ownership of every
        beat, cover, server name, and contact record they upload or create.
        See our <a href="/legal/terms">Terms of Service</a>, section 5, for
        the limited operating licence we receive to deliver the Service.
      </p>

      <h2>4. Personal data</h2>
      <p>
        Personal-data processing on Wavloops is described in detail on our{" "}
        <a href="/legal/privacy">Privacy Policy</a>. The data controller is
        Vitruve, reachable at{" "}
        <a href="mailto:hello@wavloops.co">hello@wavloops.co</a>.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Cookies set by Wavloops are listed on the{" "}
        <a href="/legal/cookies">Cookie Policy</a>.
      </p>

      <h2>6. Applicable law and jurisdiction</h2>
      <p>
        These notices and the Wavloops website in general are governed by
        French law. Any dispute will be brought before the competent French
        courts, unless consumer-protection law assigns a different
        jurisdiction.
      </p>

      <h2>7. Contact</h2>
      <p>
        For any question related to this notice or the Service:{" "}
        <a href="mailto:hello@wavloops.co">hello@wavloops.co</a>.
      </p>
    </LegalShell>
  );
}
