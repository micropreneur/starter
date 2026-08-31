import { describe, expect, it, vi } from 'vitest'

import type { WebEnv } from '../env'
import { handleReadinessRequest } from './readiness.server'

function configuredEnv(count = 4): WebEnv {
  return {
    AUTH_PROVIDER: 'betterauth',
    BETTER_AUTH_SECRET: 'configured',
    BETTER_AUTH_URL: 'https://starter.example.com',
    DB: {
      prepare: vi.fn(() => ({ first: vi.fn().mockResolvedValue({ count }) })),
    } as unknown as D1Database,
    EMAIL_FROM: 'Starter <starter@example.com>',
    EMAIL_PROVIDER: 'resend',
    FILES: {} as R2Bucket,
    REALTIME_ROOM: {} as WebEnv['REALTIME_ROOM'],
    RESEND_API_KEY: 'configured',
    STRIPE_SECRET_KEY: 'rk_test_configured',
    TURNSTILE_SECRET_KEY: 'configured',
    TURNSTILE_SITE_KEY: 'configured',
  }
}

describe('handleReadinessRequest', () => {
  it('reports ready without exposing configuration values', async () => {
    const response = await handleReadinessRequest(
      new Request('https://starter.example.com/api/readiness'),
      configuredEnv(),
    )

    expect(response?.status).toBe(200)
    expect(response?.headers.get('Cache-Control')).toBe('no-store')
    const body = await response?.json()
    expect(body).toEqual({
      adapters: {
        auth: 'configured',
        email: 'configured',
        stripeMode: 'test',
        turnstile: 'configured',
      },
      database: { connected: true, migrationsApplied: 4 },
      status: 'ready',
    })
    expect(JSON.stringify(body)).not.toContain('starter.example.com')
    expect(JSON.stringify(body)).not.toContain('rk_test_configured')
  })

  it('fails readiness for a live Stripe key', async () => {
    const env = configuredEnv()
    env.STRIPE_SECRET_KEY = 'sk_live_configured'
    const response = await handleReadinessRequest(
      new Request('https://starter.example.com/api/readiness'),
      env,
    )

    expect(response?.status).toBe(503)
    await expect(response?.json()).resolves.toMatchObject({
      adapters: { stripeMode: 'live' },
      status: 'degraded',
    })
  })

  it('does not handle unrelated paths', async () => {
    await expect(
      handleReadinessRequest(new Request('https://starter.example.com/'), configuredEnv()),
    ).resolves.toBeUndefined()
  })
})
