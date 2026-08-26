import type { SignInInput, SignUpInput } from '@micropreneur/auth'
import { type WorkspaceOnboardingInput, workspaceOnboardingSchema } from '@micropreneur/workspaces'
import { z } from 'zod'

import { safeAuthCallbackPath } from './auth-redirect'

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function parseSignInInput(value: unknown): SignInInput | null {
  if (typeof value !== 'object' || value === null) return null
  const { email, password } = value as Record<string, unknown>
  if (!nonEmptyString(email) || !nonEmptyString(password)) return null
  return { email, password }
}

export interface SignUpRequest {
  account: SignUpInput
  callbackUrl?: string
  onboarding: WorkspaceOnboardingInput
  turnstileToken?: string
}

const signUpRequestSchema = z.object({
  callbackUrl: z
    .string()
    .max(2048)
    .refine((value) => safeAuthCallbackPath(value) === value)
    .optional(),
  email: z.email(),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
  turnstileToken: z.string().max(2048).optional(),
  workspace: workspaceOnboardingSchema,
})

export function parseSignUpRequest(value: unknown): SignUpRequest | null {
  const parsed = signUpRequestSchema.safeParse(value)
  if (!parsed.success) return null
  const { callbackUrl, turnstileToken, workspace, ...account } = parsed.data
  return {
    account,
    onboarding: workspace,
    ...(callbackUrl ? { callbackUrl } : {}),
    ...(turnstileToken ? { turnstileToken } : {}),
  }
}

export function invalidInputResponse(expected: string): Response {
  return Response.json({ error: `Expected a JSON body with ${expected}.` }, { status: 400 })
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
