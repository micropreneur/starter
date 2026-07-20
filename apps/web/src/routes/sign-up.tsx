import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { SignUpForm } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'
import { getAuthCapabilities, getCurrentUser } from '../lib/auth.functions'

export const Route = createFileRoute('/sign-up')({
  beforeLoad: async () => {
    if (await getCurrentUser()) throw redirect({ to: '/app' })
  },
  loader: () => getAuthCapabilities(),
  component: SignUpPage,
})

function SignUpPage() {
  const { googleOAuth } = Route.useLoaderData()

  return (
    <AuthPageShell
      description="Create the account and give its personal workspace a useful first state."
      eyebrow="Start building"
      standalone
      title="Create your starter account"
    >
      <SignUpForm googleOAuth={googleOAuth} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          to="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
