import { describe, expect, it } from 'vitest'
import lifecycle from '../../r2-lifecycle.example.json'

describe('R2 staging lifecycle policy', () => {
  it('expires only staging objects after one day', () => {
    expect(lifecycle.rules).toEqual([
      {
        conditions: { prefix: 'staging/' },
        deleteObjectsTransition: {
          condition: { maxAge: 24 * 60 * 60, type: 'Age' },
        },
        enabled: true,
        id: 'expire-abandoned-staging-uploads',
      },
    ])
  })
})
