import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Refund Policy — Wavloops",
};

export default function RefundsPage() {
  return (
    <LegalShell title="Refund Policy" lastUpdated="June 21, 2026">
      <h2>1. General policy</h2>
      <p>
        Wavloops is a digital service whose features are delivered
        immediately on purchase. In line with article L221-28-13° of the
        French Consumer Code, by purchasing a paid plan you{" "}
        <strong>waive your right of withdrawal</strong> and we do not issue
        refunds for digital plans once they have been activated.
      </p>

      <div className="legal-callout">
        <strong>In short.</strong> One-time payments (Lifetime) and active
        subscription periods (Pro Monthly, Pro Yearly) are non-refundable.
        You can cancel a subscription at any time to stop further charges.
      </div>

      <h2>2. Cancelling a Pro subscription</h2>
      <p>
        Pro subscriptions can be cancelled at any time from{" "}
        <strong>Settings → Billing → Manage subscription</strong>, which
        opens the Stripe customer portal. Cancellation takes effect at the
        end of the current billing cycle:
      </p>
      <ul>
        <li>
          <strong>Pro Monthly</strong>: you keep Pro features until the end
          of the paid month, then revert to Free.
        </li>
        <li>
          <strong>Pro Yearly</strong>: you keep Pro features until the end
          of the paid year, then revert to Free.
        </li>
      </ul>
      <p>
        Partial periods are not refunded. We do not charge for the
        cancellation itself.
      </p>

      <h2>3. Lifetime plan</h2>
      <p>
        Lifetime is a single payment with no recurring billing. Once it is
        activated, the corresponding access stays attached to your account
        permanently. We do not refund Lifetime purchases, including in the
        event that you close the account.
      </p>

      <h2>4. Exceptional refunds</h2>
      <p>
        We may issue a partial or full refund, at our sole discretion, in
        the following narrow cases:
      </p>
      <ul>
        <li>
          A duplicate charge caused by a technical issue on our side or
          Stripe&apos;s.
        </li>
        <li>
          A clear billing error (e.g. a higher amount than the published
          price).
        </li>
        <li>
          A long-running outage that prevented you from using a paid plan
          for an extended period and was acknowledged in writing.
        </li>
      </ul>
      <p>
        These cases are reviewed case by case. Submitting a request does not
        guarantee a refund.
      </p>

      <h2>5. How to request a refund</h2>
      <p>
        Write to <a href="mailto:hello@wavloops.co">hello@wavloops.co</a>{" "}
        from the email address linked to your account, with the receipt or
        Stripe invoice reference and a short description of the issue. We
        respond within fourteen (14) days. Approved refunds are processed
        back to the original payment method.
      </p>

      <h2>6. Chargebacks</h2>
      <p>
        Please contact us first. Filing a chargeback before contacting{" "}
        <a href="mailto:hello@wavloops.co">hello@wavloops.co</a> may result
        in immediate suspension of your account while the dispute is
        investigated.
      </p>

      <h2>7. Changes to this policy</h2>
      <p>
        Material changes will be announced at least seven (7) days in
        advance. Purchases made before the change remain governed by the
        policy in force on the purchase date.
      </p>
    </LegalShell>
  );
}
