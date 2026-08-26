import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../lib/auth-input'
import { requireSameOrigin, requireSameOriginUrl } from '../../lib/request-security'

const inputSchema = z.object({
  callbackUrl: z.string().url(),
  provider: z.literal('google'),
})

export const Route = createFileRoute('/api/sign-in-social')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a Google provider and callback URL')
        requireSameOriginUrl(parsed.data.callbackUrl, request)
        return getAuth().signInSocial(parsed.data, new Headers(request.headers))
      },
    },
  },
})
