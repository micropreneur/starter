import { describe, expect, it } from 'vitest'

import { requireSameOrigin, requireSameOriginUrl } from './request-security'

describe('request security', () => {
  it('accepts same-origin mutation requests and callbacks', () => {
    const request = new Request('https://starter.example/api/sign-in-social', {
      headers: { origin: 'https://starter.example' },
    })
    expect(() => requireSameOrigin(request)).not.toThrow()
    expect(() =>
      requireSameOriginUrl('https://starter.example/invitations/token', request),
    ).not.toThrow()
  })

  it('rejects missing or cross-origin request origins', () => {
    expect(() =>
      requireSameOrigin(new Request('https://starter.example/api/sign-in-social')),
    ).toThrow(Response)
    expect(() =>
      requireSameOrigin(
        new Request('https://starter.example/api/sign-in-social', {
          headers: { origin: 'https://attacker.example' },
        }),
      ),
    ).toThrow(Response)
  })

  it.each(['not-a-url', 'https://attacker.example/app'])(
    'rejects invalid callback %s',
    (callback) => {
      const request = new Request('https://starter.example/api/sign-in-social')
      expect(() => requireSameOriginUrl(callback, request)).toThrow(Response)
    },
  )
})
