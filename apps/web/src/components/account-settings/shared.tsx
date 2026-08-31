import { FieldError } from '@micropreneur/elements'
import type { ReactNode } from 'react'

import type { getAccountOverview } from '../../lib/auth.functions'
import type { getBillingOverview } from '../../lib/billing.functions'

export type AccountOverview = Awaited<ReturnType<typeof getAccountOverview>>
export type BillingOverview = Awaited<ReturnType<typeof getBillingOverview>>

export function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  const headingId = `settings-${title.toLowerCase().replaceAll(' ', '-')}`
  return (
    <section aria-labelledby={headingId}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold tracking-[-0.015em]" id={headingId}>
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  )
}

export function FormFeedback({ error, message }: { error?: string; message?: string }) {
  return (
    <>
      {error ? <FieldError role="alert">{error}</FieldError> : null}
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </>
  )
}

export function postJson(url: string, body: unknown) {
  return fetch(url, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
}

export async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string
    message?: string
  } | null
  return body?.message ?? body?.error ?? `Request failed (${response.status}).`
}

export function labelFor(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
