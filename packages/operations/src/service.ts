import { type Database, operationRecords, operationRecordTags } from '@micropreneur/db'
import { and, asc, count, desc, eq, exists, inArray, or, sql } from 'drizzle-orm'

import {
  type OperationRecord,
  type OperationRecordInput,
  type OperationRecordListInput,
  operationRecordInputSchema,
  operationRecordListSchema,
} from './schema'

export class OperationRecordNotFoundError extends Error {
  override readonly name = 'OperationRecordNotFoundError'

  constructor() {
    super('Operation record not found')
  }
}

export async function createOperationRecord(
  database: Database,
  workspaceId: string,
  input: OperationRecordInput,
): Promise<OperationRecord> {
  const parsed = operationRecordInputSchema.parse(input)
  const id = crypto.randomUUID()
  const now = new Date()

  const recordInsert = database.insert(operationRecords).values({
    id,
    priority: parsed.priority,
    reviewAt: parsed.reviewAt ? new Date(parsed.reviewAt) : null,
    status: parsed.status,
    summary: parsed.summary,
    title: parsed.title,
    workspaceId,
  })

  if (parsed.tags.length === 0) await recordInsert
  else {
    await database.batch([
      recordInsert,
      database.insert(operationRecordTags).values(
        parsed.tags.map((name) => ({
          name,
          recordId: id,
        })),
      ),
    ])
  }

  return {
    ...parsed,
    createdAt: now,
    id,
    updatedAt: now,
    workspaceId,
  }
}

export async function getOperationRecord(
  database: Database,
  workspaceId: string,
  id: string,
): Promise<OperationRecord | null> {
  const [record] = await database
    .select()
    .from(operationRecords)
    .where(and(eq(operationRecords.id, id), eq(operationRecords.workspaceId, workspaceId)))
    .limit(1)

  if (!record) return null

  const tags = await database
    .select({ name: operationRecordTags.name })
    .from(operationRecordTags)
    .where(eq(operationRecordTags.recordId, id))
    .orderBy(asc(operationRecordTags.name))

  return toOperationRecord(
    record,
    tags.map((tag) => tag.name),
  )
}

export async function listOperationRecords(
  database: Database,
  workspaceId: string,
  input: OperationRecordListInput,
) {
  const parsed = operationRecordListSchema.parse(input)
  const filters = [eq(operationRecords.workspaceId, workspaceId)]

  if (parsed.search) {
    const textFilter = or(
      sql`instr(lower(${operationRecords.title}), lower(${parsed.search})) > 0`,
      sql`instr(lower(${operationRecords.summary}), lower(${parsed.search})) > 0`,
    )
    if (textFilter) filters.push(textFilter)
  }
  if (parsed.status) filters.push(eq(operationRecords.status, parsed.status))
  if (parsed.priority) filters.push(eq(operationRecords.priority, parsed.priority))

  if (parsed.tag) {
    const matchingTag = database
      .select({ recordId: operationRecordTags.recordId })
      .from(operationRecordTags)
      .where(
        and(
          eq(operationRecordTags.recordId, operationRecords.id),
          eq(operationRecordTags.name, parsed.tag.toLowerCase()),
        ),
      )
    filters.push(exists(matchingTag))
  }

  const where = and(...filters)
  const orderBy = {
    review_asc: asc(operationRecords.reviewAt),
    title_asc: asc(operationRecords.title),
    updated_asc: asc(operationRecords.updatedAt),
    updated_desc: desc(operationRecords.updatedAt),
  }[parsed.sort]

  const [[totalRow], rows] = await Promise.all([
    database.select({ value: count() }).from(operationRecords).where(where),
    database
      .select()
      .from(operationRecords)
      .where(where)
      .orderBy(orderBy)
      .limit(parsed.pageSize)
      .offset((parsed.page - 1) * parsed.pageSize),
  ])

  const recordIds = rows.map((row) => row.id)
  const tags =
    recordIds.length === 0
      ? []
      : await database
          .select({ name: operationRecordTags.name, recordId: operationRecordTags.recordId })
          .from(operationRecordTags)
          .where(inArray(operationRecordTags.recordId, recordIds))
          .orderBy(asc(operationRecordTags.name))

  const tagsByRecord = new Map<string, string[]>()
  for (const tag of tags) {
    const names = tagsByRecord.get(tag.recordId) ?? []
    names.push(tag.name)
    tagsByRecord.set(tag.recordId, names)
  }

  return {
    items: rows.map((row) => toOperationRecord(row, tagsByRecord.get(row.id) ?? [])),
    page: parsed.page,
    pageSize: parsed.pageSize,
    total: totalRow?.value ?? 0,
  }
}

export async function updateOperationRecord(
  database: Database,
  workspaceId: string,
  id: string,
  input: OperationRecordInput,
): Promise<OperationRecord> {
  const parsed = operationRecordInputSchema.parse(input)
  const [owned] = await database
    .select({ id: operationRecords.id })
    .from(operationRecords)
    .where(and(eq(operationRecords.id, id), eq(operationRecords.workspaceId, workspaceId)))
    .limit(1)
  if (!owned) throw new OperationRecordNotFoundError()

  const recordUpdate = database
    .update(operationRecords)
    .set({
      priority: parsed.priority,
      reviewAt: parsed.reviewAt ? new Date(parsed.reviewAt) : null,
      status: parsed.status,
      summary: parsed.summary,
      title: parsed.title,
      updatedAt: new Date(),
    })
    .where(and(eq(operationRecords.id, id), eq(operationRecords.workspaceId, workspaceId)))

  const tagDelete = database.delete(operationRecordTags).where(eq(operationRecordTags.recordId, id))
  if (parsed.tags.length === 0) await database.batch([recordUpdate, tagDelete])
  else {
    await database.batch([
      recordUpdate,
      tagDelete,
      database.insert(operationRecordTags).values(
        parsed.tags.map((name) => ({
          name,
          recordId: id,
        })),
      ),
    ])
  }

  const record = await getOperationRecord(database, workspaceId, id)
  if (!record) throw new OperationRecordNotFoundError()
  return record
}

export async function deleteOperationRecord(database: Database, workspaceId: string, id: string) {
  const deleted = await database
    .delete(operationRecords)
    .where(and(eq(operationRecords.id, id), eq(operationRecords.workspaceId, workspaceId)))
    .returning({ id: operationRecords.id })

  if (deleted.length === 0) throw new OperationRecordNotFoundError()
}

function toOperationRecord(
  record: typeof operationRecords.$inferSelect,
  tags: string[],
): OperationRecord {
  return {
    createdAt: record.createdAt,
    id: record.id,
    priority: record.priority,
    reviewAt: record.reviewAt?.toISOString() ?? null,
    status: record.status,
    summary: record.summary,
    tags,
    title: record.title,
    updatedAt: record.updatedAt,
    workspaceId: record.workspaceId,
  }
}
