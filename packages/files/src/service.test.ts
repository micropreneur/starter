import { describe, expect, it, vi } from 'vitest'

import type { FileStoragePort, StoredFile, StoredFileMetadata } from './port'
import {
  createOwnedFileKey,
  createStagedFileKey,
  FileUploadService,
  FileUploadValidationError,
  fileAssetUrl,
  fileKeyFromAssetUrl,
  isOwnedFileKey,
} from './service'

describe('file upload service', () => {
  it('creates short-lived, content-type-bound grants under authenticated owner keys', async () => {
    const storage = storageFixture()
    const service = new FileUploadService(
      storage.port,
      () => new Date('2026-08-31T00:00:00.000Z'),
      () => 'upload_123',
    )

    await expect(
      service.requestUpload('user/../ada', {
        contentType: 'image/png',
        kind: 'avatar',
        size: 1024,
      }),
    ).resolves.toEqual({
      expiresAt: '2026-08-31T00:05:00.000Z',
      headers: { 'content-type': 'image/png' },
      key: 'staging/avatars/user%2F%2E%2E%2Fada/upload_123.png',
      maxBytes: 2 * 1024 * 1024,
      uploadUrl: 'https://upload.example/signed',
    })
    expect(storage.port.createUploadUrl).toHaveBeenCalledWith({
      contentType: 'image/png',
      expiresInSeconds: 300,
      key: 'staging/avatars/user%2F%2E%2E%2Fada/upload_123.png',
    })
  })

  it('rejects cross-owner and cross-kind keys before touching storage', async () => {
    const storage = storageFixture()
    const service = new FileUploadService(storage.port)
    const key = createStagedFileKey('avatar', 'user-a', 'image/webp', 'upload-a')

    await expect(service.completeUpload('user-b', { key, kind: 'avatar' })).rejects.toMatchObject({
      reason: 'owner_mismatch',
    })
    await expect(service.getFile('user-a', 'logo', key)).rejects.toBeInstanceOf(
      FileUploadValidationError,
    )
    expect(storage.port.get).not.toHaveBeenCalled()
  })

  it('validates the stored upload and deletes invalid objects', async () => {
    const storage = storageFixture()
    const service = new FileUploadService(storage.port)
    const key = createStagedFileKey('logo', 'workspace-a', 'image/png', 'upload-a')
    storage.objects.set(key, {
      contentType: 'image/jpeg',
      contents: 'not-a-png',
      httpEtag: '"etag"',
      size: 100,
    })

    await expect(
      service.completeUpload('workspace-a', { key, kind: 'logo' }),
    ).rejects.toMatchObject({ reason: 'content_type_mismatch' })
    expect(storage.port.delete).toHaveBeenCalledWith(key)
    expect(storage.objects.has(key)).toBe(false)
  })

  it('enforces per-kind size constraints before and after direct upload', async () => {
    const storage = storageFixture()
    const service = new FileUploadService(storage.port)
    await expect(
      service.requestUpload('user-a', {
        contentType: 'image/jpeg',
        kind: 'avatar',
        size: 2 * 1024 * 1024 + 1,
      }),
    ).rejects.toMatchObject({ reason: 'file_too_large' })
    expect(storage.port.createUploadUrl).not.toHaveBeenCalled()

    const key = createStagedFileKey('logo', 'workspace-a', 'image/webp', 'upload-b')
    storage.objects.set(key, {
      contentType: 'image/webp',
      contents: 'oversized',
      httpEtag: '"etag"',
      size: 5 * 1024 * 1024 + 1,
    })
    await expect(
      service.completeUpload('workspace-a', { key, kind: 'logo' }),
    ).rejects.toMatchObject({ reason: 'file_too_large' })
    expect(storage.objects.has(key)).toBe(false)
  })

  it('completes, reads, and deletes a valid owned upload', async () => {
    const storage = storageFixture()
    const service = new FileUploadService(storage.port, undefined, () => 'final-c')
    const key = createStagedFileKey('avatar', 'user-a', 'image/png', 'upload-c')
    storage.objects.set(key, {
      contentType: 'image/png',
      contents: 'valid-image',
      httpEtag: '"etag"',
      size: 11,
    })

    const completed = await service.completeUpload('user-a', { key, kind: 'avatar' })
    expect(completed).toMatchObject({
      contentType: 'image/png',
      key: 'avatars/user-a/final-c.png',
      size: 11,
    })
    expect(storage.objects.has(key)).toBe(false)
    await expect(service.getFile('user-a', 'avatar', completed.key)).resolves.toMatchObject({
      size: 11,
    })
    await service.deleteFile('user-a', 'avatar', completed.key)
    expect(storage.objects.has(completed.key)).toBe(false)
  })

  it.each(['avatar', 'logo'] as const)(
    'keeps the finalized %s immutable when the signed staging URL is reused',
    async (kind) => {
      const storage = storageFixture()
      const ids = [`stage-${kind}`, `final-${kind}`]
      const service = new FileUploadService(
        storage.port,
        undefined,
        () => ids.shift() ?? 'unexpected-id',
      )
      const ownerId = kind === 'avatar' ? 'user-a' : 'workspace-a'
      const grant = await service.requestUpload(ownerId, {
        contentType: 'image/png',
        kind,
        size: 15,
      })
      storage.objects.set(grant.key, {
        contentType: 'image/png',
        contents: 'validated-image',
        httpEtag: '"staged"',
        size: 15,
      })

      const completed = await service.completeUpload(ownerId, { key: grant.key, kind })
      expect(completed.key).not.toBe(grant.key)
      expect(storage.objects.has(grant.key)).toBe(false)

      storage.objects.set(grant.key, {
        contentType: 'image/png',
        contents: 'replacement-after-completion',
        httpEtag: '"reused-url"',
        size: 28,
      })
      const served = await service.getFile(ownerId, kind, completed.key)
      expect(served).not.toBeNull()
      expect(await new Response(served?.body).text()).toBe('validated-image')
    },
  )

  it('round-trips only same-origin Starter asset references', () => {
    const key = createOwnedFileKey('logo', 'workspace-a', 'image/png', 'upload-d')
    const assetUrl = fileAssetUrl('logo', key)
    expect(fileKeyFromAssetUrl(assetUrl, 'logo')).toBe(key)
    expect(fileKeyFromAssetUrl('https://attacker.example/api/files/logo?key=x', 'logo')).toBeNull()
    expect(fileKeyFromAssetUrl(assetUrl, 'avatar')).toBeNull()
    expect(isOwnedFileKey('logo', 'workspace-b', key)).toBe(false)
  })
})

function storageFixture() {
  const objects = new Map<string, StoredFileMetadata & { contents: string }>()
  const port: FileStoragePort = {
    createUploadUrl: vi.fn(async () => 'https://upload.example/signed'),
    delete: vi.fn(async (key) => {
      objects.delete(key)
    }),
    get: vi.fn(async (key) => {
      const object = objects.get(key)
      if (!object) return null
      const { contents, ...metadata } = object
      return {
        ...metadata,
        body: new Blob([contents]).stream(),
        writeHttpMetadata() {},
      } satisfies StoredFile
    }),
    put: vi.fn(async (key, value) => {
      const contents = await new Response(value.body).text()
      const object = {
        contentType: value.contentType,
        contents,
        httpEtag: '"finalized"',
        size: new TextEncoder().encode(contents).byteLength,
      }
      objects.set(key, object)
      return object
    }),
  }
  return { objects, port }
}
