import { describe, expect, it, vi } from 'vitest'

import { enforceFileUploadGrantRateLimit } from './files-rate-limit.server'

function createLimiter(success: boolean) {
  return { limit: vi.fn().mockResolvedValue({ success }) }
}

describe('file upload grant rate limit', () => {
  const request = new Request('https://starter.example.com/api/files/upload-url', {
    method: 'POST',
  })

  it('uses the authenticated user rather than a client-supplied owner or shared IP', async () => {
    const limiter = createLimiter(true)

    await expect(
      enforceFileUploadGrantRateLimit(request, { AUTH_RATE_LIMITER: limiter }, 'user-a'),
    ).resolves.toBeUndefined()
    expect(limiter.limit).toHaveBeenCalledWith({
      key: 'starter.example.com:file-upload-grant:user-a',
    })
  })

  it('returns retry guidance when the binding denies another grant', async () => {
    const response = await enforceFileUploadGrantRateLimit(
      request,
      { AUTH_RATE_LIMITER: createLimiter(false) },
      'user-a',
    )

    expect(response?.status).toBe(429)
    expect(response?.headers.get('Retry-After')).toBe('60')
    await expect(response?.json()).resolves.toMatchObject({ error: 'rate_limited' })
  })

  it('keeps local composition optional when the binding is removed by a fork', async () => {
    await expect(enforceFileUploadGrantRateLimit(request, {}, 'user-a')).resolves.toBeUndefined()
  })
})
