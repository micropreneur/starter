import { describe, expect, it } from 'vitest'

import { requireSameOrigin } from './request-security'

describe('same-origin mutation guard', () => {
  it('accepts the request origin and rejects missing or cross-site origins', () => {
    expect(() =>
      requireSameOrigin(
        new Request('http://localhost:3000/api/account/profile', {
          headers: { origin: 'http://localhost:3000' },
        }),
      ),
    ).not.toThrow()

    for (const origin of [undefined, 'https://attacker.example']) {
      try {
        requireSameOrigin(
          new Request('http://localhost:3000/api/account/profile', {
            headers: origin ? { origin } : undefined,
          }),
        )
        throw new Error('Expected the request to be rejected.')
      } catch (error) {
        expect(error).toBeInstanceOf(Response)
        if (!(error instanceof Response)) throw error
        expect(error.status).toBe(403)
      }
    }
  })
})
