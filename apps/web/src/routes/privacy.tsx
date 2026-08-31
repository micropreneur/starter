import { createFileRoute } from '@tanstack/react-router'

import { LegalDocument, LegalSection, LegalTemplateNotice } from '../components/legal-document'
import { MarketingPageHero, MarketingPageShell } from '../components/marketing-page-shell'
import { siteConfig } from '../config/site'
import { legalTemplatePageHead } from '../lib/seo'

export const Route = createFileRoute('/privacy')({
  head: () =>
    legalTemplatePageHead({
      description: `A clearly labeled, customizable privacy policy template for products forked from ${siteConfig.name}. Replace it and obtain legal review before launch.`,
      path: '/privacy',
      title: 'Privacy policy template',
    }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        description="This starter draft names the common questions a privacy policy should answer. It is not a finished policy for your company or product."
        eyebrow="Privacy template"
        title={
          <>
            How does this starter describe data use<span className="text-accent">?</span>
          </>
        }
      />

      <LegalTemplateNotice />

      <LegalDocument>
        <LegalSection title="1. Who operates the product">
          <p>
            [Company legal name] operates [Product name]. In this policy, "we," "us," and "our"
            refer to [Company legal name]. This policy explains how we handle personal information
            when you use [Product URL] and the related product.
          </p>
        </LegalSection>

        <LegalSection title="2. Information we collect">
          <p>Replace this list with the data your deployed product actually collects.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Account details, such as name, email address, and authentication records.</li>
            <li>Workspace and product content that a customer submits.</li>
            <li>
              Billing records from [Payment processor]. Do not claim to store full payment card
              numbers unless your system does.
            </li>
            <li>
              Technical records, such as IP address, device details, request logs, and security
              events.
            </li>
            <li>Messages sent to [Support email].</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. How we use information">
          <p>Describe each real purpose. A typical product may use information to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Create and secure an account.</li>
            <li>Provide the product and save customer content.</li>
            <li>Process subscriptions, entitlements, and billing events.</li>
            <li>Send service messages and answer support requests.</li>
            <li>Find abuse, investigate failures, and meet legal obligations.</li>
          </ul>
          <p>[Add the legal bases required for the regions where you operate.]</p>
        </LegalSection>

        <LegalSection title="4. Providers and disclosures">
          <p>
            List every provider that receives personal information and explain its job. The default
            Starter seams may connect to Cloudflare, [Authentication provider], [Email provider],
            and [Payment processor], but your deployed configuration is the authority.
          </p>
          <p>
            State when you disclose information for legal requests, business transfers, fraud
            prevention, or with a customer's direction. Do not say that you sell or do not sell
            information until you have checked your actual advertising and analytics practices.
          </p>
        </LegalSection>

        <LegalSection title="5. Retention and deletion">
          <p>
            [State how long account, content, billing, support, and security records remain.] Match
            this section to the product's account deletion behavior, backups, tax records, and any
            legal holds.
          </p>
        </LegalSection>

        <LegalSection title="6. Security">
          <p>
            Describe the controls you operate without promising perfect security. Include a method
            for reporting a suspected security issue to [Security email].
          </p>
        </LegalSection>

        <LegalSection title="7. Your choices and rights">
          <p>
            Explain how a customer can access, correct, export, or delete information. Add the
            region-specific rights, appeal process, identity checks, and authorized-agent rules that
            apply to [Company legal name].
          </p>
        </LegalSection>

        <LegalSection title="8. International use and age limits">
          <p>
            [Describe cross-border transfers and safeguards.] State the minimum user age and what
            happens if you learn that the product received information from someone below that age.
          </p>
        </LegalSection>

        <LegalSection title="9. Changes and contact">
          <p>
            Explain how customers will learn about material policy changes. Questions or privacy
            requests may be sent to [Privacy email] or [Company mailing address].
          </p>
        </LegalSection>
      </LegalDocument>
    </MarketingPageShell>
  )
}
