import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { SignUpForm } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'
import { getAuthCapabilities, getCurrentUser } from '../lib/auth.functions'
import { safeAuthCallbackPath } from '../lib/auth-redirect'
import { privatePageHead } from '../lib/seo'

export const Route = createFileRoute('/sign-up')({
  head: () => privatePageHead('Create account'),
  validateSearch: z.object({ callbackUrl: z.string().optional() }),
  beforeLoad: async ({ search }) => {
    if (await getCurrentUser()) throw redirect({ href: safeAuthCallbackPath(search.callbackUrl) })
  },
  loader: () => getAuthCapabilities(),
  component: SignUpPage,
})

function SignUpPage() {
  const { googleOAuth, turnstileSiteKey } = Route.useLoaderData()
  const { callbackUrl } = Route.useSearch()
  const safeCallbackUrl = safeAuthCallbackPath(callbackUrl)

  return (
    <AuthPageShell
      description="Create the account and name the personal workspace that belongs to it."
      eyebrow="Start building"
      standalone
      title="Create your starter account"
    >
      <SignUpForm
        callbackUrl={safeCallbackUrl}
        googleOAuth={googleOAuth}
        turnstileSiteKey={turnstileSiteKey}
      />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          search={{ callbackUrl: safeCallbackUrl }}
          to="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
