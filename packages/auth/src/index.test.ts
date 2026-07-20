import { describe, expect, it } from 'vitest'

import { createAuth, resolveAuthProvider, UnauthorizedError } from './index'

describe('auth factory', () => {
  it('defaults provider selection to Better Auth', () => {
    expect(resolveAuthProvider()).toBe('betterauth')
    expect(resolveAuthProvider('DESCOPE')).toBe('descope')
  })

  it('rejects unsupported provider names', () => {
    expect(() => resolveAuthProvider('unknown')).toThrow('Unsupported AUTH_PROVIDER')
  })

  it('provides a compiling Descope adapter seam', async () => {
    const auth = createAuth('descope')
    await expect(auth.requireUser(new Headers())).rejects.toBeInstanceOf(UnauthorizedError)
    expect(
      (await auth.signIn({ email: 'a@example.com', password: 'password' }, new Headers())).status,
    ).toBe(501)
  })
})
