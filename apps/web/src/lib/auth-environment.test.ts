import { describe, expect, it } from 'vitest'

import { isLocalAuthEnvironment, resolveBetterAuthBaseUrl } from './auth-environment'

describe('auth environment detection', () => {
  it('allows the fallback secret only in a local development build', () => {
    expect(isLocalAuthEnvironment(undefined, true)).toBe(true)
    expect(isLocalAuthEnvironment('http://localhost:3000', true)).toBe(true)
    expect(isLocalAuthEnvironment('http://127.0.0.1:3000', true)).toBe(true)

    expect(isLocalAuthEnvironment(undefined, false)).toBe(false)
    expect(isLocalAuthEnvironment('http://localhost:3000', false)).toBe(false)
    expect(isLocalAuthEnvironment('https://starter.example.com', true)).toBe(false)
    expect(isLocalAuthEnvironment('not a url', true)).toBe(false)
  })

  it('requires and validates the public URL outside local development', () => {
    expect(resolveBetterAuthBaseUrl(undefined, true)).toBe('http://localhost:3000')
    expect(resolveBetterAuthBaseUrl('https://starter.example.com/', false)).toBe(
      'https://starter.example.com',
    )

    expect(() => resolveBetterAuthBaseUrl(undefined, false)).toThrow('BETTER_AUTH_URL is required')
    expect(() => resolveBetterAuthBaseUrl('not a url', false)).toThrow('absolute HTTP or HTTPS URL')
    expect(() => resolveBetterAuthBaseUrl('javascript:alert(1)', false)).toThrow(
      'absolute HTTP or HTTPS URL',
    )
  })
})
