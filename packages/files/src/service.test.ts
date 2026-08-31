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
      contentLength: 1024,
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
      contents: new Uint8Array([0]),
      httpEtag: '"etag"',
      size: 100,
    })

    await expect(
      service.completeUpload('workspace-a', { key, kind: 'logo' }),
    ).rejects.toMatchObject({ reason: 'content_type_mismatch' })
    expect(storage.port.delete).toHaveBeenCalledWith(key)
    expect(storage.objects.has(key)).toBe(false)
  })

  it('rejects spoofed image metadata when the stored bytes do not match', async () => {
    const storage = storageFixture()
    const service = new FileUploadService(storage.port)
    const key = createStagedFileKey('avatar', 'user-a', 'image/png', 'upload-spoofed')
    const contents = new TextEncoder().encode('not actually a png')
    storage.objects.set(key, {
      contentType: 'image/png',
      contents,
      httpEtag: '"etag"',
      size: contents.byteLength,
    })

    await expect(service.completeUpload('user-a', { key, kind: 'avatar' })).rejects.toMatchObject({
      reason: 'file_signature_mismatch',
    })
    expect(storage.port.put).not.toHaveBeenCalled()
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
      contents: new Uint8Array([0]),
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
    const contents = validImageBytes('image/png', 'valid-image')
    storage.objects.set(key, {
      contentType: 'image/png',
      contents,
      httpEtag: '"etag"',
      size: contents.byteLength,
    })

    const completed = await service.completeUpload('user-a', { key, kind: 'avatar' })
    expect(completed).toMatchObject({
      contentType: 'image/png',
      key: 'avatars/user-a/final-c.png',
      size: contents.byteLength,
    })
    expect(storage.objects.has(key)).toBe(false)
    await expect(service.getFile('user-a', 'avatar', completed.key)).resolves.toMatchObject({
      size: contents.byteLength,
    })
    await service.deleteFile('user-a', 'avatar', completed.key)
    expect(storage.objects.has(completed.key)).toBe(false)
  })

  it.each(['image/jpeg', 'image/png', 'image/webp'] as const)(
    'accepts a stored %s only when its magic bytes match',
    async (contentType) => {
      const storage = storageFixture()
      const service = new FileUploadService(storage.port, undefined, () => 'final-signature')
      const key = createStagedFileKey('avatar', 'user-a', contentType, 'upload-signature')
      const contents = validImageBytes(contentType, 'payload')
      storage.objects.set(key, {
        contentType,
        contents,
        httpEtag: '"etag"',
        size: contents.byteLength,
      })

      await expect(
        service.completeUpload('user-a', { key, kind: 'avatar' }),
      ).resolves.toMatchObject({ contentType, size: contents.byteLength })
    },
  )

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
        size: validImageBytes('image/png', 'validated-image').byteLength,
      })
      const validatedBytes = validImageBytes('image/png', 'validated-image')
      storage.objects.set(grant.key, {
        contentType: 'image/png',
        contents: validatedBytes,
        httpEtag: '"staged"',
        size: validatedBytes.byteLength,
      })

      const completed = await service.completeUpload(ownerId, { key: grant.key, kind })
      expect(completed.key).not.toBe(grant.key)
      expect(storage.objects.has(grant.key)).toBe(false)

      storage.objects.set(grant.key, {
        contentType: 'image/png',
        contents: validImageBytes('image/png', 'replacement-after-completion'),
        httpEtag: '"reused-url"',
        size: validImageBytes('image/png', 'replacement-after-completion').byteLength,
      })
      const served = await service.getFile(ownerId, kind, completed.key)
      expect(served).not.toBeNull()
      expect(new Uint8Array(await new Response(served?.body).arrayBuffer())).toEqual(validatedBytes)
    },
  )

  it('deletes final and staged avatar and logo collections without crossing owners', async () => {
    const storage = storageFixture()
    const service = new FileUploadService(storage.port)
    const ownedKeys = [
      createOwnedFileKey('avatar', 'user-a', 'image/png', 'avatar-final'),
      createStagedFileKey('avatar', 'user-a', 'image/png', 'avatar-stage'),
      createOwnedFileKey('logo', 'personal:user-a', 'image/png', 'logo-final'),
      createStagedFileKey('logo', 'personal:user-a', 'image/png', 'logo-stage'),
    ]
    const otherOwnerKey = createOwnedFileKey('avatar', 'user-b', 'image/png', 'avatar-final')
    for (const key of [...ownedKeys, otherOwnerKey]) {
      storage.objects.set(key, {
        contentType: 'image/png',
        contents: validImageBytes('image/png'),
        httpEtag: '"etag"',
        size: validImageBytes('image/png').byteLength,
      })
    }

    await service.deleteOwnerFiles([
      { kind: 'avatar', ownerId: 'user-a' },
      { kind: 'logo', ownerId: 'personal:user-a' },
    ])

    expect(ownedKeys.every((key) => !storage.objects.has(key))).toBe(true)
    expect(storage.objects.has(otherOwnerKey)).toBe(true)
    expect(storage.port.delete).toHaveBeenCalledWith(ownedKeys)
  })

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
  const objects = new Map<string, StoredFileMetadata & { contents: Uint8Array }>()
  const port: FileStoragePort = {
    createUploadUrl: vi.fn(async () => 'https://upload.example/signed'),
    delete: vi.fn(async (keyOrKeys) => {
      for (const key of Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]) objects.delete(key)
    }),
    get: vi.fn(async (key) => {
      const object = objects.get(key)
      if (!object) return null
      const { contents, ...metadata } = object
      return {
        ...metadata,
        body: new Blob([Uint8Array.from(contents).buffer]).stream(),
        writeHttpMetadata() {},
      } satisfies StoredFile
    }),
    list: vi.fn(async ({ cursor, prefix }) => {
      const matching = [...objects.keys()].filter((key) => key.startsWith(prefix)).sort()
      const offset = Number(cursor ?? 0)
      const keys = matching.slice(offset, offset + 1)
      const nextOffset = offset + keys.length
      return {
        cursor: nextOffset < matching.length ? String(nextOffset) : undefined,
        keys,
        truncated: nextOffset < matching.length,
      }
    }),
    put: vi.fn(async (key, value) => {
      const contents = new Uint8Array(await new Response(value.body).arrayBuffer())
      const object = {
        contentType: value.contentType,
        contents,
        httpEtag: '"finalized"',
        size: contents.byteLength,
      }
      objects.set(key, object)
      return object
    }),
  }
  return { objects, port }
}

function validImageBytes(contentType: 'image/jpeg' | 'image/png' | 'image/webp', payload = '') {
  const signature =
    contentType === 'image/jpeg'
      ? [0xff, 0xd8, 0xff]
      : contentType === 'image/png'
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
        : [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]
  const payloadBytes = new TextEncoder().encode(payload)
  const bytes = new Uint8Array(signature.length + payloadBytes.byteLength)
  bytes.set(signature)
  bytes.set(payloadBytes, signature.length)
  return bytes
}
