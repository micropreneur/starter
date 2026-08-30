import { z } from 'zod'

import type { WebEnv } from '../env'

const siteverifyResponseSchema = z.object({
  action: z.string().optional(),
  hostname: z.string().optional(),
  metadata: z
    .object({
      result_with_testing_key: z.boolean().optional(),
    })
    .optional(),
  success: z.boolean(),
})

const deterministicTestSiteKey = '1x00000000000000000000AA'

export type TurnstileAction = 'password_reset' | 'sign_up'

export interface TurnstileConfig {
  secretKey: string
  siteKey: string
}

export function resolveTurnstileConfig(env: WebEnv): TurnstileConfig | null {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim()
  const secretKey = env.TURNSTILE_SECRET_KEY?.trim()
  if (!siteKey && !secretKey) return null
  if (!siteKey || !secretKey) {
    throw new Error('TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must be configured together.')
  }
  return { secretKey, siteKey }
}

export async function verifyTurnstileChallenge({
  action,
  env,
  fetcher = fetch,
  request,
  token,
}: {
  action: TurnstileAction
  env: WebEnv
  fetcher?: typeof fetch
  request: Request
  token: string | undefined
}): Promise<boolean> {
  const config = resolveTurnstileConfig(env)
  if (!config) return true
  if (!token || token.length > 2048) return false

  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        remoteip: request.headers.get('CF-Connecting-IP') ?? undefined,
        response: token,
        secret: config.secretKey,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return false
    const parsed = siteverifyResponseSchema.safeParse(await response.json())
    if (!parsed.success || !parsed.data.success) return false
    if (config.siteKey === deterministicTestSiteKey) {
      return parsed.data.metadata?.result_with_testing_key === true
    }
    if (parsed.data.metadata?.result_with_testing_key) return false
    if (parsed.data.action !== action) return false
    return parsed.data.hostname === new URL(request.url).hostname
  } catch (error) {
    console.error('Turnstile validation failed closed.', error)
    return false
  }
}

export function turnstileRejectedResponse(): Response {
  return Response.json(
    { error: 'Complete the verification challenge and try again.' },
    { status: 400 },
  )
}
