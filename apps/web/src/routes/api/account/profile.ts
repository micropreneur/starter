import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../../lib/auth-input'
import { requireAuthenticatedMutation } from '../../../lib/protected-request.server'

const inputSchema = z.object({ name: z.string().trim().min(1).max(100) })

export const Route = createFileRoute('/api/account/profile')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = getAuth()
        const { headers } = await requireAuthenticatedMutation(request, auth)
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a non-empty name')
        return auth.updateUser(parsed.data, headers)
      },
    },
  },
})
