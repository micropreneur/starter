import { z } from 'zod'

export const fileKinds = ['avatar', 'logo'] as const
export const fileContentTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

export const fileUploadRequestSchema = z.object({
  contentType: z.enum(fileContentTypes),
  kind: z.enum(fileKinds),
  size: z.number().int().positive(),
})

export const fileUploadCompletionSchema = z.object({
  key: z.string().min(1).max(1024),
  kind: z.enum(fileKinds),
})
