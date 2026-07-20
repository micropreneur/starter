import type { AuthPort } from '../port'
import { UnauthorizedError } from '../port'

const notImplemented = () =>
  Response.json(
    {
      error: 'The Descope adapter is a typed starter seam and is not implemented yet.',
      todo: 'Install the Descope SDK and map its session/user payloads to AuthPort.',
    },
    { status: 501 },
  )

/**
 * Typed Descope seam.
 *
 * TODO(starter-pro/fork): initialize the Descope SDK from injected credentials,
 * validate its cookie or bearer session, and map only provider-neutral fields.
 */
export function createDescopeAdapter(): AuthPort {
  return {
    provider: 'descope',
    async getSession() {
      return null
    },
    async getUser() {
      return null
    },
    async requireUser() {
      throw new UnauthorizedError()
    },
    async signIn() {
      return notImplemented()
    },
    async signInSocial() {
      return notImplemented()
    },
    async signUp() {
      return notImplemented()
    },
    async signOut() {
      return notImplemented()
    },
    async sendVerificationEmail() {
      return notImplemented()
    },
    async requestPasswordReset() {
      return notImplemented()
    },
    async resetPassword() {
      return notImplemented()
    },
    async updateUser() {
      return notImplemented()
    },
    async changePassword() {
      return notImplemented()
    },
    async listAccounts() {
      return []
    },
    async deleteUser() {
      return notImplemented()
    },
    async handleRequest() {
      return notImplemented()
    },
  }
}
