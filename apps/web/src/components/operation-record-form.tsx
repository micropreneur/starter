import { Button, Field, FieldError, FieldGroup, FieldLabel, Input } from '@micropreneur/elements'
import {
  type OperationRecordInput,
  operationPriorities,
  operationRecordInputSchema,
  operationStatuses,
} from '@micropreneur/operations'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

interface OperationFormValues {
  priority: OperationRecordInput['priority']
  reviewAt: string
  status: OperationRecordInput['status']
  summary: string
  tags: string
  title: string
}

export function OperationRecordForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: OperationRecordInput
  onSubmit: (input: OperationRecordInput) => Promise<void>
  submitLabel: string
}) {
  const [formError, setFormError] = useState<string>()
  const form = useForm({
    defaultValues: toFormValues(initial),
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      const parsed = operationRecordInputSchema.safeParse({
        ...value,
        reviewAt: value.reviewAt ? new Date(value.reviewAt).toISOString() : null,
        tags: value.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? 'Check the highlighted fields.')
        return
      }

      try {
        await onSubmit(parsed.data)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Unable to save this record.')
      }
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="title"
          validators={{
            onBlur: ({ value }) => fieldIssue(operationRecordInputSchema.shape.title, value),
          }}
        >
          {(field) => (
            <Field data-invalid={!field.state.meta.isValid}>
              <FieldLabel htmlFor={field.name}>Title</FieldLabel>
              <Input
                aria-invalid={!field.state.meta.isValid}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Acme Cloud"
                value={field.state.value}
              />
              {!field.state.meta.isValid ? (
                <FieldError>{errorText(field.state.meta.errors)}</FieldError>
              ) : null}
            </Field>
          )}
        </form.Field>

        <form.Field name="summary">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Summary</FieldLabel>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
                id={field.name}
                maxLength={1000}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="What this record represents and why it matters."
                value={field.state.value}
              />
            </Field>
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="status">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value as OperationRecordInput['status'])
                  }
                  value={field.state.value}
                >
                  {operationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {labelFor(status)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </form.Field>

          <form.Field name="priority">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Priority</FieldLabel>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value as OperationRecordInput['priority'])
                  }
                  value={field.state.value}
                >
                  {operationPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {labelFor(priority)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="reviewAt">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Review date</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onInput={(event) => field.handleChange(event.currentTarget.value)}
                  type="date"
                  value={field.state.value}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="tags">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="vendor, security"
                  value={field.state.value}
                />
              </Field>
            )}
          </form.Field>
        </div>

        {formError ? <FieldError>{formError}</FieldError> : null}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button disabled={!canSubmit || isSubmitting} type="submit">
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  )
}

function toFormValues(initial?: OperationRecordInput): OperationFormValues {
  return {
    priority: initial?.priority ?? 'medium',
    reviewAt: initial?.reviewAt?.slice(0, 10) ?? '',
    status: initial?.status ?? 'draft',
    summary: initial?.summary ?? '',
    tags: initial?.tags.join(', ') ?? '',
    title: initial?.title ?? '',
  }
}

function fieldIssue(
  schema: {
    safeParse(value: unknown): { success: boolean; error?: { issues: Array<{ message: string }> } }
  },
  value: unknown,
) {
  const result = schema.safeParse(value)
  return result.success ? undefined : result.error?.issues[0]?.message
}

function errorText(errors: unknown[]) {
  return errors
    .map((error) =>
      typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Invalid value',
    )
    .join(', ')
}

function labelFor(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
