import { z } from 'zod'

export const workspaceProductTypes = [
  'saas',
  'marketplace',
  'client_service',
  'internal_tool',
  'other',
] as const

export const workspacePrimaryGoals = ['validate', 'launch', 'grow', 'migrate'] as const

export const workspaceOnboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
})

export type WorkspaceOnboardingInput = z.infer<typeof workspaceOnboardingSchema>
export type WorkspacePrimaryGoal = (typeof workspacePrimaryGoals)[number]
export type WorkspaceProductType = (typeof workspaceProductTypes)[number]
