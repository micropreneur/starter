import { ExistingSubscriptionError } from '@micropreneur/billing'
import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../../lib/auth.server'
import { getBilling } from '../../../lib/billing.server'
import { requireAuthenticatedMutation } from '../../../lib/protected-request.server'

export const Route = createFileRoute('/api/billing/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { user } = await requireAuthenticatedMutation(request, getAuth())
        const origin = new URL(request.url).origin
        try {
          const url = await getBilling().createCheckout({
            cancelUrl: `${origin}/app/settings/billing?billing=cancelled`,
            successUrl: `${origin}/app/settings/billing?billing=success`,
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
