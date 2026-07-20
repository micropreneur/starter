import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../../lib/auth.server'
import { getBilling } from '../../../lib/billing.server'
import { requireSameOrigin } from '../../../lib/request-security'

export const Route = createFileRoute('/api/billing/portal')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const user = await getAuth().requireUser(new Headers(request.headers))
        const url = await getBilling().createPortal(
          user.id,
          `${new URL(request.url).origin}/app/settings`,
        )
        return Response.json({ url })
      },
    },
  },
})
