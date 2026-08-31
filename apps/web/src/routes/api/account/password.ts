import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../../lib/auth-input'
import { requireAuthenticatedMutation } from '../../../lib/protected-request.server'

const inputSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
})

export const Route = createFileRoute('/api/account/password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = getAuth()
        const { headers } = await requireAuthenticatedMutation(request, auth)
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('current and new passwords')
        return auth.changePassword(parsed.data, headers)
      },
    },
  },
})
