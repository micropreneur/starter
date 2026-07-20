import { ExistingSubscriptionError } from '@micropreneur/billing'
import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../../lib/auth.server'
import { getBilling } from '../../../lib/billing.server'
import { requireSameOrigin } from '../../../lib/request-security'

export const Route = createFileRoute('/api/billing/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const user = await getAuth().requireUser(new Headers(request.headers))
        const origin = new URL(request.url).origin
        try {
          const url = await getBilling().createCheckout({
            cancelUrl: `${origin}/app/settings?billing=cancelled`,
            successUrl: `${origin}/app/settings?billing=success`,
            user,
          })
          return Response.json({ url })
        } catch (error) {
          if (error instanceof ExistingSubscriptionError) {
            return Response.json({ error: error.message }, { status: 409 })
          }
          throw error
        }
      },
    },
  },
})
