import { readdirSync, readFileSync } from 'node:fs'
import {
  billingCustomers,
  createDb,
  stripeWebhookEvents,
  subscriptions,
  users,
} from '@micropreneur/db'
import { eq } from 'drizzle-orm'
import { Miniflare } from 'miniflare'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { BillingProviderEvent, BillingProviderPort } from './provider'
import { createDisabledBillingService, createStripeBillingService } from './service'

const migrationsDirectory = new URL('../../db/migrations/', import.meta.url)

let miniflare: Miniflare
let database: ReturnType<typeof createDb>

beforeAll(async () => {
  miniflare = new Miniflare({
    d1Databases: ['DB'],
    modules: true,
    script: 'export default { fetch: () => new Response(null, { status: 404 }) }',
  })
  const d1 = (await miniflare.getD1Database('DB')) as unknown as D1Database

  for (const filename of readdirSync(migrationsDirectory)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const migration = readFileSync(new URL(filename, migrationsDirectory), 'utf8')
    for (const statement of migration.split('--> statement-breakpoint')) {
      const sql = statement.trim()
      if (sql) await d1.prepare(sql).run()
    }
  }

  await d1
    .prepare(
      'INSERT INTO users (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)',
    )
    .bind(
      'user-a',
      'Ada',
      'ada@example.com',
      1,
      Date.now(),
      Date.now(),
      'user-b',
      'Grace',
      'grace@example.com',
      1,
      Date.now(),
      Date.now(),
    )
    .run()

  database = createDb(d1)
})

afterAll(async () => {
  await miniflare.dispose()
})

describe('billing service', () => {
  it('creates one customer and exposes the paid entitlement from webhook state', async () => {
    let event: BillingProviderEvent = subscriptionEvent('event-active', 'active', 2)
    const provider: BillingProviderPort = {
      createCheckout: vi.fn(async () => 'https://checkout.stripe.test/session'),
      createCustomer: vi.fn(async () => 'cus_ada'),
      createPortal: vi.fn(async () => 'https://billing.stripe.test/portal'),
      hasOpenSubscription: vi.fn(async () => false),
      parseWebhook: vi.fn(async () => event),
    }
    const billing = createStripeBillingService({
      database,
      priceId: 'price_monthly',
      provider,
      webhookSecret: 'whsec_test',
    })

    const checkoutUrl = await billing.createCheckout({
      cancelUrl: 'http://localhost:3000/app/settings?billing=cancelled',
      successUrl: 'http://localhost:3000/app/settings?billing=success',
      user: { email: 'ada@example.com', id: 'user-a', name: 'Ada' },
    })
    await billing.createCheckout({
      cancelUrl: 'http://localhost:3000/app/settings',
      successUrl: 'http://localhost:3000/app/settings',
      user: { email: 'ada@example.com', id: 'user-a', name: 'Ada' },
    })

    expect(checkoutUrl).toBe('https://checkout.stripe.test/session')
    expect(provider.createCustomer).toHaveBeenCalledTimes(1)
    expect(provider.createCheckout).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    )
    expect(provider.createCheckout).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        idempotencyKey: vi.mocked(provider.createCheckout).mock.calls[0]?.[0].idempotencyKey,
      }),
    )
    await expect(
      billing.createPortal('user-a', 'http://localhost:3000/app/settings'),
    ).resolves.toBe('https://billing.stripe.test/portal')
    expect(await billing.handleWebhook('{}', 'signature')).toBe('processed')
    expect(await billing.handleWebhook('{}', 'signature')).toBe('duplicate')
    expect(await billing.hasFeature('user-a', 'registry.export')).toBe(true)
    await expect(
      billing.createCheckout({
        cancelUrl: 'http://localhost:3000/app/settings',
        successUrl: 'http://localhost:3000/app/settings',
        user: { email: 'ada@example.com', id: 'user-a', name: 'Ada' },
      }),
    ).rejects.toThrow('customer portal')
    await expect(billing.canDeleteAccount('user-a')).resolves.toBe(false)

    event = subscriptionEvent('event-stale', 'past_due', 1)
    expect(await billing.handleWebhook('{}', 'signature')).toBe('processed')
    expect((await billing.getSubscription('user-a'))?.status).toBe('active')

    event = subscriptionEvent('event-past-due', 'past_due', 3)
    await billing.handleWebhook('{}', 'signature')
    expect(await billing.hasFeature('user-a', 'registry.export')).toBe(false)

    event = subscriptionEvent('event-wrong-price', 'active', 4, 'price_unrelated')
    await billing.handleWebhook('{}', 'signature')
    expect(await billing.hasFeature('user-a', 'registry.export')).toBe(false)

    event = subscriptionEvent('event-canceled', 'canceled', 5)
    await billing.handleWebhook('{}', 'signature')
    expect((await billing.getSubscription('user-a'))?.status).toBe('canceled')
    await expect(billing.canDeleteAccount('user-a')).resolves.toBe(true)
  })

  it('checks Stripe before creating checkout or allowing account deletion', async () => {
    const provider: BillingProviderPort = {
      createCheckout: vi.fn(async () => 'https://checkout.stripe.test/session'),
      createCustomer: vi.fn(async () => 'cus_grace'),
      createPortal: vi.fn(async () => 'https://billing.stripe.test/portal'),
      hasOpenSubscription: vi.fn(async () => true),
      parseWebhook: vi.fn(async () => ({
        createdAt: new Date(),
        id: 'unused',
        type: 'ignored' as const,
      })),
    }
    const billing = createStripeBillingService({
      database,
      priceId: 'price_monthly',
      provider,
      webhookSecret: 'whsec_test',
    })

    await expect(
      billing.createCheckout({
        cancelUrl: 'http://localhost:3000/app/settings',
        successUrl: 'http://localhost:3000/app/settings',
        user: { email: 'grace@example.com', id: 'user-b', name: 'Grace' },
      }),
    ).rejects.toThrow('customer portal')
    expect(provider.createCheckout).not.toHaveBeenCalled()
    await expect(billing.canDeleteAccount('user-b')).resolves.toBe(false)
  })

  it('removes the idempotency marker when processing fails', async () => {
    const [customer] = await database
      .select()
      .from(billingCustomers)
      .where(eq(billingCustomers.userId, 'user-a'))
      .limit(1)
    expect(customer?.stripeCustomerId).toBe('cus_ada')

    const provider: BillingProviderPort = {
      async createCheckout() {
        return 'unused'
      },
      async createCustomer() {
        return 'unused'
      },
      async createPortal() {
        return 'unused'
      },
      async hasOpenSubscription() {
        return false
      },
      async parseWebhook() {
        const invalid = subscriptionEvent('event-invalid', 'active', 6)
        return {
          ...invalid,
          subscription: { ...invalid.subscription, priceId: null as never },
        }
      },
    }
    const billing = createStripeBillingService({
      database,
      priceId: 'price_monthly',
      provider,
      webhookSecret: 'whsec_test',
    })

    await expect(billing.handleWebhook('{}', 'signature')).rejects.toThrow()
    const marker = await database
      .select()
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.id, 'event-invalid'))
    expect(marker).toHaveLength(0)
  })

  it('keeps the newest subscription when webhook deliveries race', async () => {
    const userId = 'user-concurrent-webhooks'
    const customerId = 'cus_concurrent_webhooks'
    await database.insert(users).values({
      email: 'webhooks@example.com',
      emailVerified: true,
      id: userId,
      name: 'Webhook Tester',
    })
    await database.insert(billingCustomers).values({ stripeCustomerId: customerId, userId })

    const older = subscriptionEvent('event-concurrent-older', 'past_due', 1, 'price_monthly', {
      customerId,
      subscriptionId: 'sub_concurrent',
    })
    const newer = subscriptionEvent('event-concurrent-newer', 'active', 2, 'price_monthly', {
      customerId,
      subscriptionId: 'sub_concurrent',
    })
    const serviceFor = (event: BillingProviderEvent) =>
      createStripeBillingService({
        database,
        priceId: 'price_monthly',
        provider: providerForEvent(event),
        webhookSecret: 'whsec_test',
      })

    await Promise.all([
      serviceFor(newer).handleWebhook('{}', 'signature'),
      serviceFor(older).handleWebhook('{}', 'signature'),
    ])

    const [subscription] = await database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)
    expect(subscription).toMatchObject({
      eventCreatedAt: newer.subscription.eventCreatedAt,
      status: 'active',
    })
  })

  it('keeps secret-free local development disabled and explicit', async () => {
    const billing = createDisabledBillingService()
    expect(billing.configured).toBe(false)
    expect(await billing.hasFeature('user-a', 'registry.export')).toBe(false)
    await expect(billing.canDeleteAccount('user-a')).resolves.toBe(true)
    await expect(
      billing.createPortal('user-a', 'http://localhost:3000/app/settings'),
    ).rejects.toThrow('not configured')
    await expect(billing.requireFeature('user-a', 'registry.export')).rejects.toThrow(
      'active paid subscription',
    )
    await expect(createDisabledBillingService(database).canDeleteAccount('user-a')).resolves.toBe(
      false,
    )
  })
})

function subscriptionEvent(
  id: string,
  status: 'active' | 'canceled' | 'past_due',
  createdMinute: number,
  priceId = 'price_monthly',
  identifiers: { customerId?: string; subscriptionId?: string } = {},
): Extract<BillingProviderEvent, { type: 'subscription.changed' }> {
  const createdAt = new Date(`2026-08-01T00:0${createdMinute}:00.000Z`)
  return {
    createdAt,
    id,
    subscription: {
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
      customerId: identifiers.customerId ?? 'cus_ada',
      eventCreatedAt: createdAt,
      id: identifiers.subscriptionId ?? 'sub_ada',
      priceId,
      status,
    },
    type: 'subscription.changed',
  }
}

function providerForEvent(event: BillingProviderEvent): BillingProviderPort {
  return {
    async createCheckout() {
      return 'unused'
    },
    async createCustomer() {
      return 'unused'
    },
    async createPortal() {
      return 'unused'
    },
    async hasOpenSubscription() {
      return false
    },
    async parseWebhook() {
      return event
    },
  }
}
