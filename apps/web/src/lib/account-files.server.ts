import type { AuthUser } from '@micropreneur/auth'
import type { FileUploadService } from '@micropreneur/files'
import { personalWorkspaceId } from '@micropreneur/workspaces'

import type { WebEnv } from '../env'
import { createFileUploadService } from './files.server'

export function createAccountFileDeletionHook(env: WebEnv) {
  const files = createFileUploadService(env)
  return (user: AuthUser) => deleteAccountFiles(user, files)
}

export function deleteAccountFiles(
  user: AuthUser,
  files: Pick<FileUploadService, 'deleteOwnerFiles'>,
): Promise<void> {
  return files.deleteOwnerFiles([
    { kind: 'avatar', ownerId: user.id },
    { kind: 'logo', ownerId: personalWorkspaceId(user.id) },
  ])
}
