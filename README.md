# Micropreneur Starter

The fork-and-go, AI-native SaaS base for micropreneurs.

`micropreneur/starter` is the public, MIT-licensed foundation we use to begin paid, single-user SaaS products without re-customizing someone else's boilerplate. It combines TanStack Start on Cloudflare Workers, D1 and Drizzle, hexagonal auth and email, one-plan Stripe billing, a Base UI shadcn registry, and agent-readable project guidance.

## Quickstart

```bash
git clone https://github.com/micropreneur/starter.git
cd starter
corepack enable
pnpm install
cp apps/web/.dev.vars.example apps/web/.dev.vars
pnpm dev
```

The web app runs at `http://localhost:3000`. Its `predev` hook generates and applies local D1 migrations before Vite starts. No Google, Resend, or Stripe credential is required for the default local loop: credential auth uses local D1, email action links print to the terminal, and paid features show an explicit disabled state.

Create an account at `/sign-up`, answer the three personal workspace questions, open the verification URL printed as `[email:local]` in the Vite terminal, then sign in and visit `/app/registry`. Google users complete the same questions at `/onboarding` after authentication.

## Monorepo

| Path | Purpose |
| --- | --- |
| `apps/web` | TanStack Start application on Cloudflare Workers |
| `apps/docs` | Agent-readable documentation site |
| `packages/ui` | Base UI shadcn primitives used inside this workspace |
| `packages/elements` | Free `elements` source and shadcn registry |
| `packages/auth` | Provider-neutral auth port with a Better Auth adapter and a typed Descope stub |
| `packages/email` | Email port with Resend and local capture adapters |
| `packages/billing` | One-plan Stripe service, webhook state, and entitlements |
| `packages/operations` | Removable personal-workspace Operations Registry example |
| `packages/workspaces` | Single-member personal workspace and onboarding seam |
| `packages/db` | D1 client, Drizzle schema, and migrations |
| `packages/mcp` | Docs, skill, component, and theme discovery MCP server |
| `packages/config` | Shared TypeScript, Biome, and Tailwind configuration |

## Commands

```bash
pnpm dev
pnpm turbo typecheck lint build test
pnpm turbo typecheck lint build test --force
pnpm db:generate
pnpm db:migrate
pnpm registry:build
pnpm docs:generate
pnpm --filter @micropreneur/mcp dev
```

See the package READMEs for auth, database, registry, and MCP details. Before publishing a fork,
run the deterministic and provider-backed checks in [RELEASE.md](./RELEASE.md).

## Fork this to start a project

1. Use GitHub's **Use this template** or fork the repository.
2. Rename the Worker in `apps/web/wrangler.jsonc` and update package metadata.
3. Create a D1 database, replace the placeholder database ID, and apply migrations.
4. Copy `apps/web/.dev.vars.example` to `apps/web/.dev.vars`; set a real Better Auth secret for any deployed environment (`wrangler secret put BETTER_AUTH_SECRET`).
5. Optionally register Google's callback at `http://localhost:3000/api/auth/callback/google`, or leave both OAuth values empty and keep credential auth.
6. Customize the activation questions in `packages/workspaces`; keep organization creation, invitations, and team roles out of Free Starter.
7. Optionally configure Resend. Local capture remains the fastest verification/recovery loop.
8. To prove paid access, create one recurring Stripe test price, configure all three Stripe values, and forward test events to `/api/billing/webhook`.
9. Rename or remove `packages/operations`, then add your domain code in its own package instead of coupling it to adapters.
10. Keep application imports pointed at ports and registry-facing components (`@micropreneur/elements`).

The exact Free/Pro contract is in [ROADMAP.md](./ROADMAP.md). `starter-pro`, `elements-pro`, multi-tenant/team systems, advanced billing, premium registry gating, and project-generation CLIs are intentionally outside this repository.

## License

MIT © [Dan Schoonmaker](https://www.danschoonmaker.com) / [SchoonLabs](https://www.schoonlabs.com) / [micropreneur.dev](https://www.micropreneur.dev).
