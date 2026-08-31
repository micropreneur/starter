import { env as cloudflareEnv } from 'cloudflare:workers'
import type { AuthUser } from '@micropreneur/auth'
import { createDb } from '@micropreneur/db'
import {
  type FileKind,
  FileUploadValidationError,
  fileAssetUrl,
  fileKeyFromAssetUrl,
} from '@micropreneur/files'
import {
  type ActiveWorkspace,
  requireActiveWorkspace,
  updatePersonalWorkspaceAvatar,
} from '@micropreneur/workspaces'

import type { WebEnv } from '../env'
import { getAuth } from './auth.server'
import { createFileUploadService } from './files.server'
import { requireSameOrigin } from './request-security'

interface ResolvedFileOwner {
  id: string
  user: AuthUser
  workspace?: ActiveWorkspace
}

export async function handleFileGet(request: Request, kind: FileKind) {
  const owner = await resolveFileOwner(request, kind)
  const key = new URL(request.url).searchParams.get('key')
  if (!key || key.length > 1024) return new Response('Not found.', { status: 404 })

  try {
    const object = await createFileUploadService(environment()).getFile(owner.id, kind, key)
    if (!object) return new Response('Not found.', { status: 404 })
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('cache-control', 'private, no-cache')
    headers.set('content-length', String(object.size))
    headers.set('content-security-policy', "default-src 'none'; sandbox")
    headers.set('etag', object.httpEtag)
    headers.set('x-content-type-options', 'nosniff')
    return new Response(object.body, { headers })
  } catch (error) {
    if (error instanceof FileUploadValidationError && error.reason === 'owner_mismatch') {
      return new Response('Not found.', { status: 404 })
    }
    throw error
  }
}

export async function handleFileDelete(request: Request, kind: FileKind) {
  requireSameOrigin(request)
  const owner = await resolveFileOwner(request, kind)
  const currentUrl = kind === 'avatar' ? owner.user.image : owner.workspace?.avatarUrl
  const currentKey = fileKeyFromAssetUrl(currentUrl, kind)

  const referenceResponse = await updateReference(request, kind, owner, null)
  if (!referenceResponse.ok) return referenceResponse
  if (currentKey) {
    await deleteFileBestEffort(kind, owner.id, currentKey, 'reference removal')
  }
  return referenceResponse
}

export async function replaceFileReference(
  request: Request,
  kind: FileKind,
  key: string,
  user?: AuthUser,
) {
  const owner = await resolveFileOwner(request, kind, user)
  const service = createFileUploadService(environment())
  let completed: Awaited<ReturnType<typeof service.completeUpload>>
  try {
    completed = await service.completeUpload(owner.id, { key, kind })
  } catch (error) {
    if (error instanceof FileUploadValidationError) return fileValidationResponse(error)
    throw error
  }

  const currentUrl = kind === 'avatar' ? owner.user.image : owner.workspace?.avatarUrl
  const currentKey = fileKeyFromAssetUrl(currentUrl, kind)
  let referenceResponse: Response
  try {
    referenceResponse = await updateReference(
      request,
      kind,
      owner,
      fileAssetUrl(kind, completed.key),
    )
  } catch (error) {
    if (currentKey !== completed.key) {
      await deleteFileBestEffort(kind, owner.id, completed.key, 'reference update')
    }
    throw error
  }
  if (!referenceResponse.ok) {
    if (currentKey !== completed.key) {
      await deleteFileBestEffort(kind, owner.id, completed.key, 'reference update')
    }
    return referenceResponse
  }
  if (currentKey && currentKey !== completed.key) {
    await deleteFileBestEffort(kind, owner.id, currentKey, 'previous file cleanup')
  }
  return referenceResponse
}

export async function resolveFileOwner(
  request: Request,
  kind: FileKind,
  user?: AuthUser,
): Promise<ResolvedFileOwner> {
  const authenticatedUser = user ?? (await requireFileUser(request))
  if (kind === 'avatar') return { id: authenticatedUser.id, user: authenticatedUser }
  const workspace = await requireActiveWorkspace(database(), authenticatedUser.id)
  return { id: workspace.id, user: authenticatedUser, workspace }
}

export function requireFileUser(request: Request) {
  return getAuth().requireUser(new Headers(request.headers))
}

export function fileValidationResponse(error: FileUploadValidationError) {
  const status =
    error.reason === 'owner_mismatch' ? 404 : error.reason === 'object_missing' ? 409 : 400
  return Response.json({ error: error.message }, { status })
}

function updateReference(
  request: Request,
  kind: FileKind,
  owner: ResolvedFileOwner,
  assetUrl: string | null,
) {
  if (kind === 'avatar') {
    return getAuth().updateUser({ image: assetUrl }, new Headers(request.headers))
  }
  return updatePersonalWorkspaceAvatar(database(), owner.user.id, assetUrl).then(() => {
    return Response.json({ assetUrl })
  })
}

async function deleteFileBestEffort(
  kind: FileKind,
  ownerId: string,
  key: string,
  operation: string,
) {
  try {
    await createFileUploadService(environment()).deleteFile(ownerId, kind, key)
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        kind,
        message: `file cleanup failed after ${operation}`,
      }),
    )
  }
}

function environment() {
  return cloudflareEnv as unknown as WebEnv
}

function database() {
  return createDb(environment().DB)
}
