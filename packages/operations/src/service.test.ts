import { readdirSync, readFileSync } from 'node:fs'
import { createDb, operationRecords, operationRecordTags } from '@micropreneur/db'
import { Miniflare } from 'miniflare'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createOperationRecord,
  deleteOperationRecord,
  getOperationRecord,
  listOperationRecords,
  OperationRecordNotFoundError,
  updateOperationRecord,
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

const input = {
  priority: 'high' as const,
  reviewAt: '2026-09-01T12:00:00.000Z',
  status: 'active' as const,
  summary: 'A vendor record ready for review.',
  tags: ['Vendor', 'Security', 'vendor'],
  title: 'Acme Cloud',
}

describe('operations service', () => {
  it('creates, lists, filters, and updates records for their owner', async () => {
    const created = await createOperationRecord(database, 'user-a', input)
    expect(created.tags).toEqual(['security', 'vendor'])

    const listed = await listOperationRecords(database, 'user-a', {
      page: 1,
      pageSize: 20,
      search: 'Acme',
      sort: 'updated_desc',
      tag: 'security',
    })
    expect(listed.total).toBe(1)
    expect(listed.items[0]?.id).toBe(created.id)

    const updated = await updateOperationRecord(database, 'user-a', created.id, {
      ...input,
      priority: 'medium',
      status: 'needs_review',
      tags: ['review'],
    })
    expect(updated.status).toBe('needs_review')
    expect(updated.tags).toEqual(['review'])
  })

  it("does not disclose or mutate another user's records", async () => {
    const created = await createOperationRecord(database, 'user-a', {
      ...input,
      title: 'Private record',
    })

    expect(await getOperationRecord(database, 'user-b', created.id)).toBeNull()
    await expect(
      updateOperationRecord(database, 'user-b', created.id, input),
    ).rejects.toBeInstanceOf(OperationRecordNotFoundError)
    await expect(deleteOperationRecord(database, 'user-b', created.id)).rejects.toBeInstanceOf(
      OperationRecordNotFoundError,
    )

    await deleteOperationRecord(database, 'user-a', created.id)
    expect(await getOperationRecord(database, 'user-a', created.id)).toBeNull()
  })

  it('filters tags inside the owner-scoped query without expanding record IDs', async () => {
    const tag = 'shared-scale-tag'
    const otherRecords = Array.from({ length: 110 }, (_, index) => ({
      id: `other-user-tagged-${index}`,
      priority: input.priority,
      reviewAt: new Date(input.reviewAt),
      status: input.status,
      summary: input.summary,
      title: `Other user record ${index}`,
      userId: 'user-b',
    }))

    for (let index = 0; index < otherRecords.length; index += 10) {
      const records = otherRecords.slice(index, index + 10)
      await database.insert(operationRecords).values(records)
      await database.insert(operationRecordTags).values(
        records.map((record) => ({
          name: tag,
          recordId: record.id,
        })),
      )
    }

    const owned = await createOperationRecord(database, 'user-a', {
      ...input,
      tags: [tag],
      title: 'Owned tagged record',
    })

    const result = await listOperationRecords(database, 'user-a', {
      page: 1,
      pageSize: 20,
      search: '',
      sort: 'updated_desc',
      tag,
    })

    expect(result.total).toBe(1)
    expect(result.items.map((record) => record.id)).toEqual([owned.id])
  })

  it('rolls back record and tag changes when a tag write fails', async () => {
    const triggerName = 'reject_atomicity_test_tag'
    await database.$client
      .prepare(
        `CREATE TRIGGER ${triggerName}
         BEFORE INSERT ON operation_record_tags
         WHEN NEW.name = 'reject-atomicity'
         BEGIN
           SELECT RAISE(ABORT, 'rejected test tag');
         END`,
      )
      .run()

    try {
      await expect(
        createOperationRecord(database, 'user-a', {
          ...input,
          tags: ['reject-atomicity'],
          title: 'Atomic create failure',
        }),
      ).rejects.toThrow('rejected test tag')
      const failedCreate = await listOperationRecords(database, 'user-a', {
        page: 1,
        pageSize: 20,
        search: 'Atomic create failure',
        sort: 'updated_desc',
      })
      expect(failedCreate.total).toBe(0)

      const original = await createOperationRecord(database, 'user-a', {
        ...input,
        tags: ['original'],
        title: 'Atomic update record',
      })
      await expect(
        updateOperationRecord(database, 'user-a', original.id, {
          ...input,
          tags: ['reject-atomicity'],
          title: 'Partially updated title',
        }),
      ).rejects.toThrow('rejected test tag')
      await expect(getOperationRecord(database, 'user-a', original.id)).resolves.toMatchObject({
        tags: ['original'],
        title: 'Atomic update record',
      })
    } finally {
      await database.$client.prepare(`DROP TRIGGER IF EXISTS ${triggerName}`).run()
    }
  })
})
