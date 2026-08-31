import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
} from '@micropreneur/elements'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import {
  type AccountOverview,
  FormFeedback,
  labelFor,
  postJson,
  responseError,
  SettingsSection,
} from './shared'

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
