import type {
  FileContentType,
  FileKind,
  FileOwner,
  FileStoragePort,
  FileUploadCompletion,
  FileUploadGrant,
  FileUploadRequest,
  FinalizedFile,
  StoredFile,
  StoredFileMetadata,
} from './port'
import { fileUploadCompletionSchema, fileUploadRequestSchema } from './schema'

const uploadExpirySeconds = 5 * 60
const extensionFor = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const satisfies Record<FileContentType, string>

export const fileUploadPolicies = {
  avatar: {
    label: 'avatar',
    maxBytes: 2 * 1024 * 1024,
    prefix: 'avatars',
  },
  logo: {
    label: 'workspace logo',
    maxBytes: 5 * 1024 * 1024,
    prefix: 'workspace-logos',
  },
} as const satisfies Record<FileKind, { label: string; maxBytes: number; prefix: string }>

export type FileUploadValidationReason =
  | 'content_type_mismatch'
  | 'empty_file'
  | 'file_too_large'
  | 'invalid_input'
  | 'object_missing'
  | 'owner_mismatch'

export class FileUploadValidationError extends Error {
  override readonly name = 'FileUploadValidationError'

  constructor(
    readonly reason: FileUploadValidationReason,
    message: string,
  ) {
    super(message)
  }
}

export class FileUploadService {
  constructor(
    private readonly storage: FileStoragePort,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async requestUpload(ownerId: string, value: FileUploadRequest): Promise<FileUploadGrant> {
    const parsed = fileUploadRequestSchema.safeParse(value)
    if (!parsed.success) {
      throw new FileUploadValidationError('invalid_input', 'Invalid file upload request.')
    }
    const policy = fileUploadPolicies[parsed.data.kind]
    if (parsed.data.size > policy.maxBytes) {
      throw new FileUploadValidationError(
        'file_too_large',
        `The ${policy.label} must be ${formatBytes(policy.maxBytes)} or smaller.`,
      )
    }

    const key = createStagedFileKey(
      parsed.data.kind,
      ownerId,
      parsed.data.contentType,
      this.createId(),
    )
    const uploadUrl = await this.storage.createUploadUrl({
      contentType: parsed.data.contentType,
      expiresInSeconds: uploadExpirySeconds,
      key,
    })

    return {
      expiresAt: new Date(this.now().getTime() + uploadExpirySeconds * 1000).toISOString(),
      headers: { 'content-type': parsed.data.contentType },
      key,
      maxBytes: policy.maxBytes,
      uploadUrl,
    }
  }

  async completeUpload(ownerId: string, value: FileUploadCompletion): Promise<FinalizedFile> {
    const parsed = fileUploadCompletionSchema.safeParse(value)
    if (!parsed.success) {
      throw new FileUploadValidationError('invalid_input', 'Invalid upload completion request.')
    }
    requireOwnedStagedFileKey(parsed.data.kind, ownerId, parsed.data.key)
    const object = await this.storage.get(parsed.data.key)
    if (!object) {
      throw new FileUploadValidationError('object_missing', 'The uploaded file was not found.')
    }

    try {
      validateStoredFile(parsed.data.kind, parsed.data.key, object)
    } catch (error) {
      await this.storage.delete(parsed.data.key)
      throw error
    }

    const contentType = contentTypeFromKey(parsed.data.key)
    if (!contentType) {
      await this.storage.delete(parsed.data.key)
      throw new FileUploadValidationError('invalid_input', 'Invalid staged file key.')
    }
    const finalKey = createOwnedFileKey(parsed.data.kind, ownerId, contentType, this.createId())
    const finalized = await this.storage.put(finalKey, {
      body: object.body,
      contentType,
    })
    try {
      validateStoredFile(parsed.data.kind, finalKey, finalized)
    } catch (error) {
      await this.storage.delete(finalKey)
      await this.storage.delete(parsed.data.key)
      throw error
    }
    try {
      await this.storage.delete(parsed.data.key)
    } catch (error) {
      await this.storage.delete(finalKey)
      throw error
    }
    return { ...finalized, key: finalKey }
  }

  async getFile(ownerId: string, kind: FileKind, key: string): Promise<StoredFile | null> {
    requireOwnedFileKey(kind, ownerId, key)
    return this.storage.get(key)
  }

  async deleteFile(ownerId: string, kind: FileKind, key: string): Promise<void> {
    requireOwnedFileKey(kind, ownerId, key)
    await this.storage.delete(key)
  }

  async deleteOwnerFiles(owners: readonly FileOwner[]): Promise<void> {
    const keys = new Set<string>()
    for (const owner of owners) {
      for (const prefix of ownedFilePrefixes(owner.kind, owner.ownerId)) {
        let cursor: string | undefined
        do {
          const page = await this.storage.list({ cursor, prefix })
          for (const key of page.keys) {
            if (!key.startsWith(prefix)) {
              throw new Error('File storage returned an object outside the requested owner prefix.')
            }
            keys.add(key)
          }
          if (page.truncated && !page.cursor) {
            throw new Error('File storage returned a truncated page without a cursor.')
          }
          cursor = page.truncated ? page.cursor : undefined
        } while (cursor)
      }
    }

    const values = [...keys]
    for (let index = 0; index < values.length; index += 1000) {
      await this.storage.delete(values.slice(index, index + 1000))
    }
  }
}

export function createOwnedFileKey(
  kind: FileKind,
  ownerId: string,
  contentType: FileContentType,
  uploadId: string,
): string {
  return createFileKey(fileUploadPolicies[kind].prefix, ownerId, contentType, uploadId)
}

export function createStagedFileKey(
  kind: FileKind,
  ownerId: string,
  contentType: FileContentType,
  uploadId: string,
): string {
  return createFileKey(`staging/${fileUploadPolicies[kind].prefix}`, ownerId, contentType, uploadId)
}

function createFileKey(
  prefix: string,
  ownerId: string,
  contentType: FileContentType,
  uploadId: string,
): string {
  const safeUploadId = uploadId.trim()
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(safeUploadId)) {
    throw new FileUploadValidationError('invalid_input', 'Invalid upload identifier.')
  }
  const ownerSegment = ownerKeySegment(ownerId)
  if (!ownerSegment) {
    throw new FileUploadValidationError('invalid_input', 'A file owner is required.')
  }
  return `${prefix}/${ownerSegment}/${safeUploadId}.${extensionFor[contentType]}`
}

export function isOwnedFileKey(kind: FileKind, ownerId: string, key: string): boolean {
  const ownerSegment = ownerKeySegment(ownerId)
  if (!ownerSegment) return false
  const prefix = ownedFilePrefix(kind, ownerId)
  if (!key.startsWith(prefix)) return false
  return /^[a-zA-Z0-9_-]{1,64}\.(jpg|png|webp)$/.test(key.slice(prefix.length))
}

export function requireOwnedFileKey(kind: FileKind, ownerId: string, key: string): void {
  if (!isOwnedFileKey(kind, ownerId, key)) {
    throw new FileUploadValidationError(
      'owner_mismatch',
      'The file does not belong to the authenticated owner.',
    )
  }
}

export function isOwnedStagedFileKey(kind: FileKind, ownerId: string, key: string): boolean {
  const ownerSegment = ownerKeySegment(ownerId)
  if (!ownerSegment) return false
  const prefix = ownedStagedFilePrefix(kind, ownerId)
  if (!key.startsWith(prefix)) return false
  return /^[a-zA-Z0-9_-]{1,64}\.(jpg|png|webp)$/.test(key.slice(prefix.length))
}

export function requireOwnedStagedFileKey(kind: FileKind, ownerId: string, key: string): void {
  if (!isOwnedStagedFileKey(kind, ownerId, key)) {
    throw new FileUploadValidationError(
      'owner_mismatch',
      'The staged file does not belong to the authenticated owner.',
    )
  }
}

export function ownedFilePrefix(kind: FileKind, ownerId: string): string {
  const ownerSegment = ownerKeySegment(ownerId)
  if (!ownerSegment) {
    throw new FileUploadValidationError('invalid_input', 'A file owner is required.')
  }
  return `${fileUploadPolicies[kind].prefix}/${ownerSegment}/`
}

export function ownedStagedFilePrefix(kind: FileKind, ownerId: string): string {
  return `staging/${ownedFilePrefix(kind, ownerId)}`
}

export function ownedFilePrefixes(kind: FileKind, ownerId: string): [string, string] {
  return [ownedFilePrefix(kind, ownerId), ownedStagedFilePrefix(kind, ownerId)]
}

export function fileAssetUrl(kind: FileKind, key: string): string {
  return `/api/files/${kind}?key=${encodeURIComponent(key)}`
}

export function fileKeyFromAssetUrl(value: string | null | undefined, kind: FileKind) {
  if (!value) return null
  const base = new URL('https://starter.invalid')
  let parsed: URL
  try {
    parsed = new URL(value, base)
  } catch {
    return null
  }
  if (parsed.origin !== base.origin || parsed.pathname !== `/api/files/${kind}`) return null
  return parsed.searchParams.get('key')
}

function validateStoredFile(kind: FileKind, key: string, object: StoredFileMetadata) {
  const policy = fileUploadPolicies[kind]
  if (object.size <= 0) {
    throw new FileUploadValidationError('empty_file', `The ${policy.label} cannot be empty.`)
  }
  if (object.size > policy.maxBytes) {
    throw new FileUploadValidationError(
      'file_too_large',
      `The ${policy.label} must be ${formatBytes(policy.maxBytes)} or smaller.`,
    )
  }
  const expectedContentType = contentTypeFromKey(key)
  if (!expectedContentType || object.contentType !== expectedContentType) {
    throw new FileUploadValidationError(
      'content_type_mismatch',
      `The stored ${policy.label} does not match its approved image type.`,
    )
  }
}

function contentTypeFromKey(key: string): FileContentType | null {
  if (key.endsWith('.jpg')) return 'image/jpeg'
  if (key.endsWith('.png')) return 'image/png'
  if (key.endsWith('.webp')) return 'image/webp'
  return null
}

function ownerKeySegment(ownerId: string): string {
  return encodeURIComponent(ownerId).replaceAll('.', '%2E')
}

function formatBytes(value: number) {
  return `${value / (1024 * 1024)} MB`
}
