import type { EmailPort } from '@micropreneur/email'
import { createBetterAuthAdapter } from './adapters/better-auth'
import { createDescopeAdapter } from './adapters/descope'
import type { AuthPort, AuthProvider, AuthUser } from './port'

export * from './port'

export interface CreateAuthOptions {
  database?: D1Database
  betterAuthBaseUrl?: string
  betterAuthSecret?: string
  googleClientId?: string
  googleClientSecret?: string
  onUserCreated?: (user: AuthUser) => Promise<void>
  email?: EmailPort
  defer?: (task: Promise<unknown>) => void
  requireEmailVerification?: boolean
  /**
   * Permit the checked-in development-only secret when no secret is set.
   * Only the composition root should enable this, and only for local origins.
   */
  allowLocalDevelopmentSecret?: boolean
}

export function resolveAuthProvider(value?: string): AuthProvider {
  const provider = value?.trim().toLowerCase() || 'betterauth'
  if (provider === 'betterauth' || provider === 'descope') return provider
  throw new Error(`Unsupported AUTH_PROVIDER: ${value}`)
}

export function createAuth(provider: AuthProvider, options: CreateAuthOptions = {}): AuthPort {
  switch (provider) {
    case 'descope':
      return createDescopeAdapter()
    case 'betterauth': {
      if (!options.database) {
        throw new Error('The Better Auth adapter requires a Cloudflare D1 database binding.')
      }

      return createBetterAuthAdapter({
        allowLocalDevelopmentSecret: options.allowLocalDevelopmentSecret,
        baseUrl: options.betterAuthBaseUrl,
        database: options.database,
        defer: options.defer,
        email: options.email,
        googleClientId: options.googleClientId,
        googleClientSecret: options.googleClientSecret,
        onUserCreated: options.onUserCreated,
        requireEmailVerification: options.requireEmailVerification,
        secret: options.betterAuthSecret,
      })
    }
    default: {
      const unhandled: never = provider
      throw new Error(`Unsupported auth provider: ${String(unhandled)}`)
    }
  }
}
