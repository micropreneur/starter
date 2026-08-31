import { env as cloudflareEnv } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import type { WebEnv } from '../env'
import { getAuth } from './auth.server'
import { fileUploadsConfigured } from './files.server'
import { resolveTurnstileConfig } from './turnstile.server'

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  return getAuth().getUser(getRequestHeaders())
})

export const getAuthCapabilities = createServerFn({ method: 'GET' }).handler(async () => {
  const env = cloudflareEnv as unknown as WebEnv
  return {
    googleOAuth: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    turnstileSiteKey: resolveTurnstileConfig(env)?.siteKey,
  }
})

export const getAccountOverview = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const auth = getAuth()
  const user = await auth.requireUser(headers)
  const accounts = await auth.listAccounts(headers)
  const env = cloudflareEnv as unknown as WebEnv
  return { accounts, fileUploadsConfigured: fileUploadsConfigured(env), user }
})
