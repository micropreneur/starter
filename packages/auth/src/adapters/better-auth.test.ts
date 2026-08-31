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
  }, 15_000)

  it('verifies email, resets password once, and cascades user-owned data on deletion', async () => {
    const deliveries: EmailMessage[] = []
    const deletedUserIds: string[] = []
    const ownedFiles = new Set<string>()
    const auth = createBetterAuthAdapter({
      beforeUserDelete: async (user) => {
        deletedUserIds.push(user.id)
        ownedFiles.delete(`avatar:${user.id}`)
        ownedFiles.delete(`logo:personal:${user.id}`)
      },
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

    const verificationCallback =
      'http://localhost:3000/sign-in?callbackUrl=%2Finvitations%2Fwinv_example'
    const signUp = await auth.signUp(
      { ...credentials, callbackUrl: verificationCallback },
      new Headers(),
    )
    expect(signUp.status).toBe(200)
    expect(deliveries.filter((delivery) => delivery.template === 'verify_email')).toHaveLength(1)
    expect(deliveries.at(-1)?.template).toBe('verify_email')

    const unverifiedSignIn = await auth.signIn(credentials, new Headers())
    expect(unverifiedSignIn.status).toBe(403)
    expect(deliveries.filter((delivery) => delivery.template === 'verify_email')).toHaveLength(1)

    const verificationUrl = requiredUrl(deliveries.at(-1))
    const verification = await auth.handleRequest(new Request(verificationUrl))
    expect(verification.status).toBeGreaterThanOrEqual(300)
    expect(verification.status).toBeLessThan(400)
    expect(verification.headers.get('location')).toBe(verificationCallback)
    expect(deliveries.at(-1)?.template).toBe('welcome')

    const signIn = await auth.signIn(credentials, new Headers())
    expect(signIn.status).toBe(200)
    const headers = cookieHeadersFrom(signIn)
    const user = await auth.requireUser(headers)
    await expect(auth.listAccounts(headers)).resolves.toEqual([
      expect.objectContaining({ provider: 'credential' }),
    ])

    const profileUpdate = await auth.updateUser({ name: 'Updated Lifecycle User' }, headers)
    expect(profileUpdate.status).toBe(200)
    await expect(auth.requireUser(headers)).resolves.toMatchObject({
      name: 'Updated Lifecycle User',
    })

    const changedEmail = 'updated-lifecycle@example.com'
    const emailChange = await auth.changeEmail(
      {
        callbackUrl: 'http://localhost:3000/app/settings/profile',
        newEmail: changedEmail,
      },
      headers,
    )
    expect(emailChange.status).toBe(200)
    const emailChangeMessage = deliveries.at(-1)
    expect(emailChangeMessage).toMatchObject({ template: 'verify_email', to: changedEmail })
    const emailConfirmation = await auth.handleRequest(
      new Request(requiredUrl(emailChangeMessage), { headers }),
    )
    expect(emailConfirmation.status).toBeGreaterThanOrEqual(300)
    expect(emailConfirmation.status).toBeLessThan(400)
    expect(emailConfirmation.headers.get('location')).toBe(
      'http://localhost:3000/app/settings/profile',
    )
    await expect(auth.requireUser(headers)).resolves.toMatchObject({ email: changedEmail })
    ownedFiles.add(`avatar:${user.id}`)
    ownedFiles.add(`logo:personal:${user.id}`)

    const resetRequest = await auth.requestPasswordReset(
      { email: changedEmail, redirectTo: 'http://localhost:3000/reset-password' },
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
      { email: changedEmail, redirectTo: 'http://localhost:3000/reset-password' },
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
      { email: changedEmail, password: 'replacement-password' },
      new Headers(),
    )
    expect(refreshedSignIn.status).toBe(200)
    const freshHeaders = cookieHeadersFrom(refreshedSignIn)

    const changedPassword = await auth.changePassword(
      { currentPassword: 'replacement-password', newPassword: 'final-password' },
      freshHeaders,
    )
    expect(changedPassword.status).toBe(200)
    expect(
      (await auth.signIn({ email: changedEmail, password: 'replacement-password' }, new Headers()))
        .status,
    ).toBe(401)
    const finalSignIn = await auth.signIn(
      { email: changedEmail, password: 'final-password' },
      new Headers(),
    )
    expect(finalSignIn.status).toBe(200)
    const finalHeaders = cookieHeadersFrom(finalSignIn)

    await database
      .prepare(
        'INSERT INTO workspaces (id, name, kind, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(
        `personal:${user.id}`,
        "Lifecycle User's workspace",
        'personal',
        user.id,
        Date.now(),
        Date.now(),
      )
      .run()
    await database
      .prepare(
        'INSERT INTO workspace_members (workspace_id, user_id, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(`personal:${user.id}`, user.id, 'owner', 'active', Date.now(), Date.now())
      .run()
    await database
      .prepare(
        'INSERT INTO operation_records (id, workspace_id, title, summary, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        'owned-record',
        `personal:${user.id}`,
        'Owned',
        '',
        'draft',
        'medium',
        Date.now(),
        Date.now(),
      )
      .run()

    const deleteResponse = await auth.deleteUser(
      { callbackUrl: 'http://localhost:3000/', password: 'final-password' },
      finalHeaders,
    )
    expect(deleteResponse.status).toBe(200)
    expect(deliveries.at(-1)?.template).toBe('delete_account')
    expect(deletedUserIds).toEqual([])
    expect(ownedFiles).toEqual(new Set([`avatar:${user.id}`, `logo:personal:${user.id}`]))
    expect(
      await database
        .prepare('SELECT id FROM operation_records WHERE id = ?')
        .bind('owned-record')
        .first(),
    ).not.toBeNull()
    const deletion = await auth.handleRequest(
      new Request(requiredUrl(deliveries.at(-1)), { headers: finalHeaders }),
    )
    const deletionBody = await deletion.clone().text()
    expect(deletion.status, requiredUrl(deliveries.at(-1))).toBeGreaterThanOrEqual(300)
    expect(deletion.status, deletionBody).toBeLessThan(400)
    expect(deletedUserIds).toEqual([user.id])
    expect(ownedFiles.size).toBe(0)
    expect(
      await database
        .prepare('SELECT id FROM operation_records WHERE id = ?')
        .bind('owned-record')
        .first(),
    ).toBeNull()
  }, 15_000)

  it('keeps the user when confirmed-deletion cleanup fails', async () => {
    const deliveries: EmailMessage[] = []
    const ownedFiles = new Set(['avatar', 'logo'])
    const auth = createBetterAuthAdapter({
      beforeUserDelete: async () => {
        throw new Error('R2 cleanup failed')
      },
      database,
      email: createLocalEmailAdapter(({ message }) => deliveries.push(message)),
      secret: TEST_SECRET,
    })
    const credentials = {
      email: 'failed-deletion@example.com',
      name: 'Failed Deletion',
      password: 'initial-password',
    }
    const signUp = await auth.signUp(credentials, new Headers())
    const headers = cookieHeadersFrom(signUp)
    const user = await auth.requireUser(headers)

    const requested = await auth.deleteUser(
      { callbackUrl: 'http://localhost:3000/', password: credentials.password },
      headers,
    )
    expect(requested.status).toBe(200)
    expect(ownedFiles).toEqual(new Set(['avatar', 'logo']))

    const confirmed = await auth.handleRequest(
      new Request(requiredUrl(deliveries.at(-1)), { headers }),
    )
    expect(confirmed.status).toBeGreaterThanOrEqual(500)
    expect(ownedFiles).toEqual(new Set(['avatar', 'logo']))
    expect(
      await database.prepare('SELECT id FROM users WHERE id = ?').bind(user.id).first(),
    ).not.toBeNull()
  }, 15_000)
})

function requiredUrl(message: EmailMessage | undefined) {
  if (!message?.actionUrl) throw new Error('Expected an email action URL.')
  return message.actionUrl
}
