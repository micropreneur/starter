import { env as cloudflareEnv } from 'cloudflare:workers'
import { createDb } from '@micropreneur/db'
import {
  createOperationRecord,
  deleteOperationRecord,
  getOperationRecord,
  listOperationRecords,
  operationRecordInputSchema,
  operationRecordListSchema,
  updateOperationRecord,
} from '@micropreneur/operations'
import { requireActiveWorkspace } from '@micropreneur/workspaces'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

import type { WebEnv } from '../env'
import { getAuth } from './auth.server'

const idSchema = z.object({ id: z.uuid() })
const updateSchema = z.object({ id: z.uuid(), input: operationRecordInputSchema })

export const listOperations = createServerFn({ method: 'GET' })
  .validator(operationRecordListSchema)
  .handler(async ({ data }) => {
    const user = await getAuth().requireUser(getRequestHeaders())
    const db = database()
    const workspace = await requireActiveWorkspace(db, user.id)
    return listOperationRecords(db, workspace.id, data)
  })

export const getOperation = createServerFn({ method: 'GET' })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const user = await getAuth().requireUser(getRequestHeaders())
    const db = database()
    const workspace = await requireActiveWorkspace(db, user.id)
    return getOperationRecord(db, workspace.id, data.id)
  })

export const createOperation = createServerFn({ method: 'POST' })
  .validator(operationRecordInputSchema)
  .handler(async ({ data }) => {
    const user = await getAuth().requireUser(getRequestHeaders())
    const db = database()
    const workspace = await requireActiveWorkspace(db, user.id)
    return createOperationRecord(db, workspace.id, data)
  })

export const updateOperation = createServerFn({ method: 'POST' })
  .validator(updateSchema)
  .handler(async ({ data }) => {
    const user = await getAuth().requireUser(getRequestHeaders())
    const db = database()
    const workspace = await requireActiveWorkspace(db, user.id)
    return updateOperationRecord(db, workspace.id, data.id, data.input)
  })

export const deleteOperation = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const user = await getAuth().requireUser(getRequestHeaders())
    const db = database()
    const workspace = await requireActiveWorkspace(db, user.id)
    await deleteOperationRecord(db, workspace.id, data.id)
    return { deleted: true }
  })

function database() {
  const env = cloudflareEnv as unknown as WebEnv
  return createDb(env.DB)
}
