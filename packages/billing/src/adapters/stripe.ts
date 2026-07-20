import Stripe from 'stripe'
import { BillingWebhookVerificationError, type SubscriptionStatus } from '../port'
import type { BillingProviderEvent, BillingProviderPort, ProviderSubscription } from '../provider'

export function createStripeBillingProvider(secretKey: string): BillingProviderPort {
  if (!secretKey.trim()) throw new Error('STRIPE_SECRET_KEY is required for the Stripe adapter.')
  const stripe = new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() })

  return {
    async createCustomer(user) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: { userId: user.id },
          name: user.name,
        },
        { idempotencyKey: `starter-customer-${user.id}` },
      )
      return customer.id
    },
    async createCheckout(input) {
      const session = await stripe.checkout.sessions.create(
        {
          cancel_url: input.cancelUrl,
          client_reference_id: input.userId,
          customer: input.customerId,
          line_items: [{ price: input.priceId, quantity: 1 }],
          metadata: { userId: input.userId },
          mode: 'subscription',
          subscription_data: { metadata: { userId: input.userId } },
          success_url: input.successUrl,
        },
        { idempotencyKey: input.idempotencyKey },
      )
      if (!session.url) throw new Error('Stripe Checkout did not return a redirect URL.')
      return session.url
    },
    async createPortal(customerId, returnUrl) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })
      return session.url
    },
    async hasOpenSubscription(customerId) {
      const subscriptions = stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
        status: 'all',
      })
      for await (const subscription of subscriptions) {
        if (subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired') {
          return true
        }
      }
      return false
    },
    async parseWebhook(payload, signature, secret): Promise<BillingProviderEvent> {
      let event: Stripe.Event
      try {
        event = await stripe.webhooks.constructEventAsync(
          payload,
          signature,
          secret,
          undefined,
          Stripe.createSubtleCryptoProvider(),
        )
      } catch (error) {
        if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
          throw new BillingWebhookVerificationError()
        }
        throw error
      }
      const createdAt = new Date(event.created * 1000)

      if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        return {
          createdAt,
          id: event.id,
          subscription: normalizeSubscription(event.data.object, createdAt),
          type: 'subscription.changed',
        }
      }

      if (event.type === 'invoice.payment_failed') {
        const customerId = idFromExpandable(event.data.object.customer)
        if (!customerId) return { createdAt, id: event.id, type: 'ignored' }
        return {
          createdAt,
          customerId,
          id: event.id,
          status: 'past_due',
          type: 'invoice.changed',
        }
      }

      return { createdAt, id: event.id, type: 'ignored' }
    },
  }
}

function normalizeSubscription(
  subscription: Stripe.Subscription,
  eventCreatedAt: Date,
): ProviderSubscription {
  const firstItem = subscription.items.data[0]
  if (!firstItem) throw new Error('Stripe subscription does not contain a price item.')
  const customerId = idFromExpandable(subscription.customer)
  if (!customerId) throw new Error('Stripe subscription does not contain a customer ID.')

  return {
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: firstItem.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : null,
    customerId,
    eventCreatedAt,
    id: subscription.id,
    priceId: firstItem.price.id,
    status: normalizeStatus(subscription.status),
  }
}

function normalizeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'incomplete':
      return 'incomplete'
    case 'incomplete_expired':
      return 'incomplete_expired'
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'unpaid':
      return 'unpaid'
    case 'paused':
      return 'paused'
    default:
      throw new Error(`Unsupported Stripe subscription status: ${status}`)
  }
}

function idFromExpandable(value: string | { id: string } | null): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}
