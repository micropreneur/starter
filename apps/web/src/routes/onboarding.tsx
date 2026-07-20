import { Button, FieldError, FieldGroup } from '@micropreneur/elements'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { WorkspaceOnboardingFields } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'
import { completeWorkspaceOnboarding, getAppContext } from '../lib/workspace.functions'

export const Route = createFileRoute('/onboarding')({
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
          primaryGoal: String(form.get('primaryGoal') ?? '') as
            | 'validate'
            | 'launch'
            | 'grow'
            | 'migrate',
          productType: String(form.get('productType') ?? '') as
            | 'saas'
            | 'marketplace'
            | 'client_service'
            | 'internal_tool'
            | 'other',
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
      description={`Welcome, ${user.name}. Answer three quick questions before opening your dashboard.`}
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
