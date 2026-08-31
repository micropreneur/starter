import {
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
import { Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import {
  type AccountOverview,
  FormFeedback,
  postJson,
  responseError,
  SettingsSection,
} from './shared'

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
