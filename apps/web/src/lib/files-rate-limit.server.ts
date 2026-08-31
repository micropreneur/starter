import type { WebEnv } from '../env'

export async function enforceFileUploadGrantRateLimit(
  request: Request,
  env: Pick<WebEnv, 'AUTH_RATE_LIMITER'>,
  authenticatedUserId: string,
): Promise<Response | undefined> {
  if (!env.AUTH_RATE_LIMITER) return undefined

  const hostname = new URL(request.url).hostname
  const { success } = await env.AUTH_RATE_LIMITER.limit({
    key: `${hostname}:file-upload-grant:${authenticatedUserId}`,
  })
  if (success) return undefined

  return Response.json(
    { error: 'rate_limited', message: 'Too many upload requests. Try again in 60 seconds.' },
    { headers: { 'Retry-After': '60' }, status: 429 },
  )
}
