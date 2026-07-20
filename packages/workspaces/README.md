# `@micropreneur/workspaces`

This package owns Free Starter's single-member workspace and onboarding seam. Each account receives
one personal workspace and one active owner membership. The signup flow can set its name, product
type, and first activation goal; OAuth users complete the same questions on `/onboarding`.

`bootstrapPersonalWorkspace` is idempotent and uses a deterministic workspace ID.
`requireActiveWorkspace` resolves ownership from the authenticated user ID and fails closed for
missing or inactive memberships. No client route or form chooses a workspace ID.

Free Starter deliberately omits workspace creation, switching, organizations, invitations, team
management, custom roles, ownership transfer, workspace billing, and custom domains. Starter Pro
can add those capabilities without changing the onboarding vocabulary or the server-side ownership
rule.
