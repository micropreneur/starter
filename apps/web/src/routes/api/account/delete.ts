import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { getAuth } from '../../../lib/auth.server'
import { invalidInputResponse, readJsonBody } from '../../../lib/auth-input'
import { getBilling } from '../../../lib/billing.server'
import { requireSameOrigin } from '../../../lib/request-security'

const inputSchema = z.object({
  callbackUrl: z.string().url(),
  password: z.string().min(8).max(128).optional(),
})

export const Route = createFileRoute('/api/account/delete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireSameOrigin(request)
        const headers = new Headers(request.headers)
        const auth = getAuth()
        const user = await auth.requireUser(headers)
        const parsed = inputSchema.safeParse(await readJsonBody(request))
        if (!parsed.success) return invalidInputResponse('a callback URL and optional password')
        const accounts = await auth.listAccounts(headers)
        if (
          accounts.some((account) => account.provider === 'credential') &&
          !parsed.data.password
        ) {
          return invalidInputResponse('the current password for credential accounts')
        }
        const billing = getBilling()
        if (!(await billing.canDeleteAccount(user.id))) {
          return Response.json(
            {
              error: billing.configured
                ? 'Cancel your Stripe subscription and wait for cancellation to complete before deleting your account.'
                : 'Restore the Stripe configuration so the account subscription can be verified before deletion.',
            },
            { status: 409 },
          )
        }
        return auth.deleteUser(parsed.data, headers)
      },
    },
  },
})
