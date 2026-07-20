import { createFileRoute, Link } from '@tanstack/react-router'
import { PasswordResetRequestForm } from '../components/auth-forms'
import { AuthPageShell } from '../components/auth-page-shell'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <AuthPageShell
      description="We will send a single-use link if an account exists for the address."
      eyebrow="Account recovery"
      title="Reset your password"
    >
      <PasswordResetRequestForm />
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
