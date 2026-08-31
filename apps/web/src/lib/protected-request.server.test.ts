import type { AuthUser } from '@micropreneur/auth'
import { UnauthorizedError } from '@micropreneur/auth'
import { describe, expect, it, vi } from 'vitest'

import { requireAuthenticatedMutation } from './protected-request.server'

const user: AuthUser = {
  email: 'ada@example.com',
  id: 'user-1',
  name: 'Ada',
}

describe('protected mutation boundary', () => {
  it('checks same-origin requests and re-authorizes from request headers', async () => {
    const requireUser = vi.fn(async (_headers: Headers) => user)
    const auth = { requireUser }
    const request = new Request('https://starter.example/api/account/profile', {
      headers: {
        cookie: 'session=valid',
        origin: 'https://starter.example',
      },
      method: 'POST',
    })

    await expect(requireAuthenticatedMutation(request, auth)).resolves.toMatchObject({ user })
    expect(requireUser).toHaveBeenCalledOnce()
    expect(requireUser.mock.calls[0]?.[0].get('cookie')).toBe('session=valid')
  })

  it('rejects cross-origin requests before consulting auth', async () => {
    const requireUser = vi.fn(async (_headers: Headers) => user)
    const auth = { requireUser }
    const request = new Request('https://starter.example/api/account/profile', {
      headers: { origin: 'https://attacker.example' },
      method: 'POST',
    })

    await expect(requireAuthenticatedMutation(request, auth)).rejects.toBeInstanceOf(Response)
    expect(requireUser).not.toHaveBeenCalled()
  })

  it('does not treat a client route guard as authorization', async () => {
    const auth = {
      requireUser: vi.fn(async () => {
        throw new UnauthorizedError()
      }),
    }
    const request = new Request('https://starter.example/api/account/profile', {
      headers: { origin: 'https://starter.example' },
      method: 'POST',
    })

    await expect(requireAuthenticatedMutation(request, auth)).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })
})
