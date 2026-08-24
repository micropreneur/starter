import { env as cloudflareEnv } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import type { WebEnv } from '../../env'
import { getAuth } from '../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../lib/auth-input'
import { turnstileRejectedResponse, verifyTurnstileChallenge } from '../../lib/turnstile.server'

const inputSchema = z.object({
  email: z.email(),
  redirectTo: z.string().url(),
  turnstileToken: z.string().max(2048).optional(),
})
const genericResponse = () =>
  Response.json(
    { message: 'If an account exists for that email, a reset link has been sent.' },
    { status: 202 },
  )

export const Route = createFileRoute('/api/request-password-reset')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a valid email and redirect URL')

        const env = cloudflareEnv as unknown as WebEnv
        if (
          !(await verifyTurnstileChallenge({
            action: 'password_reset',
            env,
            request,
            token: parsed.data.turnstileToken,
          }))
        ) {
          return turnstileRejectedResponse()
        }

        try {
          await getAuth().requestPasswordReset(
            { email: parsed.data.email, redirectTo: parsed.data.redirectTo },
            new Headers(request.headers),
          )
        } catch (error) {
          console.error('Password reset request failed.', error)
        }
        return genericResponse()
      },
    },
  },
})
