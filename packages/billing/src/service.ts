import {
  billingCustomers,
  type Database,
  stripeWebhookEvents,
  subscriptions,
} from '@micropreneur/db'
import { and, eq, inArray, lt } from 'drizzle-orm'
import {
  type BillableFeature,
  BillingNotConfiguredError,
  type BillingService,
  type CheckoutInput,
  ExistingSubscriptionError,
  FeatureNotAvailableError,
  isOpenSubscription,
  type Subscription,
} from './port'
import type { BillingProviderEvent, BillingProviderPort, ProviderSubscription } from './provider'

export interface StripeBillingServiceOptions {
  database: Database
  priceId: string
  provider: BillingProviderPort
  webhookSecret: string
}

export function createStripeBillingService(options: StripeBillingServiceOptions): BillingService {
  if (!options.priceId.trim()) throw new Error('STRIPE_PRICE_ID is required for Stripe billing.')
  if (!options.webhookSecret.trim()) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for Stripe billing.')
  }

  return {
    configured: true,
    async canDeleteAccount(userId) {
      if (isOpenSubscription(await getSubscription(options.database, userId))) return false
      const customerId = await getCustomerId(options.database, userId)
      return customerId ? !(await options.provider.hasOpenSubscription(customerId)) : true
    },
    async createCheckout(input) {
      if (isOpenSubscription(await getSubscription(options.database, input.user.id))) {
        throw new ExistingSubscriptionError()
      }
      const customerId = await findOrCreateCustomer(options, input)
      if (await options.provider.hasOpenSubscription(customerId)) {
        throw new ExistingSubscriptionError()
      }
      const checkoutGeneration = await getCheckoutGeneration(options.database, input.user.id)
      return options.provider.createCheckout({
        cancelUrl: input.cancelUrl,
        customerId,
        idempotencyKey: `starter-checkout-${input.user.id.slice(0, 128)}-${checkoutGeneration}`,
        priceId: options.priceId,
        successUrl: input.successUrl,
        userId: input.user.id,
      })
    },
    async createPortal(userId, returnUrl) {
      const [customer] = await options.database
        .select()
        .from(billingCustomers)
        .where(eq(billingCustomers.userId, userId))
        .limit(1)
      if (!customer) throw new Error('No Stripe customer exists for this account.')
      return options.provider.createPortal(customer.stripeCustomerId, returnUrl)
    },
    getSubscription(userId) {
      return getSubscription(options.database, userId)
    },
    async handleWebhook(payload, signature) {
      const event = await options.provider.parseWebhook(payload, signature, options.webhookSecret)
      return processEvent(options.database, event)
    },
    async hasFeature(userId, feature) {
      return hasFeature(await getSubscription(options.database, userId), feature, options.priceId)
    },
    async requireFeature(userId, feature) {
      if (!hasFeature(await getSubscription(options.database, userId), feature, options.priceId)) {
        throw new FeatureNotAvailableError(feature)
      }
    },
  }
}

export function createDisabledBillingService(database?: Database): BillingService {
  const unavailable = async (): Promise<never> => {
    throw new BillingNotConfiguredError()
  }
  return {
    configured: false,
    async canDeleteAccount(userId) {
      return database ? (await getCustomerId(database, userId)) === null : true
    },
    createCheckout: unavailable,
    createPortal: unavailable,
    async getSubscription() {
      return null
    },
    handleWebhook: unavailable,
    async hasFeature() {
      return false
    },
    async requireFeature(_userId, feature) {
      throw new FeatureNotAvailableError(feature)
    },
  }
}

async function getCustomerId(database: Database, userId: string): Promise<string | null> {
  const [customer] = await database
    .select({ stripeCustomerId: billingCustomers.stripeCustomerId })
    .from(billingCustomers)
    .where(eq(billingCustomers.userId, userId))
    .limit(1)
  return customer?.stripeCustomerId ?? null
}

async function getCheckoutGeneration(database: Database, userId: string): Promise<string> {
  const [subscription] = await database
    .select({ eventCreatedAt: subscriptions.eventCreatedAt })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)
  return subscription ? String(subscription.eventCreatedAt.getTime()) : 'initial'
}

async function findOrCreateCustomer(options: StripeBillingServiceOptions, input: CheckoutInput) {
  const [existing] = await options.database
    .select()
    .from(billingCustomers)
    .where(eq(billingCustomers.userId, input.user.id))
    .limit(1)
  if (existing) return existing.stripeCustomerId

  const stripeCustomerId = await options.provider.createCustomer(input.user)
  await options.database
    .insert(billingCustomers)
    .values({ stripeCustomerId, userId: input.user.id })
    .onConflictDoUpdate({
      set: { stripeCustomerId, updatedAt: new Date() },
      target: billingCustomers.userId,
    })
  return stripeCustomerId
}

async function getSubscription(database: Database, userId: string): Promise<Subscription | null> {
  const [subscription] = await database
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)
  if (!subscription) return null
  return {
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
    priceId: subscription.priceId,
    status: subscription.status,
    userId: subscription.userId,
  }
}

function hasFeature(
  subscription: Subscription | null,
  _feature: BillableFeature,
  expectedPriceId: string,
) {
  return (
    subscription?.priceId === expectedPriceId &&
    (subscription.status === 'active' || subscription.status === 'trialing')
  )
}

async function processEvent(
  database: Database,
  event: BillingProviderEvent,
): Promise<'processed' | 'duplicate' | 'ignored'> {
  if (event.type === 'ignored') {
    const inserted = await createEventMarker(database, event)
    return inserted.length === 0 ? 'duplicate' : 'ignored'
  }

  const customerId =
    event.type === 'subscription.changed' ? event.subscription.customerId : event.customerId
  const [customer] = await database
    .select({ userId: billingCustomers.userId })
    .from(billingCustomers)
    .where(eq(billingCustomers.stripeCustomerId, customerId))
    .limit(1)
  if (!customer) {
    const inserted = await createEventMarker(database, event)
    return inserted.length === 0 ? 'duplicate' : 'ignored'
  }

  const mutation =
    event.type === 'subscription.changed'
      ? subscriptionUpsert(database, customer.userId, event.subscription)
      : database
          .update(subscriptions)
          .set({ eventCreatedAt: event.createdAt, status: event.status, updatedAt: new Date() })
          .where(
            and(
              eq(subscriptions.userId, customer.userId),
              lt(subscriptions.eventCreatedAt, event.createdAt),
              inArray(subscriptions.status, ['active', 'trialing', 'past_due']),
            ),
          )

  // D1/Drizzle batches are transactional. The event marker and entitlement
  // mutation either commit together or both roll back for a safe Stripe retry.
  const [inserted] = await database.batch([createEventMarker(database, event), mutation])
  return inserted.length === 0 ? 'duplicate' : 'processed'
}

function createEventMarker(database: Database, event: BillingProviderEvent) {
  return database
    .insert(stripeWebhookEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: stripeWebhookEvents.id })
}

function subscriptionUpsert(database: Database, userId: string, incoming: ProviderSubscription) {
  return database
    .insert(subscriptions)
    .values({
      cancelAtPeriodEnd: incoming.cancelAtPeriodEnd,
      currentPeriodEnd: incoming.currentPeriodEnd,
      eventCreatedAt: incoming.eventCreatedAt,
      id: crypto.randomUUID(),
      priceId: incoming.priceId,
      status: incoming.status,
      stripeCustomerId: incoming.customerId,
      stripeSubscriptionId: incoming.id,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        cancelAtPeriodEnd: incoming.cancelAtPeriodEnd,
        currentPeriodEnd: incoming.currentPeriodEnd,
        eventCreatedAt: incoming.eventCreatedAt,
        priceId: incoming.priceId,
        status: incoming.status,
        stripeCustomerId: incoming.customerId,
        stripeSubscriptionId: incoming.id,
        updatedAt: new Date(),
      },
      setWhere: lt(subscriptions.eventCreatedAt, incoming.eventCreatedAt),
      target: subscriptions.userId,
    })
}
