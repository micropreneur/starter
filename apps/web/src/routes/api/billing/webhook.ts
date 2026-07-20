import { BillingWebhookVerificationError } from '@micropreneur/billing'
import { createFileRoute } from '@tanstack/react-router'

import { getBilling } from '../../../lib/billing.server'

export const Route = createFileRoute('/api/billing/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get('stripe-signature')
        if (!signature)
          return Response.json({ error: 'Missing Stripe signature.' }, { status: 400 })
        try {
          const result = await getBilling().handleWebhook(await request.text(), signature)
          return Response.json({ result })
        } catch (error) {
          if (error instanceof BillingWebhookVerificationError) {
            return Response.json({ error: error.message }, { status: 400 })
          }
          throw error
        }
      },
    },
  },
})
