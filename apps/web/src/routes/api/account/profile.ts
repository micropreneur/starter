import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../../lib/auth-input'
import { requireSameOrigin } from '../../../lib/request-security'

const inputSchema = z.object({ name: z.string().trim().min(1).max(100) })

export const Route = createFileRoute('/api/account/profile')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const headers = new Headers(request.headers)
        await getAuth().requireUser(headers)
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a non-empty name')
        return getAuth().updateUser(parsed.data, headers)
      },
    },
  },
})
