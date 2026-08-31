# Free Starter release gate

Run this checklist from a fresh checkout with Node 22. It deliberately keeps CI independent of
Google, Resend, and Stripe accounts.

## Deterministic gate

```bash
pnpm install --frozen-lockfile
pnpm audit:prod
pnpm --filter @micropreneur/db db:generate
pnpm turbo typecheck lint build test --force
git diff --check
```

Start `pnpm --filter web dev` and confirm the predev hook applies local D1 migrations. Exercise
dedicated credential sign-up, verification, sign-in, password recovery, personal workspace onboarding, profile editing, sign-out, and
confirmed account deletion. Create, search, filter, sort, edit, and delete registry records at
desktop and mobile widths in light and dark mode. Confirm a second user cannot address the first
user's record IDs.

When R2 signing is configured, upload, replace, and remove an avatar and workspace logo. Confirm
unsupported or oversized images fail, stored metadata is validated before the reference changes,
and a second account receives `404` for the first account's object key. Without signing credentials,
confirm settings show uploads as disabled while the rest of the local loop remains functional.

Build and serve the free registry, then install one item into a disposable Base UI project:

```bash
pnpm --filter @micropreneur/elements registry:build
pnpm --filter @micropreneur/elements registry:serve
pnpm dlx shadcn@latest add http://localhost:4173/r/status-badge.json
```

Start `pnpm --filter @micropreneur/mcp dev`; its protocol tests must list tools and return the
free component catalog from `list_components` and `search_components`.

## Provider-backed smoke tests

Follow `packages/auth/README.md`, `packages/email/README.md`, and `packages/billing/README.md` for
Google, Resend, and Stripe sandbox checks. Record these as manual release evidence; never put test
credentials, action tokens, webhook payloads, `.dev.vars`, or Wrangler state in git.

## Release boundary

Audit tracked files for secrets and generated artifacts. Do not deploy from this checklist.
Organizations, roles, team workflows, advanced billing, premium components, license gating, admin
tools, and AI features remain outside Free v1 as documented in `ROADMAP.md`.
