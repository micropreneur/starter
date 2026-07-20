import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@micropreneur/elements'
import { NativeSelect, NativeSelectOption } from '@micropreneur/elements/primitives'
import { CircleCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'

export function SignInForm({ googleOAuth = false }: { googleOAuth?: boolean }) {
  return (
    <div className="grid gap-5">
      {googleOAuth ? <GoogleSignIn /> : null}
      <CredentialSignInForm />
    </div>
  )
}

export function SignUpForm({ googleOAuth = false }: { googleOAuth?: boolean }) {
  const [error, setError] = useState<string>()
  const [created, setCreated] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/sign-up', {
      body: JSON.stringify({
        email: form.get('email'),
        name: form.get('name'),
        password: form.get('password'),
        workspace: {
          name: form.get('workspaceName'),
          primaryGoal: form.get('primaryGoal'),
          productType: form.get('productType'),
        },
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })

    if (!response.ok) {
      setError(await readError(response))
      setPending(false)
      return
    }

    setCreated(true)
    setPending(false)
  }

  if (created) {
    return (
      <div className="grid gap-4 rounded-lg border bg-muted/30 p-4" role="status">
        <CircleCheck className="size-5 text-accent" />
        <div>
          <p className="text-sm font-medium">Your account and workspace are ready.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your email for the verification link, then sign in to open your dashboard.
          </p>
        </div>
        <a
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/sign-in"
        >
          Go to sign in →
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      {googleOAuth ? (
        <>
          <GoogleSignIn />
          <p className="-mt-2 text-xs text-muted-foreground">
            New Google accounts finish the same workspace setup after authentication.
          </p>
        </>
      ) : null}
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="sign-up-name">Your name</FieldLabel>
              <Input autoComplete="name" id="sign-up-name" name="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
              <Input autoComplete="email" id="sign-up-email" name="email" required type="email" />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
            <Input
              autoComplete="new-password"
              id="sign-up-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
            <FieldDescription>Use at least eight characters.</FieldDescription>
          </Field>

          <div className="mt-2 border-t pt-5">
            <p className="label-caps text-muted-foreground">Your personal workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              These answers give the starter a useful first state. You can change them later.
            </p>
          </div>
          <WorkspaceOnboardingFields idPrefix="sign-up" />

          {error ? <FieldError>{error}</FieldError> : null}
          <Button className="mt-1 w-full" disabled={pending} type="submit">
            {pending ? 'Creating your workspace…' : 'Create account'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}

export function PasswordResetRequestForm() {
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/request-password-reset', {
      body: JSON.stringify({
        email: form.get('email'),
        redirectTo: `${window.location.origin}/reset-password`,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    setMessage(body?.message ?? 'If an account exists, a reset link has been sent.')
    setPending(false)
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password-reset-email">Email</FieldLabel>
          <Input
            autoComplete="email"
            id="password-reset-email"
            name="email"
            required
            type="email"
          />
        </Field>
        {message ? (
          <p
            className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground"
            role="status"
          >
            {message}
          </p>
        ) : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? 'Sending…' : 'Send reset link'}
        </Button>
      </FieldGroup>
    </form>
  )
}

export function WorkspaceOnboardingFields({ idPrefix }: { idPrefix: string }) {
  return (
    <>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-workspace-name`}>Workspace name</FieldLabel>
        <Input
          autoComplete="organization"
          id={`${idPrefix}-workspace-name`}
          maxLength={80}
          minLength={2}
          name="workspaceName"
          placeholder="Acme Studio"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-product-type`}>What are you building?</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`${idPrefix}-product-type`}
            name="productType"
            required
          >
            <NativeSelectOption value="saas">SaaS product</NativeSelectOption>
            <NativeSelectOption value="marketplace">Marketplace</NativeSelectOption>
            <NativeSelectOption value="client_service">Client service</NativeSelectOption>
            <NativeSelectOption value="internal_tool">Internal tool</NativeSelectOption>
            <NativeSelectOption value="other">Something else</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-primary-goal`}>First goal</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`${idPrefix}-primary-goal`}
            name="primaryGoal"
            required
          >
            <NativeSelectOption value="validate">Validate the idea</NativeSelectOption>
            <NativeSelectOption value="launch">Launch the first version</NativeSelectOption>
            <NativeSelectOption value="grow">Grow an existing product</NativeSelectOption>
            <NativeSelectOption value="migrate">Move an existing product</NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
    </>
  )
}

function CredentialSignInForm() {
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/sign-in', {
      body: JSON.stringify(Object.fromEntries(form.entries())),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })

    if (!response.ok) {
      setError(await readError(response))
      setPending(false)
      return
    }

    window.location.assign('/app')
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
          <Input autoComplete="email" id="sign-in-email" name="email" required type="email" />
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
            <a
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href="/forgot-password"
            >
              Forgot password?
            </a>
          </div>
          <Input
            autoComplete="current-password"
            id="sign-in-password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </FieldGroup>
    </form>
  )
}

function GoogleSignIn() {
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function signIn() {
    setPending(true)
    setError(undefined)
    const response = await fetch('/api/sign-in-social', {
      body: JSON.stringify({ callbackUrl: `${window.location.origin}/app`, provider: 'google' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    const body = (await response.json().catch(() => null)) as {
      error?: string
      url?: string
    } | null
    if (!response.ok || !body?.url) {
      setError(body?.error ?? 'Google sign-in could not be started.')
      setPending(false)
      return
    }
    window.location.assign(body.url)
  }

  return (
    <div className="grid gap-3">
      <Button disabled={pending} onClick={() => void signIn()} type="button" variant="outline">
        {pending ? 'Opening Google…' : 'Continue with Google'}
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use email
        <span className="h-px flex-1 bg-border" />
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  )
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    message?: string
    error?: string
  } | null
  return body?.message ?? body?.error ?? `Authentication failed (${response.status}).`
}
