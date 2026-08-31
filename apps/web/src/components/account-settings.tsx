import { isOpenSubscription } from '@micropreneur/billing'
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  StatusBadge,
} from '@micropreneur/elements'
import { useRouter } from '@tanstack/react-router'
import { CreditCard, KeyRound, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'

import type { getAccountOverview } from '../lib/auth.functions'
import type { getBillingOverview } from '../lib/billing.functions'

type AccountOverview = Awaited<ReturnType<typeof getAccountOverview>>
type BillingOverview = Awaited<ReturnType<typeof getBillingOverview>>

export function ProfileSettings({ account }: { account: AccountOverview }) {
  return (
    <SettingsSection
      description="Update the provider-neutral identity fields shown throughout the app."
      title="Profile"
    >
      <div className="grid gap-3 xl:grid-cols-2">
        <ProfileCard name={account.user.name} />
        <EmailCard email={account.user.email} />
      </div>
    </SettingsSection>
  )
}

export function SecuritySettings({ account }: { account: AccountOverview }) {
  const hasCredential = account.accounts.some((linked) => linked.provider === 'credential')

  return (
    <SettingsSection
      description="Review linked sign-in methods and rotate credential passwords."
      title="Security"
    >
      <div className="grid gap-3 xl:grid-cols-2">
        <SignInMethodsCard accounts={account.accounts} />
        {hasCredential ? <PasswordCard /> : <SocialPasswordCard />}
      </div>
    </SettingsSection>
  )
}

export function BillingSettings({
  billing,
  result,
}: {
  billing: BillingOverview
  result?: 'success' | 'cancelled'
}) {
  return (
    <SettingsSection
      description="View local subscription state and open Stripe-hosted billing when configured."
      title="Billing"
    >
      {result ? (
        <div className="mb-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm" role="status">
          {result === 'success'
            ? 'Checkout completed. Stripe will confirm access through the webhook shortly.'
            : 'Checkout was cancelled; nothing changed.'}
        </div>
      ) : null}
      <BillingCard billing={billing} />
    </SettingsSection>
  )
}

export function DangerZoneSettings({ account }: { account: AccountOverview }) {
  const hasCredential = account.accounts.some((linked) => linked.provider === 'credential')

  return (
    <SettingsSection
      description="Account deletion is permanent and removes the personal workspace data owned by the user."
      title="Danger zone"
    >
      <DeleteAccountCard hasCredential={hasCredential} />
    </SettingsSection>
  )
}

function SettingsSection({
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

function ProfileCard({ name }: { name: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    setMessage(undefined)
    const form = new FormData(event.currentTarget)
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
          Display name
        </CardTitle>
        <CardDescription>Used in the dashboard and account menu.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input defaultValue={name} id="profile-name" key={name} name="name" required />
            </Field>
            <FormFeedback error={error} message={message} />
            <Button disabled={pending} type="submit">
              {pending ? 'Saving…' : 'Save name'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function EmailCard({ email }: { email: string }) {
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    setMessage(undefined)
    const form = new FormData(event.currentTarget)
    const response = await postJson('/api/account/email', {
      callbackUrl: `${window.location.origin}/app/settings/profile`,
      newEmail: form.get('email'),
    })
    if (!response.ok) {
      setError(await responseError(response))
      setPending(false)
      return
    }
    setMessage(
      'Check the new address for a verification link. Your current email stays active until confirmation.',
    )
    setPending(false)
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4" />
          Email address
        </CardTitle>
        <CardDescription>Changing the sign-in email requires verification.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input
                autoComplete="email"
                defaultValue={email}
                id="profile-email"
                key={email}
                name="email"
                required
                type="email"
              />
            </Field>
            <FormFeedback error={error} message={message} />
            <Button disabled={pending} type="submit" variant="secondary">
              {pending ? 'Sending…' : 'Change email'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function SignInMethodsCard({ accounts }: { accounts: AccountOverview['accounts'] }) {
  return (
    <Card clipped size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          Sign-in methods
        </CardTitle>
        <CardDescription>Provider details stay behind the repository’s AuthPort.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {accounts.map((linked) => (
          <Badge key={linked.provider} variant="outline">
            {linked.provider === 'credential' ? 'Email and password' : labelFor(linked.provider)}
          </Badge>
        ))}
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
            <FormFeedback error={error} message={message} />
            <Button disabled={pending} type="submit" variant="secondary">
              {pending ? 'Updating…' : 'Change password'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function SocialPasswordCard() {
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

function BillingCard({ billing }: { billing: BillingOverview }) {
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

  if (!billing.configured) {
    return (
      <Card className="max-w-2xl" clipped size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Subscription
          </CardTitle>
          <CardDescription>
            Free Starter leaves Stripe off until the fork owner supplies all three values.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-start justify-between gap-3 rounded-md border p-2.5">
            <div>
              <p className="text-sm font-medium">Stripe not activated</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Checkout, the customer portal, signed webhooks, and entitlements are included.
              </p>
            </div>
            <StatusBadge status="neutral">off by default</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            Add your own Stripe sandbox values, or use Starter Pro when you want billing already
            wired into the product template.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              className={buttonVariants({ variant: 'outline' })}
              href="https://docs.micropreneur.dev/integrations/stripe"
              rel="noreferrer"
              target="_blank"
            >
              Activation guide
            </a>
            <a
              className={buttonVariants({ variant: 'outline' })}
              href="https://www.micropreneur.dev"
              rel="noreferrer"
              target="_blank"
            >
              See Starter Pro
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl" clipped size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-4" />
          Subscription
        </CardTitle>
        <CardDescription>
          Stripe Checkout, the customer portal, signed webhooks, and app-owned entitlements.
        </CardDescription>
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
        <FormFeedback error={error} />
        <Button
          disabled={pending}
          onClick={() => void openBilling()}
          type="button"
          variant={manageable ? 'outline' : 'default'}
        >
          {pending ? 'Opening…' : manageable ? 'Manage billing' : 'Upgrade to paid'}
        </Button>
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
    setMessage(undefined)
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
    <Card className="max-w-2xl border-destructive/30" size="sm">
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
            <FormFeedback error={error} message={message} />
            <Button disabled={pending} type="submit" variant="destructive">
              {pending ? 'Deleting…' : 'Permanently delete account'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function FormFeedback({ error, message }: { error?: string; message?: string }) {
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
