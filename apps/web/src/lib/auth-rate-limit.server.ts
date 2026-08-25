import type { WebEnv } from '../env'

const RATE_LIMITED_AUTH_PATHS = new Set([
  '/api/request-password-reset',
  '/api/reset-password',
  '/api/send-verification',
  '/api/sign-in',
  '/api/sign-up',
])

export async function enforceAuthRateLimit(
  request: Request,
  env: Pick<WebEnv, 'AUTH_RATE_LIMITER'>,
): Promise<Response | undefined> {
  if (request.method !== 'POST' || !env.AUTH_RATE_LIMITER) return undefined

  const url = new URL(request.url)
  if (!RATE_LIMITED_AUTH_PATHS.has(url.pathname)) return undefined

  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const key = `${url.hostname}:${url.pathname}:${clientIp}`
  const { success } = await env.AUTH_RATE_LIMITER.limit({ key })
  if (success) return undefined

  return Response.json(
    { error: 'rate_limited', message: 'Too many attempts. Try again in 60 seconds.' },
    { status: 429, headers: { 'Retry-After': '60' } },
  )
}
