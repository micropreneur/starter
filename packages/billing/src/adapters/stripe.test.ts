import Stripe from 'stripe'
import { describe, expect, it } from 'vitest'

import { BillingWebhookVerificationError } from '../port'
import { createStripeBillingProvider } from './stripe'

const secret = 'whsec_contract_test'
const payload = JSON.stringify({
  api_version: '2026-07-29.basil',
  created: 1_785_628_800,
  data: {
    object: {
      cancel_at_period_end: false,
      customer: 'cus_contract',
      id: 'sub_contract',
      items: {
        data: [
          {
            current_period_end: 1_788_307_200,
            price: { id: 'price_monthly' },
          },
        ],
      },
      object: 'subscription',
      status: 'active',
    },
  },
  id: 'evt_contract',
  livemode: false,
  object: 'event',
  pending_webhooks: 1,
  request: null,
  type: 'customer.subscription.updated',
})

describe('Stripe billing adapter', () => {
  it('rejects invalid signatures and normalizes a verified subscription event', async () => {
    const provider = createStripeBillingProvider('sk_test_contract')

    await expect(provider.parseWebhook(payload, 'invalid', secret)).rejects.toBeInstanceOf(
      BillingWebhookVerificationError,
    )

    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret })
    await expect(provider.parseWebhook(payload, signature, secret)).resolves.toMatchObject({
      id: 'evt_contract',
      subscription: {
        customerId: 'cus_contract',
        id: 'sub_contract',
        priceId: 'price_monthly',
        status: 'active',
      },
      type: 'subscription.changed',
    })
  })
})
