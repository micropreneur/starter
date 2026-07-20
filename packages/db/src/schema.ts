import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const id = (name: string) => text(name).primaryKey()
const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())

export const users = sqliteTable('users', {
  id: id('id'),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: id('id'),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['personal'] })
      .notNull()
      .default('personal'),
    avatarUrl: text('avatar_url'),
    productType: text('product_type', {
      enum: ['saas', 'marketplace', 'client_service', 'internal_tool', 'other'],
    }),
    primaryGoal: text('primary_goal', {
      enum: ['validate', 'launch', 'grow', 'migrate'],
    }),
    onboardingCompletedAt: integer('onboarding_completed_at', { mode: 'timestamp_ms' }),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('workspaces_created_by_user_id_uidx').on(table.createdByUserId),
    index('workspaces_kind_idx').on(table.kind),
  ],
)

export const workspaceMembers = sqliteTable(
  'workspace_members',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner'] })
      .notNull()
      .default('owner'),
    status: text('status', { enum: ['active', 'inactive'] })
      .notNull()
      .default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    uniqueIndex('workspace_members_workspace_id_uidx').on(table.workspaceId),
    uniqueIndex('workspace_members_user_id_uidx').on(table.userId),
    index('workspace_members_user_status_idx').on(table.userId, table.status),
    index('workspace_members_workspace_status_idx').on(table.workspaceId, table.status),
  ],
)

export const sessions = sqliteTable(
  'sessions',
  {
    id: id('id'),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

export const accounts = sqliteTable(
  'accounts',
  {
    id: id('id'),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)],
)

export const verifications = sqliteTable(
  'verifications',
  {
    id: id('id'),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)

export const operationRecords = sqliteTable(
  'operation_records',
  {
    id: id('id'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    status: text('status', {
      enum: ['draft', 'active', 'needs_review', 'archived'],
    })
      .notNull()
      .default('draft'),
    priority: text('priority', { enum: ['low', 'medium', 'high'] })
      .notNull()
      .default('medium'),
    reviewAt: integer('review_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('operation_records_user_id_idx').on(table.userId),
    index('operation_records_user_status_idx').on(table.userId, table.status),
    index('operation_records_user_priority_idx').on(table.userId, table.priority),
    index('operation_records_user_review_at_idx').on(table.userId, table.reviewAt),
    index('operation_records_user_updated_at_idx').on(table.userId, table.updatedAt),
  ],
)

export const operationRecordTags = sqliteTable(
  'operation_record_tags',
  {
    recordId: text('record_id')
      .notNull()
      .references(() => operationRecords.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.recordId, table.name] }),
    index('operation_record_tags_name_idx').on(table.name),
  ],
)

export const billingCustomers = sqliteTable(
  'billing_customers',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('billing_customers_stripe_customer_id_uidx').on(table.stripeCustomerId)],
)

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: id('id'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    stripeSubscriptionId: text('stripe_subscription_id').notNull(),
    priceId: text('price_id').notNull(),
    status: text('status', {
      enum: [
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused',
      ],
    }).notNull(),
    cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' })
      .notNull()
      .default(false),
    currentPeriodEnd: integer('current_period_end', { mode: 'timestamp_ms' }),
    eventCreatedAt: integer('event_created_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('subscriptions_user_id_uidx').on(table.userId),
    uniqueIndex('subscriptions_stripe_subscription_id_uidx').on(table.stripeSubscriptionId),
    index('subscriptions_stripe_customer_id_idx').on(table.stripeCustomerId),
  ],
)

export const stripeWebhookEvents = sqliteTable('stripe_webhook_events', {
  id: id('id'),
  type: text('type').notNull(),
  processedAt: createdAt(),
})
