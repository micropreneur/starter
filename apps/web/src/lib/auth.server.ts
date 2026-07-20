import { env as cloudflareEnv, waitUntil } from 'cloudflare:workers'
import { type AuthPort, createAuth, resolveAuthProvider } from '@micropreneur/auth'
import { createDb } from '@micropreneur/db'
import {
  createLocalEmailAdapter,
  createResendEmailAdapter,
  resolveEmailProvider,
} from '@micropreneur/email'
import { bootstrapPersonalWorkspace } from '@micropreneur/workspaces'

import type { WebEnv } from '../env'
import { isLocalAuthEnvironment, resolveBetterAuthBaseUrl } from './auth-environment'

let cachedAuth: AuthPort | undefined

export function getAuth(): AuthPort {
  if (cachedAuth) return cachedAuth

  const env = cloudflareEnv as unknown as WebEnv
  const provider = resolveAuthProvider(env.AUTH_PROVIDER)
  const baseUrl =
    provider === 'betterauth'
      ? resolveBetterAuthBaseUrl(env.BETTER_AUTH_URL, import.meta.env.DEV)
      : env.BETTER_AUTH_URL
  const local = isLocalAuthEnvironment(baseUrl, import.meta.env.DEV)
  const emailProvider = resolveEmailProvider(env.EMAIL_PROVIDER, local)
  const email =
    emailProvider === 'resend'
      ? createResendEmailAdapter({
          apiKey: env.RESEND_API_KEY ?? '',
          from: env.EMAIL_FROM ?? '',
        })
      : createLocalEmailAdapter()
  cachedAuth = createAuth(provider, {
    allowLocalDevelopmentSecret: local,
    betterAuthBaseUrl: baseUrl,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    defer: (task) => waitUntil(task),
    email,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    onUserCreated: (user) =>
      bootstrapPersonalWorkspace(createDb(env.DB), user).then(() => undefined),
    requireEmailVerification: true,
  })
  return cachedAuth
}
