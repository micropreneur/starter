import { describe, expect, it, vi } from 'vitest'

import { deleteAccountFiles } from './account-files.server'

const user = {
  email: 'founder@example.com',
  id: 'user-a',
  name: 'Founder',
}

describe('account file deletion', () => {
  it('deletes the authenticated user avatar and personal-workspace logo collections together', async () => {
    const deleteOwnerFiles = vi.fn().mockResolvedValue(undefined)

    await deleteAccountFiles(user, { deleteOwnerFiles })

    expect(deleteOwnerFiles).toHaveBeenCalledWith([
      { kind: 'avatar', ownerId: 'user-a' },
      { kind: 'logo', ownerId: 'personal:user-a' },
    ])
  })

  it('propagates cleanup failures so confirmed account deletion fails closed', async () => {
    const failure = new Error('R2 unavailable')
    const deleteOwnerFiles = vi.fn().mockRejectedValue(failure)

    await expect(deleteAccountFiles(user, { deleteOwnerFiles })).rejects.toBe(failure)
  })
})
