import { describe, expect, it, vi } from 'vitest'

import type { WebEnv } from '../env'
import {
  createFileUploadService,
  FileUploadsNotConfiguredError,
  fileUploadsConfigured,
  resolveR2SigningConfig,
} from './files.server'

describe('R2 file storage composition', () => {
  it('keeps the default local loop disabled without signing credentials', async () => {
    const env = envFixture()
    expect(fileUploadsConfigured(env)).toBe(false)
    await expect(
      createFileUploadService(env).requestUpload('user-a', {
        contentType: 'image/png',
        kind: 'avatar',
        size: 100,
      }),
    ).rejects.toBeInstanceOf(FileUploadsNotConfiguredError)
  })

  it('rejects partial signing configuration', () => {
    expect(() => resolveR2SigningConfig({ ...envFixture(), R2_ACCOUNT_ID: 'account-id' })).toThrow(
      'must be configured together',
    )
  })

  it('cannot issue an R2 grant without the upload-grant rate limiter', async () => {
    const service = createFileUploadService({
      ...envFixture(),
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
      R2_BUCKET_NAME: 'starter-files',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
    })

    await expect(
      service.requestUpload('user-a', {
        contentType: 'image/png',
        kind: 'avatar',
        size: 100,
      }),
    ).rejects.toThrow('AUTH_RATE_LIMITER is required')
  })

  it('signs a five-minute PUT grant with the exact byte length and an encoded owner key', async () => {
    const env = {
      ...envFixture(),
      AUTH_RATE_LIMITER: { limit: vi.fn() } as unknown as RateLimit,
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
      R2_BUCKET_NAME: 'starter-files',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
    }
    const grant = await createFileUploadService(env).requestUpload('user/a', {
      contentType: 'image/webp',
      kind: 'avatar',
      size: 100,
    })
    const url = new URL(grant.uploadUrl)

    expect(url.origin).toBe('https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com')
    expect(url.pathname).toContain('/starter-files/staging/avatars/user%252Fa/')
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300')
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host')
    expect(grant.headers).toEqual({ 'content-type': 'image/webp' })
  })
})

function envFixture(): WebEnv {
  return {
    DB: {} as D1Database,
    FILES: {
      delete: vi.fn(),
      get: vi.fn(),
      head: vi.fn(),
    } as unknown as R2Bucket,
    REALTIME_ROOM: {} as WebEnv['REALTIME_ROOM'],
  }
}
