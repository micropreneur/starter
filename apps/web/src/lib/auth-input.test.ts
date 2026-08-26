import { describe, expect, it } from 'vitest'

import {
  invalidInputResponse,
  parseSignInInput,
  parseSignUpRequest,
  readJsonBody,
} from './auth-input'

describe('auth input validation', () => {
  it('accepts well-formed sign-in and sign-up bodies', () => {
    expect(parseSignInInput({ email: 'a@example.com', password: 'secret' })).toEqual({
      email: 'a@example.com',
      password: 'secret',
    })
    expect(
      parseSignUpRequest({
        callbackUrl: '/invitations/winv_example',
        email: 'a@example.com',
        name: 'Ada',
        password: 'a-strong-password',
        workspace: { name: 'Ada Labs' },
      }),
    ).toEqual({
      account: { email: 'a@example.com', name: 'Ada', password: 'a-strong-password' },
      callbackUrl: '/invitations/winv_example',
      onboarding: { name: 'Ada Labs' },
    })
  })

  it('rejects malformed bodies', () => {
    expect(parseSignInInput(null)).toBeNull()
    expect(parseSignInInput('email=a@example.com')).toBeNull()
    expect(parseSignInInput({ email: 'a@example.com' })).toBeNull()
    expect(parseSignInInput({ email: 'a@example.com', password: '' })).toBeNull()
    expect(parseSignInInput({ email: 42, password: 'secret' })).toBeNull()
    expect(parseSignUpRequest({ email: 'a@example.com', password: 'a-strong-password' })).toBeNull()
    expect(
      parseSignUpRequest({
        email: 'a@example.com',
        name: '  ',
        password: 'a-strong-password',
        workspace: { name: 'Ada Labs' },
      }),
    ).toBeNull()
    expect(
      parseSignUpRequest({
        email: 'a@example.com',
        name: 'Ada',
        password: 'a-strong-password',
        workspace: { name: '' },
      }),
    ).toBeNull()
    expect(
      parseSignUpRequest({
        callbackUrl: 'https://attacker.example',
        email: 'a@example.com',
        name: 'Ada',
        password: 'a-strong-password',
        workspace: { name: 'Ada Labs' },
      }),
    ).toBeNull()
  })

  it('returns null for invalid JSON and a 400 response for invalid input', async () => {
    const request = new Request('http://localhost/api/sign-in', {
      body: 'not json',
      method: 'POST',
    })
    expect(await readJsonBody(request)).toBeNull()

    const response = invalidInputResponse('non-empty "email" and "password" strings')
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Expected a JSON body with non-empty "email" and "password" strings.',
    })
  })
})
