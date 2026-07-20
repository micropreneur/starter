import { describe, expect, it } from 'vitest'
import { isStandaloneAuthPath } from './site-layout'

describe('isStandaloneAuthPath', () => {
  it.each(['/sign-in', '/sign-up'])('treats %s as a standalone auth view', (pathname) => {
    expect(isStandaloneAuthPath(pathname)).toBe(true)
  })

  it.each(['/forgot-password', '/reset-password', '/onboarding', '/app', '/'])(
    'leaves %s in its existing site layout',
    (pathname) => {
      expect(isStandaloneAuthPath(pathname)).toBe(false)
    },
  )
})
