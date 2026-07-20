import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  IndexLabel,
  Input,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@micropreneur/elements'
import {
  operationPriorities,
  operationRecordListSchema,
  operationStatuses,
} from '@micropreneur/operations'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft, ArrowRight, Download, Plus, Search } from 'lucide-react'
import { z } from 'zod'

import { OperationRecordForm } from '../components/operation-record-form'
import { getBillingOverview } from '../lib/billing.functions'
import { createOperation, listOperations } from '../lib/operations.functions'

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  priority: optionalSearchEnum(operationPriorities),
  q: z.string().trim().max(120).catch(''),
  sort: z.enum(['updated_desc', 'updated_asc', 'review_asc', 'title_asc']).catch('updated_desc'),
  status: optionalSearchEnum(operationStatuses),
  tag: optionalSearchString(),
})

export const Route = createFileRoute('/app/registry/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [records, billing] = await Promise.all([
      listOperations({
        data: operationRecordListSchema.parse({
          page: deps.page,
          pageSize: 10,
          priority: deps.priority,
          search: deps.q,
          sort: deps.sort,
          status: deps.status,
          tag: deps.tag,
        }),
      }),
      getBillingOverview(),
    ])
    return { billing, records }
  },
  component: RegistryPage,
})

function RegistryPage() {
  const { billing, records } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const createRecord = useServerFn(createOperation)
  const totalPages = Math.max(1, Math.ceil(records.total / records.pageSize))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
      <section className="flex flex-col justify-between gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end">
        <div>
          <IndexLabel>Example domain · Objects</IndexLabel>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Operations Registry
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            User-owned records proving CRUD, search, filters, authorization, and paid export.
          </p>
        </div>
        {billing.registryExport ? (
          <a className={buttonVariants({ variant: 'outline' })} href="/api/registry/export">
            <Download />
            Export CSV
          </a>
        ) : (
          <Link className={buttonVariants({ variant: 'outline' })} to="/app/settings">
            <Download />
            Unlock CSV export
          </Link>
        )}
      </section>

      <details className="group rounded-lg border bg-card shadow-card open:pb-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-3 py-3 text-sm font-medium marker:hidden">
          <span className="flex items-center gap-2">
            <Plus className="size-4" />
            Create a record
          </span>
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">
            Add the first object in your product
          </span>
        </summary>
        <div className="border-t px-3 pt-3">
          <OperationRecordForm
            onSubmit={async (input) => {
              const created = await createRecord({ data: input })
              await router.invalidate()
              await navigate({ params: { recordId: created.id }, to: '/app/registry/$recordId' })
            }}
            submitLabel="Create record"
          />
        </div>
      </details>

      <Card clipped>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>
            {records.total} {records.total === 1 ? 'record' : 'records'} visible to this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <form
            action="/app/registry"
            className="grid gap-2 lg:grid-cols-[1fr_repeat(3,auto)_auto]"
          >
            <label className="relative" htmlFor="registry-search">
              <span className="sr-only">Search records</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                defaultValue={search.q}
                id="registry-search"
                name="q"
                placeholder="Search records"
              />
            </label>
            <FilterSelect label="Status" name="status" value={search.status}>
              {operationStatuses.map((status) => (
                <option key={status} value={status}>
                  {labelFor(status)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Priority" name="priority" value={search.priority}>
              {operationPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {labelFor(priority)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Sort" name="sort" value={search.sort} withAny={false}>
              <option value="updated_desc">Recently updated</option>
              <option value="updated_asc">Oldest updated</option>
              <option value="review_asc">Review date</option>
              <option value="title_asc">Title</option>
            </FilterSelect>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>

          {records.items.length === 0 ? (
            <EmptyState
              description="Create a record or broaden the current search and filters."
              title={records.total === 0 ? 'No records yet' : 'No matching records'}
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-md border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Record</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.items.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Link
                            className="font-medium underline-offset-4 hover:underline"
                            params={{ recordId: record.id }}
                            to="/app/registry/$recordId"
                          >
                            {record.title}
                          </Link>
                          <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                            {record.summary || 'No summary'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={statusTone(record.status)}>
                            {labelFor(record.status)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="capitalize">{record.priority}</TableCell>
                        <TableCell>{formatDate(record.reviewAt)}</TableCell>
                        <TableCell>
                          <div className="flex max-w-52 flex-wrap gap-1">
                            {record.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {records.items.map((record) => (
                  <Link
                    className="grid gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
                    key={record.id}
                    params={{ recordId: record.id }}
                    to="/app/registry/$recordId"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{record.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {record.summary || 'No summary'}
                        </p>
                      </div>
                      <StatusBadge status={statusTone(record.status)}>
                        {labelFor(record.status)}
                      </StatusBadge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{record.priority} priority</span>
                      <span>Review {formatDate(record.reviewAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Page {records.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Link
                className={buttonVariants({ size: 'sm', variant: 'outline' })}
                disabled={records.page <= 1}
                search={{ ...search, page: Math.max(1, records.page - 1) }}
                to="/app/registry"
              >
                <ArrowLeft />
                Previous
              </Link>
              <Link
                className={buttonVariants({ size: 'sm', variant: 'outline' })}
                disabled={records.page >= totalPages}
                search={{ ...search, page: Math.min(totalPages, records.page + 1) }}
                to="/app/registry"
              >
                Next
                <ArrowRight />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FilterSelect({
  children,
  label,
  name,
  value,
  withAny = true,
}: {
  children: React.ReactNode
  label: string
  name: string
  value?: string
  withAny?: boolean
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        defaultValue={value ?? ''}
        name={name}
      >
        {withAny ? <option value="">Any {label.toLowerCase()}</option> : null}
        {children}
      </select>
    </label>
  )
}

function optionalSearchEnum<const Values extends readonly [string, ...string[]]>(values: Values) {
  return z.preprocess((value) => (value === '' ? undefined : value), z.enum(values).optional())
}

function optionalSearchString() {
  return z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().max(32).optional(),
  )
}

function labelFor(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(value),
  )
}

function statusTone(status: string): 'neutral' | 'positive' | 'warning' {
  if (status === 'active') return 'positive'
  if (status === 'needs_review') return 'warning'
  return 'neutral'
}
