import { createFileRoute } from '@tanstack/react-router'

import { LegalDocument, LegalSection, LegalTemplateNotice } from '../components/legal-document'
import { MarketingPageHero, MarketingPageShell } from '../components/marketing-page-shell'
import { legalTemplatePageHead } from '../lib/seo'

export const Route = createFileRoute('/terms')({
  head: () =>
    legalTemplatePageHead({
      description:
        'A clearly labeled, customizable terms of service template for products forked from Micropreneur Starter. Replace it and obtain legal review before launch.',
      path: '/terms',
      title: 'Terms of service template',
    }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        description="This starter draft lays out the product decisions your terms should state. It does not create terms for your company by itself."
        eyebrow="Terms template"
        title={
          <>
            What rules should govern your product<span className="text-accent">?</span>
          </>
        }
      />

      <LegalTemplateNotice />

      <LegalDocument>
        <LegalSection title="1. Agreement and provider">
          <p>
            These terms govern access to [Product name], provided by [Company legal name] at
            [Product URL]. By creating an account or using the product, you agree to these terms. If
            you use the product for an organization, state whether you have authority to bind it.
          </p>
        </LegalSection>

        <LegalSection title="2. Eligibility and accounts">
          <p>
            [Set the minimum user age and any location restrictions.] Customers must provide
            accurate account details, protect their credentials, and tell [Support email] about
            suspected unauthorized access.
          </p>
        </LegalSection>

        <LegalSection title="3. The product">
          <p>
            Describe the service a customer receives, the plans you sell, and any limits that
            matter. Free Starter models one personal workspace. Do not promise team accounts,
            uptime, storage, or support that your fork does not provide.
          </p>
        </LegalSection>

        <LegalSection title="4. Customer content">
          <p>
            State that customers retain ownership of their content. Add the limited license needed
            for [Company legal name] and its providers to host, process, transmit, and display that
            content only to operate the product.
          </p>
          <p>
            The customer must have the rights needed to submit content and remains responsible for
            its legality, accuracy, and backups.
          </p>
        </LegalSection>

        <LegalSection title="5. Acceptable use">
          <p>Tailor this list to the risks of your product. A customer may not:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Break the law or violate another person's rights.</li>
            <li>Upload malware or interfere with the product or another account.</li>
            <li>Probe security controls without written permission.</li>
            <li>Use the product to send spam, abuse, or deceptive content.</li>
            <li>Resell access unless a written order allows it.</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Billing, cancellation, and refunds">
          <p>
            [State the price, billing interval, taxes, trial rules, renewal behavior, cancellation
            timing, refund policy, and what happens after cancellation.] Match this language to the
            checkout and customer portal you have tested in production.
          </p>
        </LegalSection>

        <LegalSection title="7. Suspension and termination">
          <p>
            Explain when the customer may close an account and when [Company legal name] may suspend
            or terminate access. State what happens to customer content and how long export or
            deletion remains available.
          </p>
        </LegalSection>

        <LegalSection title="8. Ownership and feedback">
          <p>
            Identify what [Company legal name] owns, including the product name and original product
            code. Preserve third-party and open-source licenses. If you accept feedback, state the
            rights needed to use it.
          </p>
        </LegalSection>

        <LegalSection title="9. Disclaimers and liability">
          <p>
            [Have qualified counsel draft the warranty disclaimer, liability cap, excluded damages,
            indemnity, and region-specific exceptions.] These clauses depend on your product,
            customers, insurance, and governing law.
          </p>
        </LegalSection>

        <LegalSection title="10. General terms and contact">
          <p>
            [Set the governing law, venue, dispute process, assignment rules, notices, severability,
            waiver, and order of precedence.] Explain how customers will learn about material
            changes. Questions may be sent to [Legal email] or [Company mailing address].
          </p>
        </LegalSection>
      </LegalDocument>
    </MarketingPageShell>
  )
}
