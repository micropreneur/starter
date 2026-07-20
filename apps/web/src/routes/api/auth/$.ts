import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../../lib/auth.server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => getAuth().handleRequest(request),
      POST: ({ request }) => getAuth().handleRequest(request),
    },
  },
})
