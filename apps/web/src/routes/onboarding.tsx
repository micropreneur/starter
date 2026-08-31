import { Button, FieldError, FieldGroup } from '@micropreneur/elements'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { WorkspaceOnboardingFields } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'
import { privatePageHead } from '../lib/seo'
import { completeWorkspaceOnboarding, getAppContext } from '../lib/workspace.functions'

export const Route = createFileRoute('/onboarding')({
  head: () => privatePageHead('Workspace setup'),
  beforeLoad: async () => {
    const context = await getAppContext()
    if (!context) throw redirect({ to: '/sign-in' })
    if (context.workspace.onboardingComplete) throw redirect({ to: '/app' })
    return context
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const { user } = Route.useRouteContext()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    setPending(true)
    const form = new FormData(event.currentTarget)

    try {
      await completeWorkspaceOnboarding({
        data: {
          name: String(form.get('workspaceName') ?? ''),
        },
      })
      window.location.assign('/app')
    } catch {
      setError('Your workspace could not be updated. Please try again.')
      setPending(false)
    }
  }

  return (
    <AuthPageShell
      description={`Welcome, ${user.name}. Name your personal workspace before opening the dashboard.`}
      eyebrow="One last step"
      title="Shape your personal workspace"
    >
      <form onSubmit={submit}>
        <FieldGroup>
          <WorkspaceOnboardingFields idPrefix="onboarding" />
          {error ? <FieldError>{error}</FieldError> : null}
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? 'Preparing your dashboard…' : 'Open my dashboard'}
          </Button>
        </FieldGroup>
      </form>
    </AuthPageShell>
  )
}
