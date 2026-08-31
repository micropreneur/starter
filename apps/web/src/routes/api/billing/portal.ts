import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../../lib/auth.server'
import { getBilling } from '../../../lib/billing.server'
import { requireAuthenticatedMutation } from '../../../lib/protected-request.server'

export const Route = createFileRoute('/api/billing/portal')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { user } = await requireAuthenticatedMutation(request, getAuth())
        const url = await getBilling().createPortal(
          user.id,
          `${new URL(request.url).origin}/app/settings/billing`,
        )
        return Response.json({ url })
      },
    },
  },
})
