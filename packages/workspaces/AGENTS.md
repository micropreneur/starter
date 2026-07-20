# Workspace package guidance

- Free Starter exposes exactly one automatically created personal workspace and one owner membership per user.
- Resolve a workspace from authenticated identity inside server-side services. Never accept an owner or workspace ID from client input.
- Onboarding may name and describe the personal workspace. Multiple workspaces, organizations, invitations, teams, RBAC, ownership transfer, workspace billing, and custom domains remain Starter Pro concerns.
- Bootstrap is explicit and idempotent. Missing or inactive memberships fail closed during authorization.
