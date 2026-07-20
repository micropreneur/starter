import { describe, expect, it, vi } from 'vitest'

import { createLocalEmailAdapter, renderEmail, resolveEmailProvider } from './index'

describe('email adapters', () => {
  it('captures local delivery without network access', async () => {
    const report = vi.fn()
    const email = createLocalEmailAdapter(report)
    const delivery = await email.send({
      actionUrl: 'http://localhost:3000/reset?token=secret',
      name: 'Ada',
      template: 'reset_password',
      to: 'ada@example.com',
    })

    expect(delivery.id).toMatch(/^local_/)
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Reset your password' }))
  })

  it('escapes user-controlled template values', () => {
    const rendered = renderEmail({
      name: '<script>alert(1)</script>',
      template: 'welcome',
      to: 'ada@example.com',
    })
    expect(rendered.html).not.toContain('<script>')
    expect(rendered.html).toContain('&lt;script&gt;')
  })

  it('keeps local capture local and fails closed in production', () => {
    expect(resolveEmailProvider(undefined, true)).toBe('local')
    expect(() => resolveEmailProvider(undefined, false)).toThrow('EMAIL_PROVIDER')
    expect(() => resolveEmailProvider('local', false)).toThrow('disabled')
  })
})
