import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@micropreneur/elements'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Blocks,
  Bot,
  Braces,
  Check,
  Cloud,
  Code2,
  GitFork,
  Layers3,
  type LucideIcon,
  PackageOpen,
  RefreshCcw,
  Rocket,
  ShieldCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { ScrollStory } from '../components/scroll-story'
import { SiteFooter } from '../components/site-footer'
import { StackShowcase } from '../components/stack-showcase'
import { getCurrentUser } from '../lib/auth.functions'
import { type BlogPostSummary, getBlogPostSummaries } from '../lib/blog-metadata'

export const Route = createFileRoute('/')({
  loader: () => getCurrentUser(),
  component: Home,
})

const foundationFeatures = [
  {
    icon: Rocket,
    title: 'Fork-and-go',
    description: 'Clone once, rename the project, and start building the domain that matters.',
  },
  {
    icon: Cloud,
    title: 'Cloudflare native',
    description: 'Workers, D1, and Durable Objects are wired for a fast local-to-edge loop.',
  },
  {
    icon: ShieldCheck,
    title: 'Swappable auth',
    description: 'App code talks to AuthPort, never directly to a provider SDK.',
  },
  {
    icon: PackageOpen,
    title: 'Source-owned UI',
    description: 'Install free elements through the shadcn registry and own every line.',
  },
  {
    icon: Bot,
    title: 'Agent-readable',
    description: 'AGENTS.md, skills, MCP, and llms.txt give coding agents the same map.',
  },
  {
    icon: RefreshCcw,
    title: 'Fast feedback',
    description: 'Typed seams and deterministic checks keep every iteration short and trustworthy.',
  },
] satisfies Array<{ icon: LucideIcon; title: string; description: string }>

const blogCategoryIcons = {
  Architecture: ShieldCheck,
  'Developer experience': Bot,
  Interface: PackageOpen,
} satisfies Record<BlogPostSummary['category'], LucideIcon>

function Home() {
  const user = Route.useLoaderData()
  const starterBlogPosts = getBlogPostSummaries().slice(0, 3)

  return (
    <main className="overflow-x-clip">
      <div className="mx-auto w-full max-w-7xl border-x border-border/60">
        <section className="flex flex-col items-center px-6 pt-20 pb-16 text-center sm:pt-24 sm:pb-20">
          <StatusBadge>Public, MIT-licensed SaaS foundation</StatusBadge>
          <h1 className="mt-7 max-w-[15ch] text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Build the product<span className="text-accent">.</span>
            <br />
            Keep your freedom<span className="text-accent">.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Micropreneur Starter is a fork-and-go Cloudflare foundation for paid, single-user SaaS—
            source-owned, agent-readable, and ready to customize. Its complete one-plan Stripe
            engine stays off until you choose to activate it.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <TechNote icon={Code2}>Strict TypeScript</TechNote>
            <TechNote icon={Cloud}>Built for Cloudflare</TechNote>
            <TechNote icon={Bot}>Ready for agents</TechNote>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              className={buttonVariants({ size: 'lg' })}
              href="https://github.com/micropreneur/starter"
              rel="noreferrer"
              target="_blank"
            >
              <GitFork data-icon="inline-start" />
              Fork on GitHub
              <ArrowRight data-icon="inline-end" />
            </a>
            {user ? (
              <Link className={buttonVariants({ size: 'lg', variant: 'outline' })} to="/app">
                Open your dashboard
              </Link>
            ) : (
              <Link className={buttonVariants({ size: 'lg', variant: 'outline' })} to="/sign-up">
                Create your workspace
              </Link>
            )}
          </div>
        </section>

        <StackShowcase />

        <section
          className="dark mx-3 rounded-3xl bg-background px-6 py-20 text-foreground sm:mx-6 sm:px-10 sm:py-24 lg:px-16"
          id="foundation"
        >
          <SectionIntro
            description="The common, expensive decisions are made. The product-specific decisions are still yours."
            eyebrow="Inside the foundation"
            title="Everything your next micro SaaS needs to begin"
          />

          <div className="mt-12 grid border-t border-l border-border/70 md:grid-cols-2 lg:grid-cols-3">
            {foundationFeatures.map((feature) => (
              <article
                className="border-r border-b border-border/70 p-6 sm:p-8"
                key={feature.title}
              >
                <feature.icon className="size-5 text-accent" />
                <h3 className="mt-5 text-sm font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="grid gap-12 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-16"
          id="agents"
        >
          <div className="max-w-xl">
            <SectionEyebrow>Local feedback loop</SectionEyebrow>
            <h2 className="mt-5 text-balance text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">
              One command from confidence<span className="text-accent">.</span>
            </h2>
            <p className="mt-5 text-pretty text-muted-foreground">
              The repository teaches humans and coding agents how to work here, then gives both the
              same deterministic checks. No tribal knowledge, no mystery scripts.
            </p>
            <ul className="mt-7 grid gap-3 text-sm">
              {[
                'Focused package checks while you iterate',
                'One root gate before every handoff',
                'AGENTS.md, symlinked skills, MCP, and llms.txt',
              ].map((item) => (
                <li className="flex items-center gap-2" key={item}>
                  <Check className="size-4 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Card className="[--card-spacing:--spacing(5)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-sm">
                <Braces className="size-4 text-accent" />
                terminal
              </CardTitle>
              <CardDescription>
                Short loops locally. Full confidence before handoff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-5 font-mono text-xs leading-7 sm:text-sm">
                <code>{`$ pnpm install
$ pnpm --filter web dev

# when the slice is ready
$ pnpm turbo typecheck lint build test

✓ all workspace tasks successful`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        <ScrollStory />

        <section
          className="relative z-10 -mt-10 rounded-t-3xl border-y border-border/70 bg-background px-6 py-24 motion-reduce:mt-0 motion-reduce:rounded-none sm:-mt-16 sm:px-10 sm:py-32"
          id="elements"
        >
          <SectionIntro
            description="The free elements tier arrives as source through a shadcn registry, so every fork owns and evolves its interface."
            eyebrow="Source-owned components"
            title="A UI foundation you can actually change"
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ElementCard
              description="Accessible primitives built on Base UI."
              icon={Layers3}
              title="Base components"
            />
            <ElementCard
              description="Small reusable objects for real product states."
              icon={Blocks}
              title="Free elements"
            />
            <ElementCard
              description="Installable source with machine-readable metadata."
              icon={PackageOpen}
              title="shadcn registry"
            />
            <ElementCard
              description="Search and discover components from coding agents."
              icon={Bot}
              title="MCP discovery"
            />
          </div>

          <div className="mt-10 flex justify-center">
            <a
              className={buttonVariants({ variant: 'outline' })}
              href="https://github.com/micropreneur/starter/tree/main/packages/elements"
              rel="noreferrer"
              target="_blank"
            >
              Browse free elements
              <ArrowRight data-icon="inline-end" />
            </a>
          </div>
        </section>

        <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16" id="blog">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <SectionEyebrow>Blog</SectionEyebrow>
              <h2 className="mt-5 max-w-2xl text-balance text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">
                Notes for building smaller, sharper software
                <span className="text-accent">.</span>
              </h2>
            </div>
            <p className="max-w-xl text-pretty text-muted-foreground lg:justify-self-end">
              Architecture decisions, local workflows, and source-owned interface patterns from the
              public Starter repository.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {starterBlogPosts.map((post) => {
              const Icon = blogCategoryIcons[post.category]

              return (
                <Link
                  className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  key={post.slug}
                  params={{ slug: post.slug }}
                  to="/blog/$slug"
                >
                  <Card className="h-full pb-0 transition-colors group-hover:bg-muted/30">
                    <CardHeader>
                      <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
                        <Icon className="size-4 text-accent" />
                      </span>
                      <CardDescription className="mt-4 font-mono text-xs uppercase tracking-wider">
                        {post.category}
                      </CardDescription>
                      <CardTitle className="text-xl leading-snug">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{post.description}</p>
                    </CardContent>
                    <CardFooter className="mt-auto">
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        Read the note
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <section
          className="relative mx-3 mb-3 grid gap-10 overflow-hidden rounded-3xl border bg-muted/30 px-6 py-20 sm:mx-6 sm:px-10 sm:py-24 lg:grid-cols-[1fr_28rem] lg:items-center lg:px-16"
          id="get-started"
        >
          <div className="max-w-2xl">
            <SectionEyebrow>Ready when the idea is</SectionEyebrow>
            <h2 className="mt-5 text-balance text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">
              Fork it. Name it. Ship it<span className="text-accent">.</span>
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-muted-foreground">
              Build a smaller business without rebuilding the same foundation. Start open source,
              keep the seams clean, and make the product unmistakably yours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link className={buttonVariants({ size: 'lg' })} to="/app">
                  Open your dashboard
                  <ArrowRight data-icon="inline-end" />
                </Link>
              ) : (
                <Link className={buttonVariants({ size: 'lg' })} to="/sign-up">
                  Create an account
                  <ArrowRight data-icon="inline-end" />
                </Link>
              )}
              {user ? (
                <a
                  className={buttonVariants({ size: 'lg', variant: 'outline' })}
                  href="https://github.com/micropreneur/starter#quickstart"
                  rel="noreferrer"
                  target="_blank"
                >
                  Read the quickstart
                </a>
              ) : (
                <Link className={buttonVariants({ size: 'lg', variant: 'outline' })} to="/sign-in">
                  Sign in
                </Link>
              )}
            </div>
          </div>

          <div className="relative min-h-[25rem] pt-20 sm:pt-24">
            <div
              aria-hidden="true"
              className="absolute inset-x-2 top-2 overflow-hidden rounded-xl border bg-background opacity-75 -rotate-2 motion-safe:animate-[cta-preview-drift_9s_ease-in-out_infinite]"
              data-testid="cta-preview"
            >
              <img
                alt=""
                className="block h-auto w-full"
                height={820}
                loading="lazy"
                src="/landing/dashboard-preview.jpg"
                width={1440}
              />
            </div>

            <Card className="relative ml-auto max-w-sm" clipped>
              <CardHeader className="border-b">
                <CardDescription className="font-mono text-xs uppercase tracking-wider">
                  First session
                </CardDescription>
                <CardTitle>A useful workspace from minute one</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 pt-5 text-sm text-muted-foreground">
                {[
                  'Name the workspace',
                  'Choose the product shape',
                  'Set the first activation goal',
                ].map((step, index) => (
                  <div className="flex items-center gap-3" key={step}>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-background font-mono text-[0.6875rem] text-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  )
}

function TechNote({ children, icon: Icon }: { children: ReactNode; icon: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="size-4 text-accent" />
      {children}
    </span>
  )
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <Badge variant="outline">{children}</Badge>
}

function SectionIntro({
  description,
  eyebrow,
  title,
}: {
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-5 text-balance text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">{description}</p>
    </div>
  )
}

function ElementCard({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
          <Icon className="size-4 text-accent" />
        </span>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
