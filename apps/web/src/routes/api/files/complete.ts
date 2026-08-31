import { fileUploadCompletionSchema } from '@micropreneur/files'
import { createFileRoute } from '@tanstack/react-router'

import { readJsonBody } from '../../../lib/auth-input'
import { replaceFileReference, requireFileUser } from '../../../lib/files.handlers'
import { requireSameOrigin } from '../../../lib/request-security'

export const Route = createFileRoute('/api/files/complete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const user = await requireFileUser(request)
        const parsed = fileUploadCompletionSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) {
          return Response.json({ error: 'Invalid upload completion request.' }, { status: 400 })
        }
        return replaceFileReference(request, parsed.data.kind, parsed.data.key, user)
      },
    },
  },
})
