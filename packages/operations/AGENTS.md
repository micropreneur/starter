# Operations package guidance

- This is the removable example domain for Free Starter. Records belong to the one personal workspace resolved from authenticated identity.
- Every read and write takes a server-resolved `workspaceId`; never trust a workspace or owner from client input.
- Every application server boundary must resolve active membership from the authenticated user before calling this package. Free Starter still exposes only one personal workspace.
- Keep statuses fixed. Multiple workspaces, invitations, assignments, custom roles, comments, and approvals belong in Starter Pro.
- Keep validation client-safe in `schema.ts` and persistence server-only in `service.ts`.
