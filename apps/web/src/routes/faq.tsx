import { buttonVariants } from '@micropreneur/elements'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@micropreneur/elements/primitives'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, ChevronDown } from 'lucide-react'

import { MarketingPageHero, MarketingPageShell } from '../components/marketing-page-shell'
import { publicPageHead } from '../lib/seo'

const questions = [
  {
    answer:
      'Yes. The public repository uses the MIT license. You may use it for commercial products, change it, and distribute your fork under the license terms.',
    question: 'Is Micropreneur Starter free for commercial use?',
  },
  {
    answer:
      'No. Starter is source code you fork and operate. You choose the Cloudflare account, domain, email provider, and payment provider for your product.',
    question: 'Is Starter a hosted SaaS product?',
  },
  {
    answer:
      'A single-user paid SaaS is the intended example. The repository includes one personal workspace, authentication, a complete one-plan billing engine that stays off by default, entitlements, email, and a removable Operations Registry domain.',
    question: 'What product shape does the free repository support?',
  },
  {
    answer:
      'No. Multiple workspaces, invitations, team management, roles, ownership transfer, and seat billing belong outside Free Starter. Add them only after your data and billing models are workspace-scoped.',
    question: 'Does Free Starter include teams or multiple workspaces?',
  },
  {
    answer:
      'Yes. Application code talks to AuthPort. Better Auth is the default adapter, while Descope is a typed, unimplemented seam. A new provider belongs behind the same port.',
    question: 'Can I replace the authentication provider?',
  },
  {
    answer:
      'Node 22 or newer and pnpm are enough for the local app loop. A deployed product needs a Cloudflare account and the provider credentials for the adapters you choose to enable.',
    question: 'What do I need to run it?',
  },
  {
    answer:
      'The repository includes AGENTS.md files, focused skills, generated llms files, and an MCP discovery server. They give coding agents the same ownership map and validation commands used by human contributors.',
    question: 'What does agent-readable mean here?',
  },
  {
    answer:
      'No. The privacy and terms pages are starter templates with visible placeholders. Replace them for your company and product, then ask qualified counsel to review the result before launch.',
    question: 'Can I publish the included legal pages unchanged?',
  },
] as const

export const Route = createFileRoute('/faq')({
  head: () =>
    publicPageHead({
      description:
        'Answers about the Micropreneur Starter license, hosting model, product scope, auth seam, local requirements, and customizable legal templates.',
      path: '/faq',
      title: 'FAQ',
    }),
  component: FaqPage,
})

function FaqPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        description="Starter is source code, not a hosted shortcut. These are the decisions worth knowing before you build on it."
        eyebrow="FAQ"
        title={
          <>
            What should I know before I fork<span className="text-accent">?</span>
          </>
        }
      />

      <section className="px-6 pb-24 sm:px-10 sm:pb-32 lg:px-16">
        <div className="mx-auto max-w-4xl border-t border-border/70">
          {questions.map((item, index) => (
            <Collapsible className="border-b border-border/70" key={item.question}>
              <CollapsibleTrigger className="group flex w-full items-start gap-5 py-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:py-8">
                <span className="mt-1 font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-lg font-medium sm:text-xl">{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-7 pl-10 sm:pb-9">
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {item.answer}
                </p>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>

      <section className="mx-3 mb-3 rounded-3xl border bg-muted/30 px-6 py-16 sm:mx-6 sm:px-10 lg:px-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em]">
              Ready to inspect the code?
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Read the architecture and local setup before you rename the product or connect live
              providers.
            </p>
          </div>
          <a
            className={buttonVariants({ size: 'lg' })}
            href="https://github.com/micropreneur/starter#quickstart"
            rel="noreferrer"
            target="_blank"
          >
            Open the quickstart
            <ArrowRight data-icon="inline-end" />
          </a>
        </div>
      </section>
    </MarketingPageShell>
  )
}
