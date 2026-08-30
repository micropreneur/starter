import { describe, expect, it, vi } from 'vitest'

import type { WebEnv } from '../env'
import { resolveTurnstileConfig, verifyTurnstileChallenge } from './turnstile.server'

const env = {
  TURNSTILE_SECRET_KEY: 'secret',
  TURNSTILE_SITE_KEY: 'site',
} as WebEnv
const request = new Request('https://starter.example.com/api/sign-up', {
  headers: { 'CF-Connecting-IP': '203.0.113.10' },
})

describe('Turnstile validation', () => {
  it('stays disabled when both keys are absent and rejects partial configuration', () => {
    expect(resolveTurnstileConfig({} as WebEnv)).toBeNull()
    expect(() => resolveTurnstileConfig({ TURNSTILE_SITE_KEY: 'site' } as WebEnv)).toThrow(
      'must be configured together',
    )
  })

  it('accepts only a successful token for the expected action and hostname', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ action: 'sign_up', hostname: 'starter.example.com', success: true }),
      )

    await expect(
      verifyTurnstileChallenge({ action: 'sign_up', env, fetcher, request, token: 'token' }),
    ).resolves.toBe(true)
    expect(fetcher).toHaveBeenCalledOnce()
    await expect(
      verifyTurnstileChallenge({
        action: 'password_reset',
        env,
        fetcher,
        request,
        token: 'token',
      }),
    ).resolves.toBe(false)
  })

  it('supports Cloudflare deterministic pass keys without weakening production validation', async () => {
    const deterministicEnv = {
      TURNSTILE_SECRET_KEY: 'deterministic-test-secret',
      TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    } as WebEnv
    const testingResponse = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        hostname: 'example.com',
        metadata: { result_with_testing_key: true },
        success: true,
      }),
    )

    await expect(
      verifyTurnstileChallenge({
        action: 'password_reset',
        env: deterministicEnv,
        fetcher: testingResponse,
        request,
        token: 'XXXX.DUMMY.TOKEN.XXXX',
      }),
    ).resolves.toBe(true)
    await expect(
      verifyTurnstileChallenge({
        action: 'password_reset',
        env,
        fetcher: testingResponse,
        request,
        token: 'XXXX.DUMMY.TOKEN.XXXX',
      }),
    ).resolves.toBe(false)
    await expect(
      verifyTurnstileChallenge({
        action: 'password_reset',
        env: deterministicEnv,
        fetcher: vi.fn<typeof fetch>().mockResolvedValue(Response.json({ success: true })),
        request,
        token: 'XXXX.DUMMY.TOKEN.XXXX',
      }),
    ).resolves.toBe(false)
  })

  it('fails closed for missing, oversized, rejected, and unreachable challenges', async () => {
    const rejected = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ success: false, 'error-codes': ['invalid-input-response'] }),
      )
    await expect(
      verifyTurnstileChallenge({ action: 'sign_up', env, fetcher: rejected, request, token: '' }),
    ).resolves.toBe(false)
    await expect(
      verifyTurnstileChallenge({
        action: 'sign_up',
        env,
        fetcher: rejected,
        request,
        token: 'x'.repeat(2049),
      }),
    ).resolves.toBe(false)
    await expect(
      verifyTurnstileChallenge({
        action: 'sign_up',
        env,
        fetcher: rejected,
        request,
        token: 'bad',
      }),
    ).resolves.toBe(false)

    const unreachable = vi.fn<typeof fetch>().mockRejectedValue(new Error('network unavailable'))
    await expect(
      verifyTurnstileChallenge({
        action: 'sign_up',
        env,
        fetcher: unreachable,
        request,
        token: 'token',
      }),
    ).resolves.toBe(false)
  })
})
