import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../../lib/auth-input'
import { requireAuthenticatedMutation } from '../../../lib/protected-request.server'
import { requireSameOriginUrl } from '../../../lib/request-security'

const inputSchema = z.object({
  callbackUrl: z.string().url(),
  newEmail: z.email().transform((email) => email.toLowerCase()),
})

export const Route = createFileRoute('/api/account/email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = getAuth()
        const { headers, user } = await requireAuthenticatedMutation(request, auth)
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a new email and callback URL')
        requireSameOriginUrl(parsed.data.callbackUrl, request)
        if (parsed.data.newEmail === user.email.toLowerCase()) {
          return Response.json({ error: 'Enter a different email address.' }, { status: 400 })
        }
        return auth.changeEmail(parsed.data, headers)
      },
    },
  },
})
