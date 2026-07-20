import { describe, expect, it } from 'vitest'

import { isRealtimeEnabled, resolveRealtimeRoomName } from './realtime-security'

describe('realtime request policy', () => {
  it('is disabled unless explicitly enabled', () => {
    expect(isRealtimeEnabled(undefined)).toBe(false)
    expect(isRealtimeEnabled('false')).toBe(false)
    expect(isRealtimeEnabled('true')).toBe(true)
  })

  it('accepts bounded same-origin room names', () => {
    const request = new Request('https://starter.example.com/api/realtime/product-updates', {
      headers: { origin: 'https://starter.example.com' },
    })
    expect(resolveRealtimeRoomName(request)).toBe('product-updates')
  })

  it('rejects missing origins and unbounded or malformed room names', () => {
    const invalidRequests = [
      new Request('https://starter.example.com/api/realtime/room'),
      new Request('https://starter.example.com/api/realtime/', {
        headers: { origin: 'https://starter.example.com' },
      }),
      new Request(`https://starter.example.com/api/realtime/${'a'.repeat(65)}`, {
        headers: { origin: 'https://starter.example.com' },
      }),
      new Request('https://starter.example.com/api/realtime/room%2Fchild', {
        headers: { origin: 'https://starter.example.com' },
      }),
    ]

    for (const request of invalidRequests) {
      expect(() => resolveRealtimeRoomName(request)).toThrow(Response)
    }
  })
})
