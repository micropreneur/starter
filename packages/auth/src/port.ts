export type AuthProvider = 'betterauth' | 'descope'

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string | null
}

export interface AuthSession {
  user: AuthUser
  expiresAt: Date
}

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput extends SignInInput {
  name: string
}

export type SocialProvider = 'google'

export interface SocialSignInInput {
  callbackUrl: string
  provider: SocialProvider
}

export interface PasswordResetRequestInput {
  email: string
  redirectTo: string
}

export interface ResetPasswordInput {
  newPassword: string
  token: string
}

export interface UpdateUserInput {
  image?: string | null
  name?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface DeleteUserInput {
  callbackUrl: string
  password?: string
}

export interface AuthAccount {
  provider: 'credential' | SocialProvider | (string & {})
}

/**
 * Provider-neutral, web-standard auth boundary.
 *
 * Application routes may depend on this interface; provider SDKs stay inside
 * adapter modules. Responses deliberately preserve provider Set-Cookie headers.
 */
export interface AuthPort {
  readonly provider: AuthProvider
  getSession(headers: Headers): Promise<AuthSession | null>
  getUser(headers: Headers): Promise<AuthUser | null>
  requireUser(headers: Headers): Promise<AuthUser>
  signIn(input: SignInInput, headers: Headers): Promise<Response>
  signInSocial(input: SocialSignInInput, headers: Headers): Promise<Response>
  signUp(input: SignUpInput, headers: Headers): Promise<Response>
  signOut(headers: Headers): Promise<Response>
  sendVerificationEmail(email: string, callbackUrl: string, headers: Headers): Promise<Response>
  requestPasswordReset(input: PasswordResetRequestInput, headers: Headers): Promise<Response>
  resetPassword(input: ResetPasswordInput, headers: Headers): Promise<Response>
  updateUser(input: UpdateUserInput, headers: Headers): Promise<Response>
  changePassword(input: ChangePasswordInput, headers: Headers): Promise<Response>
  listAccounts(headers: Headers): Promise<AuthAccount[]>
  deleteUser(input: DeleteUserInput, headers: Headers): Promise<Response>
  handleRequest(request: Request): Promise<Response>
}

export class UnauthorizedError extends Error {
  override readonly name = 'UnauthorizedError'

  constructor() {
    super('Authentication required')
  }
}
