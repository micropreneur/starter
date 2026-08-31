import { createFileRoute, Link } from '@tanstack/react-router'
import { PasswordResetRequestForm } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'
import { getAuthCapabilities } from '../lib/auth.functions'
import { privatePageHead } from '../lib/seo'

export const Route = createFileRoute('/forgot-password')({
  head: () => privatePageHead('Reset password'),
  loader: () => getAuthCapabilities(),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { turnstileSiteKey } = Route.useLoaderData()
  return (
    <AuthPageShell
      description="We will send a single-use link if an account exists for the address."
      eyebrow="Account recovery"
      title="Reset your password"
    >
      <PasswordResetRequestForm turnstileSiteKey={turnstileSiteKey} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          to="/sign-in"
        >
          Return to sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
