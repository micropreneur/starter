import { Button, Field, FieldError, FieldGroup, FieldLabel, Input } from '@micropreneur/elements'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { z } from 'zod'

import { AuthPageShell } from '../components/auth-page-shell'
import { privatePageHead } from '../lib/seo'

export const Route = createFileRoute('/reset-password')({
  head: () => privatePageHead('Choose a new password'),
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const [error, setError] = useState<string>()
  const [complete, setComplete] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setError(undefined)
    setPending(true)
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/reset-password', {
      body: JSON.stringify({ newPassword: form.get('password'), token }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) {
      setError('This reset link is invalid or has expired. Request a new one.')
      setPending(false)
      return
    }
    setComplete(true)
    setPending(false)
  }

  return (
    <AuthPageShell
      description="Reset links are single-use and expire after one hour."
      eyebrow="Account recovery"
      title="Choose a new password"
    >
      {!token ? (
        <div className="grid gap-4">
          <FieldError>This reset link is missing its token.</FieldError>
          <Link className="text-sm underline underline-offset-4" to="/forgot-password">
            Request another link
          </Link>
        </div>
      ) : complete ? (
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <p>Your password has been updated. You can now sign in with it.</p>
          <Link className="font-medium underline underline-offset-4" to="/sign-in">
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                autoComplete="new-password"
                id="new-password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            <Button className="w-full" disabled={pending} type="submit">
              {pending ? 'Updating…' : 'Update password'}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthPageShell>
  )
}
