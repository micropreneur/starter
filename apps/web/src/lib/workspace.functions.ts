import { env as cloudflareEnv } from 'cloudflare:workers'
import { createDb } from '@micropreneur/db'
import {
  completePersonalWorkspaceOnboarding,
  requireActiveWorkspace,
  workspaceOnboardingSchema,
} from '@micropreneur/workspaces'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import type { WebEnv } from '../env'
import { getAuth } from './auth.server'

/** Build the authenticated application context without accepting tenant identity from the client. */
export const getAppContext = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuth().getUser(getRequestHeaders())
  if (!user) return null

  const workspace = await requireActiveWorkspace(database(), user.id)
  return { user, workspace }
})

export const completeWorkspaceOnboarding = createServerFn({ method: 'POST' })
  .validator(workspaceOnboardingSchema)
  .handler(async ({ data }) => {
    const user = await getAuth().requireUser(getRequestHeaders())
    return completePersonalWorkspaceOnboarding(database(), user.id, data)
  })

function database() {
  const env = cloudflareEnv as unknown as WebEnv
  return createDb(env.DB)
}
