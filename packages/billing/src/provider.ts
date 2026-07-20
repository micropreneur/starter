import type { BillingUser, SubscriptionStatus } from './port'

export interface ProviderSubscription {
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
  customerId: string
  eventCreatedAt: Date
  id: string
  priceId: string
  status: SubscriptionStatus
}

export type BillingProviderEvent =
  | {
      createdAt: Date
      id: string
      subscription: ProviderSubscription
      type: 'subscription.changed'
    }
  | {
      createdAt: Date
      customerId: string
      id: string
      status: 'past_due'
      type: 'invoice.changed'
    }
  | { createdAt: Date; id: string; type: 'ignored' }

export interface BillingProviderPort {
  createCheckout(input: {
    cancelUrl: string
    customerId: string
    idempotencyKey: string
    priceId: string
    successUrl: string
    userId: string
  }): Promise<string>
  createCustomer(user: BillingUser): Promise<string>
  createPortal(customerId: string, returnUrl: string): Promise<string>
  hasOpenSubscription(customerId: string): Promise<boolean>
  parseWebhook(payload: string, signature: string, secret: string): Promise<BillingProviderEvent>
}
