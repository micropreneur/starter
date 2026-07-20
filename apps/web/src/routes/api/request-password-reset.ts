import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../lib/auth-input'

const inputSchema = z.object({ email: z.email(), redirectTo: z.string().url() })
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

        try {
          await getAuth().requestPasswordReset(parsed.data, new Headers(request.headers))
        } catch (error) {
          console.error('Password reset request failed.', error)
        }
        return genericResponse()
      },
    },
  },
})
