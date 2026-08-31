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
import { useRouter } from '@tanstack/react-router'
import { Mail, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import {
  type AccountOverview,
  FormFeedback,
  postJson,
  responseError,
  SettingsSection,
} from './shared'

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
