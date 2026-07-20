import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  accounts,
  billingCustomers,
  operationRecords,
  operationRecordTags,
  sessions,
  stripeWebhookEvents,
  subscriptions,
  users,
  verifications,
  workspaceMembers,
  workspaces,
} from './schema'

describe('starter D1 schema', () => {
  it('keeps auth tables provider-neutral', () => {
    expect([
      getTableName(users),
      getTableName(sessions),
      getTableName(accounts),
      getTableName(verifications),
    ]).toEqual(['users', 'sessions', 'accounts', 'verifications'])
  })

  it('keeps the single-member workspace seam explicit', () => {
    expect([getTableName(workspaces), getTableName(workspaceMembers)]).toEqual([
      'workspaces',
      'workspace_members',
    ])
  })

  it('keeps the example and billing tables explicitly scoped', () => {
    expect([
      getTableName(operationRecords),
      getTableName(operationRecordTags),
      getTableName(billingCustomers),
      getTableName(subscriptions),
      getTableName(stripeWebhookEvents),
    ]).toEqual([
      'operation_records',
      'operation_record_tags',
      'billing_customers',
      'subscriptions',
      'stripe_webhook_events',
    ])
  })
})
