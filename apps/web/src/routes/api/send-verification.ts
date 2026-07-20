import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../lib/auth-input'

const inputSchema = z.object({ callbackUrl: z.string().url(), email: z.email() })

export const Route = createFileRoute('/api/send-verification')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a valid email and callback URL')
        try {
          await getAuth().sendVerificationEmail(
            parsed.data.email,
            parsed.data.callbackUrl,
            new Headers(request.headers),
          )
        } catch (error) {
          console.error('Email verification request failed.', error)
        }
        return Response.json(
          { message: 'If the address can be verified, a fresh link has been sent.' },
          { status: 202 },
        )
      },
    },
  },
})
