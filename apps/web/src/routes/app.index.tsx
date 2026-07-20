import {
  IndexLabel,
  LedgerList,
  LedgerRow,
  MarginNote,
  MilestoneMarker,
  Milestones,
  StatusBadge,
} from '@micropreneur/elements'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, ArrowUpRight, CircleCheck, Settings2, TableProperties } from 'lucide-react'

export const Route = createFileRoute('/app/')({
  component: DashboardPage,
})

const metrics = [
  { detail: 'Create your first registry record', label: 'Active records', value: '—' },
  { detail: 'Connect your first paid customer', label: 'Plan', value: 'Free' },
  { detail: 'Replace with your product signal', label: 'Primary metric', value: '—' },
]

const starterSections = [
  {
    description: 'A complete user-owned CRUD and filtering example.',
    icon: TableProperties,
    title: 'Operations Registry',
    to: '/app/registry' as const,
  },
  {
    description: 'Profile, sign-in methods, account lifecycle, and billing.',
    icon: Settings2,
    title: 'Settings',
    to: '/app/settings' as const,
  },
]

function DashboardPage() {
  const { user, workspace } = Route.useRouteContext()
  const firstName = user.name.trim().split(/\s+/)[0] || user.name

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
      <section className="grid gap-4 border-b border-border/70 pb-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <IndexLabel>{workspace.name}</IndexLabel>
            <StatusBadge status="positive">Ready</StatusBadge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Start with one product signal, one customer workflow, and one reason to upgrade.
          </p>
        </div>
        <MarginNote className="lg:justify-self-end">
          This shell is intentionally small. Keep the seams you need and remove the rest.
        </MarginNote>
      </section>

      <section
        aria-label="Product snapshot"
        className="overflow-hidden rounded-[8px_8px_2px_8px] border bg-card shadow-card"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <IndexLabel>Product snapshot</IndexLabel>
          <span className="font-mono text-[0.6875rem] text-muted-foreground">Today</span>
        </div>
        <dl className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {metrics.map((metric) => (
            <div className="px-3 py-3" key={metric.label}>
              <dt className="label-caps text-muted-foreground">{metric.label}</dt>
              <dd className="mt-1 font-mono text-2xl font-medium tracking-[-0.04em] tabular-nums">
                {metric.value}
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-lg border bg-card shadow-card">
          <header className="border-b px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium">Launch sequence</h2>
              <IndexLabel>03 steps</IndexLabel>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The shortest path from fork to a working paid product.
            </p>
          </header>
          <Milestones className="p-4">
            <MilestoneMarker
              meta="Start here"
              status="current"
              title="Name the product and its customer"
            />
            <MilestoneMarker
              meta="Prove the workflow"
              title="Create the first real registry record"
            />
            <MilestoneMarker
              meta="Validate demand"
              title="Configure billing when someone is ready to pay"
            />
          </Milestones>
        </section>

        <section className="overflow-hidden rounded-lg border bg-card shadow-card">
          <header className="border-b px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium">Workbench</h2>
              <IndexLabel>{String(starterSections.length).padStart(2, '0')} modules</IndexLabel>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Reference surfaces you can keep, rename, or remove.
            </p>
          </header>
          <LedgerList>
            {starterSections.map((section, index) => (
              <LedgerRow
                index={String(index + 1).padStart(2, '0')}
                key={section.title}
                meta={section.description}
                name={
                  <Link
                    className="group/link flex items-center gap-2 underline-offset-4 hover:underline"
                    to={section.to}
                  >
                    <section.icon className="size-3.5 text-muted-foreground" />
                    {section.title}
                  </Link>
                }
                status={<ArrowUpRight className="size-3.5 text-muted-foreground" />}
              />
            ))}
          </LedgerList>
        </section>
      </section>

      <section className="overflow-hidden rounded-lg border bg-card shadow-card" id="activity">
        <header className="flex items-start justify-between gap-4 border-b px-3 py-2.5">
          <div>
            <h2 className="text-sm font-medium">Recent activity</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Product events will appear here once you connect a real workflow.
            </p>
          </div>
          <Activity className="mt-0.5 size-4 text-muted-foreground" />
        </header>
        <div className="bg-grain flex min-h-40 flex-col items-center justify-center gap-2 px-5 py-8 text-center">
          <span className="flex size-8 items-center justify-center rounded-md border bg-background shadow-card">
            <CircleCheck className="size-4 text-accent" />
          </span>
          <div>
            <p className="text-sm font-medium">The workbench is ready</p>
            <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
              Create a registry record to produce the first meaningful activity in this fork.
            </p>
          </div>
          <Link
            className="mt-1 font-mono text-xs font-medium text-primary underline-offset-4 hover:underline"
            search={{ page: 1, q: '', sort: 'updated_desc' }}
            to="/app/registry"
          >
            Open registry →
          </Link>
        </div>
      </section>
    </div>
  )
}
