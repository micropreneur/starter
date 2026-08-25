import { describe, expect, it, vi } from 'vitest'

import { enforceAuthRateLimit } from './auth-rate-limit.server'

function createLimiter(success: boolean) {
  return { limit: vi.fn().mockResolvedValue({ success }) }
}

describe('enforceAuthRateLimit', () => {
  it('is a no-op when the optional binding is absent', async () => {
    const request = new Request('http://localhost:3000/api/sign-in', { method: 'POST' })
    await expect(enforceAuthRateLimit(request, {})).resolves.toBeUndefined()
  })

  it.each([
    '/api/sign-in',
    '/api/sign-up',
    '/api/send-verification',
    '/api/request-password-reset',
    '/api/reset-password',
  ])('limits POST requests to %s with a route-specific client key', async (pathname) => {
    const limiter = createLimiter(true)
    const request = new Request(`https://starter.example.com${pathname}`, {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.7' },
    })

    await expect(
      enforceAuthRateLimit(request, { AUTH_RATE_LIMITER: limiter }),
    ).resolves.toBeUndefined()
    expect(limiter.limit).toHaveBeenCalledWith({
      key: `starter.example.com:${pathname}:203.0.113.7`,
    })
  })

  it('returns a typed 429 response with retry guidance', async () => {
    const response = await enforceAuthRateLimit(
      new Request('https://starter.example.com/api/sign-up', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.7' },
      }),
      { AUTH_RATE_LIMITER: createLimiter(false) },
    )

    expect(response?.status).toBe(429)
    expect(response?.headers.get('Retry-After')).toBe('60')
    await expect(response?.json()).resolves.toMatchObject({ error: 'rate_limited' })
  })

  it.each([
    ['GET', '/api/sign-in'],
    ['POST', '/api/sign-out'],
    ['POST', '/api/sign-in-social'],
  ])('does not consume a token for %s %s', async (method, pathname) => {
    const limiter = createLimiter(false)
    const request = new Request(`https://starter.example.com${pathname}`, { method })

    await expect(
      enforceAuthRateLimit(request, { AUTH_RATE_LIMITER: limiter }),
    ).resolves.toBeUndefined()
    expect(limiter.limit).not.toHaveBeenCalled()
  })
})
