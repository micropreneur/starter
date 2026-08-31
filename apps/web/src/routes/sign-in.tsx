import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { SignInForm } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'
import { getAuthCapabilities, getCurrentUser } from '../lib/auth.functions'
import { safeAuthCallbackPath } from '../lib/auth-redirect'
import { privatePageHead } from '../lib/seo'

export const Route = createFileRoute('/sign-in')({
  head: () => privatePageHead('Sign in'),
  validateSearch: z.object({ callbackUrl: z.string().optional() }),
  beforeLoad: async ({ search }) => {
    if (await getCurrentUser()) throw redirect({ href: safeAuthCallbackPath(search.callbackUrl) })
  },
  loader: () => getAuthCapabilities(),
  component: SignInPage,
})

function SignInPage() {
  const { googleOAuth } = Route.useLoaderData()
  const { callbackUrl } = Route.useSearch()
  const safeCallbackUrl = safeAuthCallbackPath(callbackUrl)

  return (
    <AuthPageShell
      description="Use your account to continue to the reusable application dashboard."
      eyebrow="Welcome back"
      standalone
      title="Sign in to your workspace"
    >
      <SignInForm callbackUrl={safeCallbackUrl} googleOAuth={googleOAuth} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          search={{ callbackUrl: safeCallbackUrl }}
          to="/sign-up"
        >
          Create an account
        </Link>
      </p>
    </AuthPageShell>
  )
}
