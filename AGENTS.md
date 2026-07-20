# AGENTS.md

## What this repository is

`micropreneur/starter` is a public MIT-licensed, fork-and-go base for paid SaaS projects. It is the open foundation layer only. Free Starter v1 demonstrates a paid, single-user product and provisions one personal workspace for onboarding; Operations Registry ownership remains user-scoped until its explicit workspace-migration slice. Free Starter includes one-plan end-user Stripe billing and an independent entitlement example. Do not add `starter-pro`, `elements-pro`, team management, workspace billing, premium components, license gates, ACP logic, or a project generator here.

## Locked stack

- pnpm workspaces and Turborepo; Node 22+, Bun-friendly scripts.
- Strict TypeScript with `noUncheckedIndexedAccess`.
- TanStack Start on Cloudflare Workers.
- Cloudflare D1 with Drizzle; Durable Objects for stateful coordination.
- Hexagonal auth through `AuthPort`; Better Auth is the default adapter, and Descope exists only as a typed, unimplemented seam (compiling 501 stub).
- Tailwind CSS 4 and shadcn/ui using Base UI primitives, never Radix UI.
- Components are public source delivered by the `elements` shadcn registry.

## How to work here

Read the nearest `AGENTS.md` before editing. Keep changes at the owning seam, avoid product-specific domain code, and never let application code import an auth provider SDK. Preserve public API and registry metadata together.

## Free and Pro workspace boundary

- Free Starter may model records through a workspace boundary with one automatically created personal workspace, one owner membership, an active-workspace context, server-enforced membership checks, and cross-workspace isolation tests.
- Free Starter must not expose multiple-workspace creation, invitations, team membership management, RBAC, ownership transfer, seat billing, or customer custom domains.
- Starter Pro owns those multi-tenant product capabilities. Its billing and entitlements must become workspace-scoped before multiple workspaces are enabled.
- Customer vanity domains belong after tenant isolation and use Cloudflare for SaaS Custom Hostnames. Start with manual DNS verification; Domain Connect is a later onboarding enhancement.

World-class local DX is a core product value. Every change should create a short, deterministic feedback loop for both humans and coding agents:

1. Start with the smallest owning package and its focused test or validation command.
2. Keep dev startup secret-light and local-first; document any required service state.
3. Prefer typed boundaries, fixtures, and executable checks over prose-only assurances.
4. Run the root gate before handoff so package-local success does not hide integration failures.
5. Improve error messages and README commands when a failure would otherwise require tribal knowledge.

## Feedback loops

```bash
pnpm install
pnpm --filter web dev
pnpm --filter @micropreneur/db db:generate
pnpm --filter @micropreneur/elements registry:build
pnpm --filter @micropreneur/mcp test
pnpm turbo typecheck lint build test
```

For Worker bindings, run `pnpm --filter web cf-typegen`. Do not deploy from agent workflows unless the user explicitly requests it.

## Map

- `apps/web`: composition root, routes, Worker entrypoint, and binding access.
- `apps/docs`: canonical MDX guides plus generated raw Markdown, `llms` files, and agent manifests.
- `packages/auth`: port and provider adapters.
- `packages/email`: email port with Resend and deterministic local capture adapters.
- `packages/billing`: one-plan billing port, Stripe adapter, webhook state, and entitlements.
- `packages/operations`: removable user-owned Operations Registry example domain.
- `packages/workspaces`: one personal workspace, owner membership, and onboarding metadata.
- `packages/db`: D1 client and schema.
- `packages/ui`: internal Base UI shadcn primitives.
- `packages/elements`: public free registry items and metadata.
- `packages/mcp`: stdio discovery for docs, skills, components, and themes.
- `packages/config`: shared toolchain configuration.

## Never commit

Secrets, `.env`, `.dev.vars`, `.wrangler` state, production identifiers, generated coverage, or premium/private source.
