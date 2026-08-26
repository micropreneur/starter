import { readdirSync, readFileSync } from 'node:fs'
import { createDb, workspaceMembers, workspaces } from '@micropreneur/db'
import { eq } from 'drizzle-orm'
import { Miniflare } from 'miniflare'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  bootstrapPersonalWorkspace,
  completePersonalWorkspaceOnboarding,
  completePersonalWorkspaceOnboardingForEmail,
  personalWorkspaceId,
  requireActiveWorkspace,
  WorkspaceAccessError,
} from './service'

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
      'workspace-user-a',
      'Ada',
      'ada-workspace@example.com',
      1,
      Date.now(),
      Date.now(),
      'workspace-user-b',
      'Grace',
      'grace-workspace@example.com',
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

describe('personal workspace onboarding', () => {
  it('bootstraps exactly one personal workspace across retries', async () => {
    const user = {
      email: 'ada-workspace@example.com',
      id: 'workspace-user-a',
      name: 'Ada',
    }

    await bootstrapPersonalWorkspace(database, user)
    await bootstrapPersonalWorkspace(database, user)

    await expect(requireActiveWorkspace(database, user.id)).resolves.toMatchObject({
      id: personalWorkspaceId(user.id),
      onboardingComplete: false,
      role: 'owner',
    })
    await expect(
      database.select().from(workspaces).where(eq(workspaces.createdByUserId, user.id)),
    ).resolves.toHaveLength(1)
    await expect(
      database.select().from(workspaceMembers).where(eq(workspaceMembers.userId, user.id)),
    ).resolves.toHaveLength(1)
  })

  it('names the personal workspace without accepting a workspace ID', async () => {
    await bootstrapPersonalWorkspace(database, {
      email: 'grace-workspace@example.com',
      id: 'workspace-user-b',
      name: 'Grace',
    })

    await expect(
      completePersonalWorkspaceOnboarding(database, 'workspace-user-b', {
        name: 'Compiler Club',
      }),
    ).resolves.toMatchObject({
      name: 'Compiler Club',
      onboardingComplete: true,
      primaryGoal: null,
      productType: null,
    })

    await expect(
      completePersonalWorkspaceOnboardingForEmail(database, 'GRACE-WORKSPACE@example.com', {
        name: 'Compiler Club v2',
      }),
    ).resolves.toMatchObject({ name: 'Compiler Club v2', primaryGoal: null, productType: null })
  })

  it('fails closed for missing and inactive memberships', async () => {
    await expect(requireActiveWorkspace(database, 'missing-user')).rejects.toMatchObject({
      reason: 'membership_missing',
    })

    await database
      .update(workspaceMembers)
      .set({ status: 'inactive' })
      .where(eq(workspaceMembers.userId, 'workspace-user-b'))

    await expect(requireActiveWorkspace(database, 'workspace-user-b')).rejects.toBeInstanceOf(
      WorkspaceAccessError,
    )
  })
})
