export const billableFeatures = ['registry.export'] as const
export type BillableFeature = (typeof billableFeatures)[number]

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export interface BillingUser {
  id: string
  email: string
  name: string
}

export interface Subscription {
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
  priceId: string
  status: SubscriptionStatus
  userId: string
}

export interface CheckoutInput {
  cancelUrl: string
  successUrl: string
  user: BillingUser
}

export interface BillingService {
  readonly configured: boolean
  canDeleteAccount(userId: string): Promise<boolean>
  createCheckout(input: CheckoutInput): Promise<string>
  createPortal(userId: string, returnUrl: string): Promise<string>
  getSubscription(userId: string): Promise<Subscription | null>
  handleWebhook(payload: string, signature: string): Promise<'processed' | 'duplicate' | 'ignored'>
  hasFeature(userId: string, feature: BillableFeature): Promise<boolean>
  requireFeature(userId: string, feature: BillableFeature): Promise<void>
}

export function isOpenSubscription(subscription: Subscription | null): boolean {
  return Boolean(
    subscription &&
      subscription.status !== 'canceled' &&
      subscription.status !== 'incomplete_expired',
  )
}

export class BillingNotConfiguredError extends Error {
  override readonly name = 'BillingNotConfiguredError'

  constructor() {
    super('Stripe billing is not configured for this environment.')
  }
}

export class FeatureNotAvailableError extends Error {
  override readonly name = 'FeatureNotAvailableError'

  constructor(readonly feature: BillableFeature) {
    super(`The ${feature} feature requires an active paid subscription.`)
  }
}

export class ExistingSubscriptionError extends Error {
  override readonly name = 'ExistingSubscriptionError'

  constructor() {
    super('An existing Stripe subscription must be managed through the customer portal.')
  }
}

export class BillingWebhookVerificationError extends Error {
  override readonly name = 'BillingWebhookVerificationError'

  constructor() {
    super('The Stripe webhook signature could not be verified.')
  }
}
