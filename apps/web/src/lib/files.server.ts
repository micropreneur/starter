import { type FileStoragePort, FileUploadService } from '@micropreneur/files'
import { AwsClient } from 'aws4fetch'

import type { WebEnv } from '../env'

interface R2SigningConfig {
  accessKeyId: string
  accountId: string
  bucketName: string
  secretAccessKey: string
}

export class FileUploadsNotConfiguredError extends Error {
  override readonly name = 'FileUploadsNotConfiguredError'

  constructor() {
    super('R2 uploads are not configured in this environment.')
  }
}

export function fileUploadsConfigured(env: WebEnv): boolean {
  return resolveR2SigningConfig(env) !== null
}

export function createFileUploadService(env: WebEnv): FileUploadService {
  return new FileUploadService(createR2Storage(env))
}

export function resolveR2SigningConfig(env: WebEnv): R2SigningConfig | null {
  const accountId = env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim()
  const bucketName = env.R2_BUCKET_NAME?.trim()

  if (!accountId && !accessKeyId && !secretAccessKey) return null
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME must be configured together.',
    )
  }
  if (!env.AUTH_RATE_LIMITER) {
    throw new Error(
      'AUTH_RATE_LIMITER is required when R2 signing is configured. Restore the rate-limit binding in apps/web/wrangler.jsonc before issuing upload grants.',
    )
  }
  return { accessKeyId, accountId, bucketName, secretAccessKey }
}

function createR2Storage(env: WebEnv): FileStoragePort {
  return {
    async createUploadUrl({ contentLength, contentType, expiresInSeconds, key }) {
      const config = resolveR2SigningConfig(env)
      if (!config) throw new FileUploadsNotConfiguredError()
      const client = new AwsClient({
        accessKeyId: config.accessKeyId,
        region: 'auto',
        secretAccessKey: config.secretAccessKey,
        service: 's3',
      })
      const encodedKey = key.split('/').map(encodeURIComponent).join('/')
      const url = new URL(
        `https://${config.accountId}.r2.cloudflarestorage.com/${encodeURIComponent(config.bucketName)}/${encodedKey}`,
      )
      url.searchParams.set('X-Amz-Expires', String(expiresInSeconds))
      const signed = await client.sign(
        new Request(url, {
          headers: {
            'content-length': String(contentLength),
            'content-type': contentType,
          },
          method: 'PUT',
        }),
        { aws: { allHeaders: true, signQuery: true } },
      )
      return signed.url.toString()
    },
    delete(key) {
      return env.FILES.delete(key)
    },
    async get(key) {
      const object = await env.FILES.get(key)
      if (!object) return null
      return {
        body: object.body,
        contentType: object.httpMetadata?.contentType,
        httpEtag: object.httpEtag,
        size: object.size,
        writeHttpMetadata(headers) {
          object.writeHttpMetadata(headers)
        },
      }
    },
    async list({ cursor, prefix }) {
      const page = await env.FILES.list({ cursor, limit: 1000, prefix })
      return {
        cursor: page.truncated ? page.cursor : undefined,
        keys: page.objects.map((object) => object.key),
        truncated: page.truncated,
      }
    },
    async put(key, value) {
      const object = await env.FILES.put(key, value.body, {
        httpMetadata: { contentType: value.contentType },
      })
      return {
        contentType: object.httpMetadata?.contentType,
        httpEtag: object.httpEtag,
        size: object.size,
      }
    },
  }
}
