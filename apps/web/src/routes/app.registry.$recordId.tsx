import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@micropreneur/elements'
import { createFileRoute, Link, notFound, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft, CalendarDays, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { OperationRecordForm } from '../components/operation-record-form'
import { deleteOperation, getOperation, updateOperation } from '../lib/operations.functions'

export const Route = createFileRoute('/app/registry/$recordId')({
  loader: async ({ params }) => {
    const record = await getOperation({ data: { id: params.recordId } })
    if (!record) throw notFound()
    return record
  },
  component: OperationDetailPage,
  notFoundComponent: () => (
    <div className="grid flex-1 place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Record not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or it belongs to a different account.
        </p>
        <Link
          className={buttonVariants({ className: 'mt-4' })}
          search={{ page: 1, q: '', sort: 'updated_desc' }}
          to="/app/registry"
        >
          Back to registry
        </Link>
      </div>
    </div>
  ),
})

function OperationDetailPage() {
  const record = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const updateRecord = useServerFn(updateOperation)
  const deleteRecord = useServerFn(deleteOperation)
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    if (!window.confirm(`Delete “${record.title}”? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteRecord({ data: { id: record.id } })
      await router.invalidate()
      await navigate({ search: { page: 1, q: '', sort: 'updated_desc' }, to: '/app/registry' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            search={{ page: 1, q: '', sort: 'updated_desc' }}
            to="/app/registry"
          >
            <ArrowLeft className="size-3.5" />
            Operations Registry
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{record.title}</h1>
            <StatusBadge status={statusTone(record.status)}>{labelFor(record.status)}</StatusBadge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {record.summary || 'No summary has been added yet.'}
          </p>
        </div>
        <Button disabled={deleting} onClick={() => void remove()} variant="destructive">
          <Trash2 />
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_2fr]">
        <Card clipped size="sm">
          <CardHeader>
            <CardTitle>Record details</CardTitle>
            <CardDescription>Server-authorized data owned by the signed-in user.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Priority</dt>
                <dd className="mt-1 capitalize">{record.priority}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Review date</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {formatDate(record.reviewAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tags</dt>
                <dd className="mt-2 flex flex-wrap gap-1">
                  {record.tags.length > 0
                    ? record.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    : 'No tags'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Edit record</CardTitle>
            <CardDescription>Updates keep the same ownership boundary as reads.</CardDescription>
          </CardHeader>
          <CardContent>
            <OperationRecordForm
              initial={record}
              onSubmit={async (input) => {
                await updateRecord({ data: { id: record.id, input } })
                await router.invalidate()
              }}
              submitLabel="Save changes"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function labelFor(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(value),
  )
}

function statusTone(status: string): 'neutral' | 'positive' | 'warning' {
  if (status === 'active') return 'positive'
  if (status === 'needs_review') return 'warning'
  return 'neutral'
}
