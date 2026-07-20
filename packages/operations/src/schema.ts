import { z } from 'zod'

export const operationStatuses = ['draft', 'active', 'needs_review', 'archived'] as const
export const operationPriorities = ['low', 'medium', 'high'] as const

export const operationStatusSchema = z.enum(operationStatuses)
export const operationPrioritySchema = z.enum(operationPriorities)

const tagsSchema = z
  .array(z.string().trim().min(1).max(32))
  .max(8)
  .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))].sort())

export const operationRecordInputSchema = z.object({
  priority: operationPrioritySchema,
  reviewAt: z.iso.datetime().nullable(),
  status: operationStatusSchema,
  summary: z.string().trim().max(1000),
  tags: tagsSchema,
  title: z.string().trim().min(2).max(120),
})

export const operationRecordListSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(50).default(20),
  priority: operationPrioritySchema.optional(),
  search: z.string().trim().max(120).default(''),
  sort: z.enum(['updated_desc', 'updated_asc', 'review_asc', 'title_asc']).default('updated_desc'),
  status: operationStatusSchema.optional(),
  tag: z.string().trim().max(32).optional(),
})

export type OperationStatus = z.infer<typeof operationStatusSchema>
export type OperationPriority = z.infer<typeof operationPrioritySchema>
export type OperationRecordInput = z.infer<typeof operationRecordInputSchema>
export type OperationRecordListInput = z.infer<typeof operationRecordListSchema>

export interface OperationRecord extends OperationRecordInput {
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
}
