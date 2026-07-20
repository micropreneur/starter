import { isOpenSubscription } from '@micropreneur/billing'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  IndexLabel,
  Input,
  StatusBadge,
} from '@micropreneur/elements'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CreditCard, KeyRound, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { z } from 'zod'

import { getAccountOverview } from '../lib/auth.functions'
import { getBillingOverview } from '../lib/billing.functions'

export const Route = createFileRoute('/app/settings')({
  validateSearch: z.object({ billing: z.enum(['success', 'cancelled']).optional() }),
  loader: async () => {
    const [account, billing] = await Promise.all([getAccountOverview(), getBillingOverview()])
    return { account, billing }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { account, billing } = Route.useLoaderData()
  const { billing: billingResult } = Route.useSearch()
  const hasCredential = account.accounts.some((linked) => linked.provider === 'credential')

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
      <section className="border-b border-border/70 pb-4">
        <IndexLabel>Account · Controls</IndexLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Profile, linked sign-in methods, password, billing, and account deletion.
        </p>
      </section>

      {billingResult ? (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          {billingResult === 'success'
            ? 'Checkout completed. Stripe will confirm access through the webhook shortly.'
            : 'Checkout was cancelled; nothing changed.'}
        </div>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-2">
        <ProfileCard name={account.user.name} email={account.user.email} />
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Sign-in methods
            </CardTitle>
            <CardDescription>
              Provider details stay behind the repository’s AuthPort.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.accounts.map((linked) => (
              <Badge key={linked.provider} variant="outline">
                {linked.provider === 'credential'
                  ? 'Email and password'
                  : labelFor(linked.provider)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {hasCredential ? <PasswordCard /> : <GoogleOnlyCard />}
        <BillingCard billing={billing} />
      </section>

      <DeleteAccountCard hasCredential={hasCredential} />
    </div>
  )
}

function ProfileCard({ email, name }: { email: string; name: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    setMessage(undefined)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const response = await postJson('/api/account/profile', { name: form.get('name') })
    if (!response.ok) {
      setError(await responseError(response))
      setPending(false)
      return
    }
    setMessage('Profile updated.')
    setPending(false)
    await router.invalidate()
  }

  return (
    <Card clipped size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4" />
          Profile
        </CardTitle>
        <CardDescription>Your public account identity in this fork.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input defaultValue={name} id="profile-name" key={name} name="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input disabled id="profile-email" value={email} />
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button disabled={pending} type="submit">
              {pending ? 'Saving…' : 'Save profile'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordCard() {
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    setMessage(undefined)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const response = await postJson('/api/account/password', {
      currentPassword: form.get('currentPassword'),
      newPassword: form.get('newPassword'),
    })
    if (!response.ok) {
      setError(await responseError(response))
      setPending(false)
      return
    }
    formElement.reset()
    setMessage('Password updated. Other sessions were revoked.')
    setPending(false)
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Password
        </CardTitle>
        <CardDescription>Changing it revokes every other active session.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <Input
                autoComplete="current-password"
                id="current-password"
                minLength={8}
                name="currentPassword"
                required
                type="password"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-account-password">New password</FieldLabel>
              <Input
                autoComplete="new-password"
                id="new-account-password"
                minLength={8}
                name="newPassword"
                required
                type="password"
              />
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button disabled={pending} type="submit" variant="secondary">
              {pending ? 'Updating…' : 'Change password'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function GoogleOnlyCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Password
        </CardTitle>
        <CardDescription>This account signs in through a social provider.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          There is no credential password to change. Manage access with the linked provider.
        </p>
      </CardContent>
    </Card>
  )
}

function BillingCard({ billing }: { billing: Awaited<ReturnType<typeof getBillingOverview>> }) {
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const paid = billing.registryExport
  const manageable = isOpenSubscription(billing.subscription)

  async function openBilling() {
    setPending(true)
    setError(undefined)
    const response = await postJson(
      manageable ? '/api/billing/portal' : '/api/billing/checkout',
      {},
    )
    const body = (await response.json().catch(() => null)) as {
      error?: string
      url?: string
    } | null
    if (!response.ok || !body?.url) {
      setError(body?.error ?? 'Billing is unavailable in this environment.')
      setPending(false)
      return
    }
    window.location.assign(body.url)
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-4" />
          Billing
        </CardTitle>
        <CardDescription>One monthly Stripe plan with app-owned entitlements.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center justify-between gap-3 rounded-md border p-2.5">
          <div>
            <p className="text-sm font-medium">{paid ? 'Paid' : 'Free'} plan</p>
            <p className="text-xs text-muted-foreground">
              CSV export {billing.registryExport ? 'enabled' : 'locked'}
            </p>
          </div>
          <StatusBadge status={paid ? 'positive' : 'neutral'}>
            {billing.subscription?.status ?? 'free'}
          </StatusBadge>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button
          disabled={!billing.configured || pending}
          onClick={() => void openBilling()}
          type="button"
          variant={manageable ? 'outline' : 'default'}
        >
          {pending ? 'Opening…' : manageable ? 'Manage billing' : 'Upgrade to paid'}
        </Button>
        {!billing.configured ? (
          <p className="text-xs text-muted-foreground">
            Add the three Stripe environment variables to enable local sandbox billing.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function DeleteAccountCard({ hasCredential }: { hasCredential: boolean }) {
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('confirmation') !== 'DELETE') return
    setPending(true)
    setError(undefined)
    const response = await postJson('/api/account/delete', {
      callbackUrl: `${window.location.origin}/`,
      password: hasCredential ? form.get('password') : undefined,
    })
    if (!response.ok) {
      setError(await responseError(response))
      setPending(false)
      return
    }
    setMessage('Check your email to confirm permanent account deletion.')
    setPending(false)
  }

  return (
    <Card className="border-destructive/30" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="size-4" />
          Delete account
        </CardTitle>
        <CardDescription>
          Permanently removes the user and cascades all registry and billing data. Any Stripe
          subscription must finish cancellation first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="max-w-lg" onSubmit={submit}>
          <FieldGroup>
            {hasCredential ? (
              <Field>
                <FieldLabel htmlFor="delete-password">Current password</FieldLabel>
                <Input
                  autoComplete="current-password"
                  id="delete-password"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="delete-confirmation">Type DELETE to confirm</FieldLabel>
              <Input id="delete-confirmation" name="confirmation" pattern="DELETE" required />
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button disabled={pending} type="submit" variant="destructive">
              {pending ? 'Deleting…' : 'Permanently delete account'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function postJson(url: string, body: unknown) {
  return fetch(url, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
}

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string
    message?: string
  } | null
  return body?.message ?? body?.error ?? `Request failed (${response.status}).`
}

function labelFor(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
