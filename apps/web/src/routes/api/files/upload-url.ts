import { env as cloudflareEnv } from 'cloudflare:workers'
import { FileUploadValidationError, fileUploadRequestSchema } from '@micropreneur/files'
import { createFileRoute } from '@tanstack/react-router'

import type { WebEnv } from '../../../env'
import { readJsonBody } from '../../../lib/auth-input'
import {
  fileValidationResponse,
  requireFileUser,
  resolveFileOwner,
} from '../../../lib/files.handlers'
import { createFileUploadService, FileUploadsNotConfiguredError } from '../../../lib/files.server'
import { enforceFileUploadGrantRateLimit } from '../../../lib/files-rate-limit.server'
import { requireSameOrigin } from '../../../lib/request-security'

export const Route = createFileRoute('/api/files/upload-url')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const user = await requireFileUser(request)
        const env = cloudflareEnv as unknown as WebEnv
        const rateLimitResponse = await enforceFileUploadGrantRateLimit(request, env, user.id)
        if (rateLimitResponse) return rateLimitResponse
        const parsed = fileUploadRequestSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) {
          return Response.json(
            { error: 'Choose a supported image within the size limit.' },
            { status: 400 },
          )
        }
        const owner = await resolveFileOwner(request, parsed.data.kind, user)
        try {
          const grant = await createFileUploadService(env).requestUpload(owner.id, parsed.data)
          return Response.json(grant, { headers: { 'cache-control': 'no-store' } })
        } catch (error) {
          if (error instanceof FileUploadsNotConfiguredError) {
            return Response.json({ error: error.message }, { status: 503 })
          }
          if (error instanceof FileUploadValidationError) return fileValidationResponse(error)
          throw error
        }
      },
    },
  },
})
