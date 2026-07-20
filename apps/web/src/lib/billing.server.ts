import { env as cloudflareEnv } from 'cloudflare:workers'
import {
  type BillingService,
  createDisabledBillingService,
  createStripeBillingProvider,
  createStripeBillingService,
} from '@micropreneur/billing'
import { createDb } from '@micropreneur/db'

import type { WebEnv } from '../env'

let cachedBilling: BillingService | undefined

export function getBilling(): BillingService {
  if (cachedBilling) return cachedBilling
  const env = cloudflareEnv as unknown as WebEnv
  const database = createDb(env.DB)
  const values = [env.STRIPE_SECRET_KEY, env.STRIPE_PRICE_ID, env.STRIPE_WEBHOOK_SECRET]
  if (values.every((value) => !value)) {
    cachedBilling = createDisabledBillingService(database)
    return cachedBilling
  }
  if (values.some((value) => !value)) {
    throw new Error(
      'STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and STRIPE_WEBHOOK_SECRET must be configured together.',
    )
  }

  cachedBilling = createStripeBillingService({
    database,
    priceId: env.STRIPE_PRICE_ID as string,
    provider: createStripeBillingProvider(env.STRIPE_SECRET_KEY as string),
    webhookSecret: env.STRIPE_WEBHOOK_SECRET as string,
  })
  return cachedBilling
}
