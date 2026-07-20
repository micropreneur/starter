import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '../../lib/auth.server'

export const Route = createFileRoute('/api/sign-out')({
  server: {
    handlers: {
      POST: ({ request }) => getAuth().signOut(new Headers(request.headers)),
    },
  },
})
