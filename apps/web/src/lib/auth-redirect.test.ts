import { describe, expect, it } from 'vitest'

import { safeAuthCallbackPath, verificationCallbackUrl } from './auth-redirect'

describe('auth redirect continuity', () => {
  it('accepts only root-relative callback paths', () => {
    expect(safeAuthCallbackPath('/invitations/winv_example?accept=1')).toBe(
      '/invitations/winv_example?accept=1',
    )
    expect(safeAuthCallbackPath(undefined)).toBe('/app')
    expect(safeAuthCallbackPath('https://attacker.example')).toBe('/app')
    expect(safeAuthCallbackPath('//attacker.example')).toBe('/app')
    expect(safeAuthCallbackPath('invitations/winv_example')).toBe('/app')
  })

  it('returns verification to sign-in while preserving the intended page', () => {
    expect(
      verificationCallbackUrl(
        'https://starter.example/api/sign-up',
        '/invitations/winv_example?accept=1',
      ),
    ).toBe('https://starter.example/sign-in?callbackUrl=%2Finvitations%2Fwinv_example%3Faccept%3D1')
  })
})
