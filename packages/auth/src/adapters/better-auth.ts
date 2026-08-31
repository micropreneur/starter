import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { accounts, createDb, sessions, users, verifications } from '@micropreneur/db'
import type { EmailPort, EmailTemplate } from '@micropreneur/email'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import type { AuthPort, AuthSession, AuthUser, SignInInput, SignUpInput } from '../port'
import { UnauthorizedError } from '../port'

export interface BetterAuthAdapterOptions {
  database: D1Database
  baseUrl?: string
  secret?: string
  /**
   * Opt in to a well-known development-only signing secret when `secret` is
   * absent. The composition root must enable this only for local origins;
   * without it, a missing secret throws instead of deploying a known key.
   */
  allowLocalDevelopmentSecret?: boolean
  defer?: (task: Promise<unknown>) => void
  email?: EmailPort
  googleClientId?: string
  googleClientSecret?: string
  onUserCreated?: (user: AuthUser) => Promise<void>
  requireEmailVerification?: boolean
}

const LOCAL_DEVELOPMENT_SECRET = 'starter-local-development-secret-change-me'

function resolveSecret(options: BetterAuthAdapterOptions): string {
  if (options.secret) return options.secret
  if (options.allowLocalDevelopmentSecret) return LOCAL_DEVELOPMENT_SECRET
  throw new Error(
    'BETTER_AUTH_SECRET is required. Set it in apps/web/.dev.vars for local development or as a Worker secret (`wrangler secret put BETTER_AUTH_SECRET`) before deploying.',
  )
}

export function createBetterAuthAdapter(options: BetterAuthAdapterOptions): AuthPort {
  const baseURL = options.baseUrl ?? 'http://localhost:3000'
  const secret = resolveSecret(options)
  const google = resolveGoogleProvider(options)
  const database = createDb(options.database)
  const auth = betterAuth({
    baseURL,
    databaseHooks: options.onUserCreated
      ? {
          user: {
            create: {
              after: async (user) => {
                await options.onUserCreated?.(toAuthUser(user))
              },
            },
          },
        }
      : undefined,
    database: drizzleAdapter(database, {
      provider: 'sqlite',
      schema: {
        account: accounts,
        session: sessions,
        user: users,
        verification: verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: options.requireEmailVerification ?? false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: options.email
        ? async ({ user, url }) => {
            await sendEmail(options, {
              actionUrl: url,
              recipient: { email: user.email, name: user.name },
              template: 'reset_password',
            })
          }
        : undefined,
    },
    emailVerification: options.email
      ? {
          afterEmailVerification: async (user) => {
            await sendEmail(options, {
              recipient: { email: user.email, name: user.name },
              template: 'welcome',
            })
          },
          autoSignInAfterVerification: false,
          sendOnSignIn: false,
          sendOnSignUp: true,
          sendVerificationEmail: async ({ user, url }) => {
            await sendEmail(options, {
              actionUrl: url,
              recipient: { email: user.email, name: user.name },
              template: 'verify_email',
            })
          },
        }
      : undefined,
    plugins: [tanstackStartCookies()],
    secret,
    socialProviders: google ? { google } : undefined,
    trustedOrigins: [baseURL],
    user: {
      changeEmail: {
        enabled: true,
      },
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: options.email
          ? async ({ user, url }) => {
              await sendEmail(options, {
                actionUrl: url,
                recipient: { email: user.email, name: user.name },
                template: 'delete_account',
              })
            }
          : undefined,
      },
    },
  })

  const getSession = async (headers: Headers): Promise<AuthSession | null> => {
    const result = await auth.api.getSession({ headers })
    if (!result) return null

    return {
      expiresAt: result.session.expiresAt,
      user: toAuthUser(result.user),
    }
  }

  return {
    provider: 'betterauth',
    getSession,
    async getUser(headers) {
      return (await getSession(headers))?.user ?? null
    },
    async requireUser(headers) {
      const user = (await getSession(headers))?.user
      if (!user) throw new UnauthorizedError()
      return user
    },
    signIn(input: SignInInput, headers: Headers) {
      return auth.api.signInEmail({
        asResponse: true,
        body: input,
        headers,
      })
    },
    signInSocial(input, headers) {
      if (!google) {
        return Promise.resolve(
          Response.json({ error: 'Google OAuth is not configured.' }, { status: 501 }),
        )
      }
      return auth.api.signInSocial({
        asResponse: true,
        body: { callbackURL: input.callbackUrl, provider: input.provider },
        headers,
      })
    },
    signUp(input: SignUpInput, headers: Headers) {
      return auth.api.signUpEmail({
        asResponse: true,
        body: {
          callbackURL: input.callbackUrl,
          email: input.email,
          name: input.name,
          password: input.password,
        },
        headers,
      })
    },
    signOut(headers: Headers) {
      return auth.api.signOut({ asResponse: true, headers })
    },
    sendVerificationEmail(email, callbackUrl, headers) {
      return auth.api.sendVerificationEmail({
        asResponse: true,
        body: { callbackURL: callbackUrl, email },
        headers,
      })
    },
    requestPasswordReset(input, headers) {
      return auth.api.requestPasswordReset({
        asResponse: true,
        body: { email: input.email, redirectTo: input.redirectTo },
        headers,
      })
    },
    resetPassword(input, headers) {
      return auth.api.resetPassword({
        asResponse: true,
        body: { newPassword: input.newPassword, token: input.token },
        headers,
      })
    },
    updateUser(input, headers) {
      return auth.api.updateUser({ asResponse: true, body: input, headers })
    },
    changeEmail(input, headers) {
      return auth.api.changeEmail({
        asResponse: true,
        body: { callbackURL: input.callbackUrl, newEmail: input.newEmail },
        headers,
      })
    },
    changePassword(input, headers) {
      return auth.api.changePassword({
        asResponse: true,
        body: { ...input, revokeOtherSessions: true },
        headers,
      })
    },
    async listAccounts(headers) {
      const linked = await auth.api.listUserAccounts({ headers })
      return linked.map((account) => ({ provider: account.providerId }))
    },
    deleteUser(input, headers) {
      return auth.api.deleteUser({
        asResponse: true,
        body: { callbackURL: input.callbackUrl, password: input.password },
        headers,
      })
    },
    handleRequest(request: Request) {
      return auth.handler(request)
    },
  }
}

function resolveGoogleProvider(options: BetterAuthAdapterOptions) {
  if (Boolean(options.googleClientId) !== Boolean(options.googleClientSecret)) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together.')
  }
  if (!options.googleClientId || !options.googleClientSecret) return undefined
  return { clientId: options.googleClientId, clientSecret: options.googleClientSecret }
}

async function sendEmail(
  options: BetterAuthAdapterOptions,
  message: {
    actionUrl?: string
    recipient: { email: string; name?: string }
    template: EmailTemplate
  },
) {
  if (!options.email) return
  const task = options.email.send({
    actionUrl: message.actionUrl,
    name: message.recipient.name,
    template: message.template,
    to: message.recipient.email,
  })
  if (options.defer) {
    options.defer(task)
    return
  }
  await task
}

function toAuthUser(user: {
  id: string
  email: string
  name: string
  image?: string | null
}): AuthUser {
  return {
    email: user.email,
    id: user.id,
    image: user.image,
    name: user.name,
  }
}
