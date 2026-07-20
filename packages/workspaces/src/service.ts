import { type Database, users, workspaceMembers, workspaces } from '@micropreneur/db'
import { and, eq, sql } from 'drizzle-orm'

import { type WorkspaceOnboardingInput, workspaceOnboardingSchema } from './schema'

export interface WorkspaceUser {
  email: string
  id: string
  name: string
}

export interface ActiveWorkspace {
  avatarUrl: string | null
  id: string
  kind: 'personal'
  name: string
  onboardingComplete: boolean
  primaryGoal: WorkspaceOnboardingInput['primaryGoal'] | null
  productType: WorkspaceOnboardingInput['productType'] | null
  role: 'owner'
}

export type WorkspaceAccessReason = 'membership_inactive' | 'membership_missing'

export class WorkspaceAccessError extends Error {
  override readonly name = 'WorkspaceAccessError'

  constructor(readonly reason: WorkspaceAccessReason) {
    super(
      reason === 'membership_inactive'
        ? 'The personal workspace membership is inactive.'
        : 'An active personal workspace membership is required.',
    )
  }
}

export function personalWorkspaceId(userId: string): string {
  return `personal:${userId}`
}

export function personalWorkspaceName(user: WorkspaceUser): string {
  const ownerName = user.name.trim() || user.email.trim()
  return `${ownerName}'s workspace`
}

/** Provision the one workspace Free Starter permits. Safe to retry after auth callbacks. */
export async function bootstrapPersonalWorkspace(
  database: Database,
  user: WorkspaceUser,
): Promise<ActiveWorkspace> {
  const workspaceId = personalWorkspaceId(user.id)
  const now = new Date()

  await database.batch([
    database
      .insert(workspaces)
      .values({
        createdByUserId: user.id,
        id: workspaceId,
        kind: 'personal',
        name: personalWorkspaceName(user),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing(),
    database
      .insert(workspaceMembers)
      .values({
        createdAt: now,
        role: 'owner',
        status: 'active',
        updatedAt: now,
        userId: user.id,
        workspaceId,
      })
      .onConflictDoNothing(),
  ])

  return requireActiveWorkspace(database, user.id)
}

export async function completePersonalWorkspaceOnboarding(
  database: Database,
  authenticatedUserId: string,
  input: WorkspaceOnboardingInput,
): Promise<ActiveWorkspace> {
  const parsed = workspaceOnboardingSchema.parse(input)
  const workspace = await requireActiveWorkspace(database, authenticatedUserId)

  await database
    .update(workspaces)
    .set({
      name: parsed.name,
      onboardingCompletedAt: new Date(),
      primaryGoal: parsed.primaryGoal,
      productType: parsed.productType,
      updatedAt: new Date(),
    })
    .where(
      and(eq(workspaces.id, workspace.id), eq(workspaces.createdByUserId, authenticatedUserId)),
    )

  return requireActiveWorkspace(database, authenticatedUserId)
}

/** Complete onboarding immediately after a successful credential signup without leaking user IDs. */
export async function completePersonalWorkspaceOnboardingForEmail(
  database: Database,
  email: string,
  input: WorkspaceOnboardingInput,
): Promise<ActiveWorkspace> {
  const [user] = await database
    .select({ email: users.email, id: users.id, name: users.name })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email.trim()})`)
    .limit(1)

  if (!user) throw new Error('The newly created account could not be resolved for onboarding.')
  await bootstrapPersonalWorkspace(database, user)
  return completePersonalWorkspaceOnboarding(database, user.id, input)
}

/** Resolve the personal workspace from authenticated identity only. */
export async function requireActiveWorkspace(
  database: Database,
  authenticatedUserId: string,
): Promise<ActiveWorkspace> {
  const [membership] = await database
    .select({
      avatarUrl: workspaces.avatarUrl,
      id: workspaces.id,
      kind: workspaces.kind,
      name: workspaces.name,
      onboardingCompletedAt: workspaces.onboardingCompletedAt,
      primaryGoal: workspaces.primaryGoal,
      productType: workspaces.productType,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, authenticatedUserId))
    .limit(1)

  if (!membership) throw new WorkspaceAccessError('membership_missing')
  if (membership.status !== 'active') throw new WorkspaceAccessError('membership_inactive')

  return {
    avatarUrl: membership.avatarUrl,
    id: membership.id,
    kind: membership.kind,
    name: membership.name,
    onboardingComplete: membership.onboardingCompletedAt !== null,
    primaryGoal: membership.primaryGoal,
    productType: membership.productType,
    role: membership.role,
  }
}
