import type { AuthPort } from '@micropreneur/auth'

import { requireSameOrigin } from './request-security'

/**
 * Authorize a state-changing request at the server boundary.
 *
 * Client-side route guards only improve navigation. Every protected mutation
 * must call this helper (or perform equivalent checks) before touching data.
 */
export async function requireAuthenticatedMutation(
  request: Request,
  auth: Pick<AuthPort, 'requireUser'>,
) {
  requireSameOrigin(request)
  const headers = new Headers(request.headers)
  const user = await auth.requireUser(headers)
  return { headers, user }
}
