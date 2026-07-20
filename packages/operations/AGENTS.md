# Operations package guidance

- This is the removable example domain for Free Starter. The released v1 remains user-owned until the workspace-substrate roadmap slice begins.
- In v1, every read and write must take the authenticated `userId`; never trust an owner from client input.
- The public workspace-substrate slice may migrate ownership to `workspaceId` only after the Free v1 release checkpoint. It must still resolve membership from the authenticated user inside every server boundary and expose only one personal workspace.
- Keep statuses fixed. Multiple workspaces, invitations, assignments, custom roles, comments, and approvals belong in Starter Pro.
- Keep validation client-safe in `schema.ts` and persistence server-only in `service.ts`.
