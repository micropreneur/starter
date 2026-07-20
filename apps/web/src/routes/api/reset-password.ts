import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../lib/auth-input'

const inputSchema = z.object({ newPassword: z.string().min(8).max(128), token: z.string().min(1) })

export const Route = createFileRoute('/api/reset-password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a reset token and a valid new password')
        return getAuth().resetPassword(parsed.data, new Headers(request.headers))
      },
    },
  },
})
