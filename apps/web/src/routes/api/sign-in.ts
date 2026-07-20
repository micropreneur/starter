import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '../../lib/auth.server'
import { invalidInputResponse, parseSignInInput, readJsonBody } from '../../lib/auth-input'

export const Route = createFileRoute('/api/sign-in')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const input = parseSignInInput(await readJsonBody(request))
        if (!input) return invalidInputResponse('non-empty "email" and "password" strings')
        return getAuth().signIn(input, new Headers(request.headers))
      },
    },
  },
})
