import { readdirSync, readFileSync } from 'node:fs'
import { createLocalEmailAdapter, type EmailMessage } from '@micropreneur/email'
import { Miniflare } from 'miniflare'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { UnauthorizedError } from '../port'
import { createBetterAuthAdapter } from './better-auth'

const migrationsDirectory = new URL('../../../db/migrations/', import.meta.url)
const TEST_SECRET = 'contract-test-secret-with-32-plus-characters'

let miniflare: Miniflare
let database: D1Database

beforeAll(async () => {
  miniflare = new Miniflare({
    d1Databases: ['DB'],
    modules: true,
    script: 'export default { fetch: () => new Response(null, { status: 404 }) }',
  })
  database = (await miniflare.getD1Database('DB')) as unknown as D1Database

  for (const filename of readdirSync(migrationsDirectory)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const migration = readFileSync(new URL(filename, migrationsDirectory), 'utf8')
    for (const statement of migration.split('--> statement-breakpoint')) {
      const sql = statement.trim()
      if (sql) await database.prepare(sql).run()
    }
  }
})

afterAll(async () => {
  await miniflare.dispose()
})

function cookieHeadersFrom(response: Response): Headers {
  const cookies = response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';', 1)[0])
    .filter((cookie): cookie is string => Boolean(cookie))
  return new Headers({ cookie: cookies.join('; ') })
}

describe('better auth adapter contract', () => {
  it('requires a secret unless local development is explicitly allowed', () => {
    expect(() => createBetterAuthAdapter({ database })).toThrow('BETTER_AUTH_SECRET is required')
    expect(() =>
      createBetterAuthAdapter({ allowLocalDevelopmentSecret: true, database }),
    ).not.toThrow()
  })

  it('keeps Google optional and fails partial configuration closed', async () => {
    const auth = createBetterAuthAdapter({ database, secret: TEST_SECRET })
    const unavailable = await auth.signInSocial(
      { callbackUrl: 'http://localhost:3000/app', provider: 'google' },
      new Headers(),
    )
    expect(unavailable.status).toBe(501)

    expect(() =>
      createBetterAuthAdapter({ database, googleClientId: 'client-id', secret: TEST_SECRET }),
    ).toThrow('must be configured together')

    const google = createBetterAuthAdapter({
      database,
      googleClientId: 'client-id',
      googleClientSecret: 'client-secret',
      secret: TEST_SECRET,
    })
    const response = await google.signInSocial(
      { callbackUrl: 'http://localhost:3000/app', provider: 'google' },
      new Headers({ origin: 'http://localhost:3000' }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ redirect: true })
  })

  it('completes a sign-up, session, sign-in, and sign-out round trip', async () => {
    const createdUsers: string[] = []
    const auth = createBetterAuthAdapter({
      database,
      onUserCreated: async (user) => {
        createdUsers.push(user.email)
      },
      secret: TEST_SECRET,
    })
    const credentials = { email: 'founder@example.com', password: 'a-strong-password' }

    expect(await auth.getSession(new Headers())).toBeNull()
    await expect(auth.requireUser(new Headers())).rejects.toBeInstanceOf(UnauthorizedError)

    const signUpResponse = await auth.signUp({ ...credentials, name: 'Founder' }, new Headers())
    expect(signUpResponse.status).toBe(200)
    expect(createdUsers).toEqual([credentials.email])
    const signedUpHeaders = cookieHeadersFrom(signUpResponse)

    const session = await auth.getSession(signedUpHeaders)
    expect(session?.user.email).toBe(credentials.email)
    expect(session?.user.name).toBe('Founder')
    expect(session?.expiresAt).toBeInstanceOf(Date)
    expect(await auth.getUser(signedUpHeaders)).toMatchObject({ email: credentials.email })
    await expect(auth.requireUser(signedUpHeaders)).resolves.toMatchObject({
      email: credentials.email,
    })

    const rejectedSignIn = await auth.signIn(
      { email: credentials.email, password: 'not-the-password' },
      new Headers(),
    )
    expect(rejectedSignIn.status).toBe(401)

    const signInResponse = await auth.signIn(credentials, new Headers())
    expect(signInResponse.status).toBe(200)
    const signedInHeaders = cookieHeadersFrom(signInResponse)

    const handled = await auth.handleRequest(
      new Request('http://localhost:3000/api/auth/get-session', { headers: signedInHeaders }),
    )
    expect(handled.status).toBe(200)

    const signOutResponse = await auth.signOut(signedInHeaders)
    expect(signOutResponse.status).toBe(200)
    expect(await auth.getSession(signedInHeaders)).toBeNull()
    await expect(auth.requireUser(signedInHeaders)).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('verifies email, resets password once, and cascades user-owned data on deletion', async () => {
    const deliveries: EmailMessage[] = []
    const auth = createBetterAuthAdapter({
      database,
      email: createLocalEmailAdapter(({ message }) => deliveries.push(message)),
      requireEmailVerification: true,
      secret: TEST_SECRET,
    })
    const credentials = {
      email: 'lifecycle@example.com',
      name: 'Lifecycle User',
      password: 'initial-password',
    }

    const signUp = await auth.signUp(credentials, new Headers())
    expect(signUp.status).toBe(200)
    expect(deliveries.at(-1)?.template).toBe('verify_email')
    const verificationUrl = requiredUrl(deliveries.at(-1))
    const verification = await auth.handleRequest(new Request(verificationUrl))
    expect(verification.status).toBeGreaterThanOrEqual(300)
    expect(verification.status).toBeLessThan(400)
    expect(deliveries.at(-1)?.template).toBe('welcome')

    const signIn = await auth.signIn(credentials, new Headers())
    expect(signIn.status).toBe(200)
    const headers = cookieHeadersFrom(signIn)
    const user = await auth.requireUser(headers)

    const resetRequest = await auth.requestPasswordReset(
      { email: credentials.email, redirectTo: 'http://localhost:3000/reset-password' },
      new Headers(),
    )
    expect(resetRequest.status).toBe(200)
    expect(deliveries.at(-1)?.template).toBe('reset_password')
    const resetUrl = new URL(requiredUrl(deliveries.at(-1)))
    const expiredResetToken = resetUrl.pathname.split('/').at(-1)
    expect(expiredResetToken).toBeTruthy()
    await database
      .prepare('UPDATE verifications SET expires_at = ?')
      .bind(Date.now() - 1)
      .run()
    const expiredReset = await auth.resetPassword(
      { newPassword: 'expired-password', token: expiredResetToken ?? '' },
      new Headers(),
    )
    expect(expiredReset.status).toBeGreaterThanOrEqual(400)

    await auth.requestPasswordReset(
      { email: credentials.email, redirectTo: 'http://localhost:3000/reset-password' },
      new Headers(),
    )
    const freshResetUrl = new URL(requiredUrl(deliveries.at(-1)))
    const resetToken = freshResetUrl.pathname.split('/').at(-1)
    expect(resetToken).toBeTruthy()

    const reset = await auth.resetPassword(
      { newPassword: 'replacement-password', token: resetToken ?? '' },
      new Headers(),
    )
    expect(reset.status).toBe(200)
    const reused = await auth.resetPassword(
      { newPassword: 'another-password', token: resetToken ?? '' },
      new Headers(),
    )
    expect(reused.status).toBeGreaterThanOrEqual(400)

    const refreshedSignIn = await auth.signIn(
      { email: credentials.email, password: 'replacement-password' },
      new Headers(),
    )
    expect(refreshedSignIn.status).toBe(200)
    const freshHeaders = cookieHeadersFrom(refreshedSignIn)

    await database
      .prepare(
        'INSERT INTO operation_records (id, user_id, title, summary, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind('owned-record', user.id, 'Owned', '', 'draft', 'medium', Date.now(), Date.now())
      .run()

    const deleteResponse = await auth.deleteUser(
      { callbackUrl: 'http://localhost:3000/', password: 'replacement-password' },
      freshHeaders,
    )
    expect(deleteResponse.status).toBe(200)
    expect(deliveries.at(-1)?.template).toBe('delete_account')
    const deletion = await auth.handleRequest(
      new Request(requiredUrl(deliveries.at(-1)), { headers: freshHeaders }),
    )
    const deletionBody = await deletion.clone().text()
    expect(deletion.status, requiredUrl(deliveries.at(-1))).toBeGreaterThanOrEqual(300)
    expect(deletion.status, deletionBody).toBeLessThan(400)
    expect(
      await database
        .prepare('SELECT id FROM operation_records WHERE id = ?')
        .bind('owned-record')
        .first(),
    ).toBeNull()
  }, 15_000)
})

function requiredUrl(message: EmailMessage | undefined) {
  if (!message?.actionUrl) throw new Error('Expected an email action URL.')
  return message.actionUrl
}
