import { Badge, buttonVariants, Card, CardHeader, CardTitle } from '@micropreneur/elements'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check, GitFork, Minus } from 'lucide-react'

import { MarketingPageHero, MarketingPageShell } from '../components/marketing-page-shell'
import { publicPageHead } from '../lib/seo'

const included = [
  'TanStack Start app for Cloudflare Workers',
  'D1 schema and one personal workspace',
  'Provider-neutral authentication port',
  'Complete one-plan billing engine, off by default',
  'Source-owned Elements registry',
  'Docs, agent instructions, and focused checks',
] as const

const outsideFreeStarter = [
  'Managed hosting or provider fees',
  'Multiple workspaces, invitations, or roles',
  'Workspace billing or seat billing',
  'Premium component source',
  'Customer vanity domains',
  'A support SLA or launch consulting',
] as const

export const Route = createFileRoute('/pricing')({
  head: () =>
    publicPageHead({
      description:
        'Micropreneur Starter costs $0 under the MIT license. See what the public single-user SaaS foundation includes and where its scope ends.',
      path: '/pricing',
      title: 'Pricing',
    }),
  component: PricingPage,
})

function PricingPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        description="The public Starter repository costs nothing to use, change, or ship under the MIT license. You still own your hosting and provider bills."
        eyebrow="Pricing"
        title={
          <>
            What does Starter cost<span className="text-accent">?</span>
          </>
        }
      >
        <a
          className={buttonVariants({ size: 'lg' })}
          href="https://github.com/micropreneur/starter"
          rel="noreferrer"
          target="_blank"
        >
          <GitFork data-icon="inline-start" />
          Fork on GitHub
        </a>
        <Link className={buttonVariants({ size: 'lg', variant: 'outline' })} to="/faq">
          Read the FAQ
        </Link>
      </MarketingPageHero>

      <section className="mx-3 overflow-hidden rounded-3xl border bg-muted/20 sm:mx-6">
        <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
          <div className="flex min-h-80 flex-col justify-between border-b p-8 lg:border-r lg:border-b-0 lg:p-12">
            <Badge className="bg-background" variant="outline">
              MIT licensed
            </Badge>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                One public repository
              </p>
              <p className="mt-2 text-8xl leading-none font-semibold tracking-[-0.07em] sm:text-9xl">
                $0
              </p>
              <p className="mt-3 text-sm text-muted-foreground">No purchase or license key.</p>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <h2 className="text-3xl font-semibold tracking-[-0.035em]">
              What the repository includes
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {included.map((item) => (
                <li className="flex items-start gap-3 text-sm" key={item}>
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              The boundary matters
            </p>
            <h2 className="mt-4 max-w-md text-4xl leading-tight font-semibold tracking-[-0.04em]">
              Free Starter stays focused on one owner.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Teams change the data model, permissions, and billing model. This repository leaves
              that code out instead of hiding it behind a license check.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {outsideFreeStarter.map((item) => (
              <Card key={item}>
                <CardHeader className="grid-cols-[auto_1fr] items-center gap-3">
                  <Minus aria-hidden="true" className="size-4 text-muted-foreground" />
                  <CardTitle>{item}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="dark mx-3 mb-3 rounded-3xl bg-background px-6 py-16 text-foreground sm:mx-6 sm:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Your costs</p>
            <h2 className="mt-4 max-w-2xl text-4xl leading-tight font-semibold tracking-[-0.04em]">
              Bring the providers your product needs.
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Cloudflare, email, payment processing, domains, and other services bill you under
              their own terms. Starter does not resell or bundle them.
            </p>
          </div>
          <a
            className={buttonVariants({ size: 'lg' })}
            href="https://github.com/micropreneur/starter#quickstart"
            rel="noreferrer"
            target="_blank"
          >
            Read the quickstart
            <ArrowRight data-icon="inline-end" />
          </a>
        </div>
      </section>
    </MarketingPageShell>
  )
}
