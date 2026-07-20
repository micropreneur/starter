import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface AuthCardProps extends ComponentProps<'form'> {
  description?: ReactNode
  footer?: ReactNode
  forgotPasswordHref?: string
  heading?: ReactNode
  socialAction?: ReactNode
  submitLabel?: ReactNode
}

export function AuthCard({
  className,
  description = 'Enter your credentials to continue.',
  footer,
  forgotPasswordHref,
  heading = 'Welcome back',
  socialAction,
  submitLabel = 'Sign in',
  ...props
}: AuthCardProps) {
  return (
    <Card className="mx-auto w-full max-w-sm" data-slot="auth-card">
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className={cn('flex flex-col gap-4', className)} {...props}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="auth-email">Email</FieldLabel>
              <Input
                autoComplete="email"
                id="auth-email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="auth-password">Password</FieldLabel>
                {forgotPasswordHref != null && (
                  <a
                    className="text-xs text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={forgotPasswordHref}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                autoComplete="current-password"
                id="auth-password"
                name="password"
                required
                type="password"
              />
            </Field>
          </FieldGroup>
          <Button className="w-full" type="submit">
            {submitLabel}
          </Button>
          {socialAction}
        </form>
      </CardContent>
      {footer != null && <CardFooter className="justify-center">{footer}</CardFooter>}
    </Card>
  )
}
