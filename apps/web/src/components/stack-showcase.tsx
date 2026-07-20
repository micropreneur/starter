import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@micropreneur/elements'
import { cn } from '@micropreneur/ui/lib/utils'
import {
  Blocks,
  Cloud,
  Code2,
  Database,
  GitBranch,
  type LucideIcon,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const AUTOPLAY_DELAY_MS = 10_000

type StackSeam = {
  description: string
  eyebrow: string
  highlights: readonly string[]
  icon: LucideIcon
  id: 'auth' | 'data' | 'elements' | 'runtime'
  label: string
  preview:
    | {
        kind: 'dashboard'
      }
    | {
        badge: string
        code: string
        file: string
        kind: 'code'
        stats: readonly [string, string]
      }
  title: string
  value: string
}

const stackSeams = [
  {
    description:
      'The authenticated dashboard, Worker entrypoint, and local runtime are already connected, so the first run feels like a product instead of a wiring exercise.',
    eyebrow: 'Edge runtime',
    highlights: ['TanStack Start routes', 'Cloudflare Worker bindings', 'Durable Object seam'],
    icon: Cloud,
    id: 'runtime',
    label: 'Runtime',
    preview: {
      kind: 'dashboard',
    },
    title: 'A real app shell from the first run',
    value: 'TanStack Start + Workers',
  },
  {
    description:
      'Define a strict schema once, generate a migration, and use the same D1-backed data boundary locally and at the edge.',
    eyebrow: 'Owned data',
    highlights: ['Drizzle schema as source', 'Versioned SQL migrations', 'Local-first D1 workflow'],
    icon: Database,
    id: 'data',
    label: 'Data',
    preview: {
      badge: 'Migration ready',
      code: `export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull(),
})`,
      file: 'packages/db/src/schema.ts',
      kind: 'code',
      stats: ['D1', 'Drizzle'],
    },
    title: 'Your schema stays close to the product',
    value: 'D1 + Drizzle',
  },
  {
    description:
      'Application code speaks to one small port. Better Auth works out of the box, while Descope remains a clean adapter seam for the forks that need it.',
    eyebrow: 'Hexagonal auth',
    highlights: ['Provider-neutral app code', 'Better Auth by default', 'One env var to switch'],
    icon: ShieldCheck,
    id: 'auth',
    label: 'Auth',
    preview: {
      badge: 'Port resolved',
      code: `export interface AuthPort {
  getSession(request: Request): Promise<Session | null>
  requireUser(request: Request): Promise<User>
  signIn(input: SignInInput): Promise<Response>
  signOut(request: Request): Promise<Response>
}

createAuth(env.AUTH_PROVIDER ?? "betterauth")`,
      file: 'packages/auth/src/port.ts',
      kind: 'code',
      stats: ['Better Auth', 'Descope seam'],
    },
    title: 'Change providers, not your application',
    value: 'Better Auth + Descope seam',
  },
  {
    description:
      'The free component tier is delivered as installable source with registry metadata that humans, the shadcn CLI, and coding agents can all understand.',
    eyebrow: 'Source-owned UI',
    highlights: ['Base UI primitives', 'Free public registry', 'MCP component discovery'],
    icon: Blocks,
    id: 'elements',
    label: 'Elements',
    preview: {
      badge: 'Registry online',
      code: `$ pnpm --filter @micropreneur/elements registry:build

$ pnpm dlx shadcn@latest add \\
  http://localhost:4173/r/status-badge.json

✓ component source installed`,
      file: 'packages/elements/registry/free',
      kind: 'code',
      stats: ['shadcn CLI', 'Agent-readable'],
    },
    title: 'Install the source and make it yours',
    value: 'Free shadcn registry',
  },
] as const satisfies readonly StackSeam[]

export function StackShowcase() {
  const [activeId, setActiveId] = useState<StackSeam['id']>('runtime')
  const [isInView, setIsInView] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const autoplayPaused = isPaused || !isInView || prefersReducedMotion

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry?.isIntersecting ?? false),
      { threshold: 0.25 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (autoplayPaused) return

    const timeout = window.setTimeout(() => {
      const currentIndex = stackSeams.findIndex((seam) => seam.id === activeId)
      const nextSeam = stackSeams[(currentIndex + 1) % stackSeams.length]
      if (nextSeam) setActiveId(nextSeam.id)
    }, AUTOPLAY_DELAY_MS)

    return () => window.clearTimeout(timeout)
  }, [activeId, autoplayPaused])

  return (
    <section className="scroll-mt-24" id="stack" ref={sectionRef}>
      <Tabs
        className="gap-0"
        data-paused={autoplayPaused}
        onBlurCapture={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            setIsPaused(false)
          }
        }}
        onFocusCapture={() => setIsPaused(true)}
        onValueChange={(value) => {
          const seam = stackSeams.find((candidate) => candidate.id === value)
          if (seam) setActiveId(seam.id)
        }}
        value={activeId}
      >
        <TabsList
          aria-label="Explore the Starter stack"
          className="grid h-auto w-full grid-cols-2 overflow-hidden rounded-none border-t border-border/60 bg-transparent p-0 group-data-horizontal/tabs:h-auto lg:grid-cols-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {stackSeams.map((seam, index) => (
            <TabsTrigger
              className={cn(
                'group/tab relative h-auto min-w-0 justify-start rounded-none border-r border-b border-border/60 bg-background px-5 py-5 text-left data-active:bg-muted/40 data-active:shadow-none',
                index % 2 === 1 && 'border-r-0 lg:border-r',
                index === stackSeams.length - 1 && 'lg:border-r-0',
              )}
              key={seam.id}
              value={seam.id}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                <seam.icon className="size-4 text-muted-foreground group-data-active/tab:text-accent" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{seam.label}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {seam.value}
                </span>
              </span>
              {activeId === seam.id ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-0.5 bg-accent',
                    autoplayPaused
                      ? 'opacity-40'
                      : 'origin-left motion-safe:animate-[stack-progress_10000ms_linear_forwards]',
                  )}
                  data-progress=""
                />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {stackSeams.map((seam) => (
          <TabsContent
            className="data-active:animate-in data-active:fade-in data-active:slide-in-from-bottom-2 data-active:duration-500"
            key={seam.id}
            value={seam.id}
          >
            <div className="grid gap-10 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:px-16 lg:py-28">
              <div className="max-w-xl">
                <Badge variant="outline">{seam.eyebrow}</Badge>
                <h2 className="mt-5 text-balance text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">
                  {seam.title}
                  <span className="text-accent">.</span>
                </h2>
                <p className="mt-5 text-pretty text-muted-foreground">{seam.description}</p>
                <ul className="mt-7 grid gap-3 text-sm">
                  {seam.highlights.map((highlight) => (
                    <li className="flex items-center gap-2" key={highlight}>
                      <span className="flex size-5 items-center justify-center rounded-full border bg-muted/40">
                        <GitBranch className="size-3 text-accent" />
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <StackPreview seam={seam} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

function StackPreview({ seam }: { seam: StackSeam }) {
  if (seam.preview.kind === 'dashboard') {
    return (
      <Card className="[--card-spacing:--spacing(3)]">
        <CardHeader className="grid-cols-[1fr_auto] items-center border-b pb-3">
          <div>
            <CardTitle className="font-mono text-xs font-medium">micropreneur/starter</CardTitle>
            <CardDescription className="font-mono text-xs">apps/web · /app</CardDescription>
          </div>
          <Badge variant="outline">Live shell</Badge>
        </CardHeader>
        <CardContent className="-mb-(--card-spacing) overflow-hidden px-0">
          <img
            alt="Micropreneur Starter dashboard with reusable sidebar, metrics, and empty states"
            className="block h-auto w-full"
            height={820}
            loading="eager"
            src="/landing/dashboard-preview.jpg"
            width={1440}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="[--card-spacing:--spacing(4)]">
      <CardHeader className="grid-cols-[1fr_auto] items-center border-b pb-4">
        <div className="min-w-0">
          <CardTitle className="truncate font-mono text-xs font-medium">
            {seam.preview.file}
          </CardTitle>
          <CardDescription className="font-mono text-xs">starter seam</CardDescription>
        </div>
        <Badge variant="outline">{seam.preview.badge}</Badge>
      </CardHeader>
      <CardContent>
        <pre className="min-h-72 overflow-x-auto rounded-xl border bg-muted/40 p-5 font-mono text-xs leading-6 sm:text-sm">
          <code>{seam.preview.code}</code>
        </pre>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {seam.preview.stats.map((stat) => (
            <div className="rounded-lg border bg-background p-3" key={stat}>
              <Code2 className="size-4 text-accent" />
              <p className="mt-2 text-xs font-medium">{stat}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
