import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { SignInForm } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'
import { getAuthCapabilities, getCurrentUser } from '../lib/auth.functions'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: async () => {
    if (await getCurrentUser()) throw redirect({ to: '/app' })
  },
  loader: () => getAuthCapabilities(),
  component: SignInPage,
})

function SignInPage() {
  const { googleOAuth } = Route.useLoaderData()

  return (
    <AuthPageShell
      description="Use your account to continue to the reusable application dashboard."
      eyebrow="Welcome back"
      standalone
      title="Sign in to your workspace"
    >
      <SignInForm googleOAuth={googleOAuth} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          to="/sign-up"
        >
          Create an account
        </Link>
      </p>
    </AuthPageShell>
  )
}
