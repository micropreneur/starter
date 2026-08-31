import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@micropreneur/elements'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check, FileText, ShieldCheck } from 'lucide-react'

import { LegalTemplateNotice } from '../components/legal-document'
import { MarketingPageHero, MarketingPageShell } from '../components/marketing-page-shell'
import { publicPageHead } from '../lib/seo'

const launchChecklist = [
  'Name the legal entity that operates the product.',
  'Use a monitored privacy and support email address.',
  'List the providers that receive customer data.',
  'Match retention and deletion claims to working product behavior.',
  'Describe billing, refunds, and cancellation as they actually work.',
  'Set the governing law and required regional notices.',
] as const

export const Route = createFileRoute('/legal')({
  head: () =>
    publicPageHead({
      description:
        'Customizable privacy and terms templates for a Micropreneur Starter fork, with a concrete checklist for replacing placeholders before launch.',
      path: '/legal',
      title: 'Legal templates',
    }),
  component: LegalIndexPage,
})

function LegalIndexPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        description="Starter includes a visible place to draft your privacy policy and terms. It does not decide what your company promises or what your jurisdiction requires."
        eyebrow="Legal"
        title={
          <>
            What must I replace before launch<span className="text-accent">?</span>
          </>
        }
      />

      <LegalTemplateNotice />

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="[--card-spacing:--spacing(6)]">
            <CardHeader>
              <span className="flex size-11 items-center justify-center rounded-xl border bg-muted/30">
                <ShieldCheck aria-hidden="true" className="size-5 text-accent" />
              </span>
              <Badge className="mt-5" variant="outline">
                Data practices
              </Badge>
              <CardTitle className="mt-2 text-2xl tracking-[-0.025em]">
                Privacy policy template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="max-w-lg text-sm leading-7 text-muted-foreground">
                Draft what data the product collects, why it is used, which providers receive it,
                how long it stays, and how a customer can make a request.
              </p>
              <Link className={`${buttonVariants({ variant: 'outline' })} mt-6`} to="/privacy">
                Review privacy template
                <ArrowRight data-icon="inline-end" />
              </Link>
            </CardContent>
          </Card>

          <Card className="[--card-spacing:--spacing(6)]">
            <CardHeader>
              <span className="flex size-11 items-center justify-center rounded-xl border bg-muted/30">
                <FileText aria-hidden="true" className="size-5 text-accent" />
              </span>
              <Badge className="mt-5" variant="outline">
                Product rules
              </Badge>
              <CardTitle className="mt-2 text-2xl tracking-[-0.025em]">Terms template</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="max-w-lg text-sm leading-7 text-muted-foreground">
                Draft who may use the product, what an account owner must do, how billing and
                cancellation work, and which limits apply.
              </p>
              <Link className={`${buttonVariants({ variant: 'outline' })} mt-6`} to="/terms">
                Review terms template
                <ArrowRight data-icon="inline-end" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="dark mx-3 mb-3 rounded-3xl bg-background px-6 py-16 text-foreground sm:mx-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Before publishing
            </p>
            <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.04em]">
              Make the words match the product.
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {launchChecklist.map((item) => (
              <li className="flex items-start gap-3 text-sm text-muted-foreground" key={item}>
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingPageShell>
  )
}
