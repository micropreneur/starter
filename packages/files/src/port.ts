export type FileKind = 'avatar' | 'logo'
export type FileContentType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface FileUploadRequest {
  contentType: FileContentType
  kind: FileKind
  size: number
}

export interface FileUploadCompletion {
  key: string
  kind: FileKind
}

export interface FileUploadGrant {
  expiresAt: string
  headers: { 'content-type': FileContentType }
  key: string
  maxBytes: number
  uploadUrl: string
}

export interface StoredFileMetadata {
  contentType?: string
  httpEtag: string
  size: number
}

export interface StoredFile extends StoredFileMetadata {
  body: ReadableStream<Uint8Array>
  writeHttpMetadata(headers: Headers): void
}

export interface FinalizedFile extends StoredFileMetadata {
  key: string
}

export interface FileOwner {
  kind: FileKind
  ownerId: string
}

export interface StoredFileList {
  cursor?: string
  keys: string[]
  truncated: boolean
}

export interface FileStoragePort {
  createUploadUrl(input: {
    contentLength: number
    contentType: FileContentType
    expiresInSeconds: number
    key: string
  }): Promise<string>
  delete(key: string | string[]): Promise<void>
  get(key: string): Promise<StoredFile | null>
  list(input: { cursor?: string; prefix: string }): Promise<StoredFileList>
  put(
    key: string,
    value: { body: ReadableStream<Uint8Array>; contentType: FileContentType },
  ): Promise<StoredFileMetadata>
}
