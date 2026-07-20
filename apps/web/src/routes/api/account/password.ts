import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../../lib/auth-input'
import { requireSameOrigin } from '../../../lib/request-security'

const inputSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
})

export const Route = createFileRoute('/api/account/password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const headers = new Headers(request.headers)
        await getAuth().requireUser(headers)
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('current and new passwords')
        return getAuth().changePassword(parsed.data, headers)
      },
    },
  },
})
