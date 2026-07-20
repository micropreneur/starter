# Running locally

> Start the web app, docs, D1 database, registry, and focused feedback loops without production secrets.

Starter is designed to be useful before any hosted integration is configured. The default loop
uses local D1, prints email action links to the terminal, and disables paid actions explicitly.

## Requirements

- Node.js 22 or newer
- Corepack and pnpm
- A browser supported by Vite
- Wrangler authentication only when you work with remote Cloudflare resources

Check the active versions:

```bash
node --version
corepack enable
pnpm --version
```

## Start the workspace

Copy the local Worker variables once, then start every development task through Turborepo:

```bash
cp apps/web/.dev.vars.example apps/web/.dev.vars
pnpm install
pnpm dev
```

The web app runs on `http://localhost:3000`. The docs app prefers `http://localhost:3001` and Vite
selects the next available port if that port is already occupied.

To run only one app:

```bash
pnpm --filter web dev
pnpm --filter docs dev
```

## Local service behavior

| Service | Local default |
| --- | --- |
| D1 | Wrangler-managed local database |
| Email | Action URL printed as `[email:local]` |
| Google OAuth | Hidden until both client values exist |
| Stripe | Disabled until all three sandbox values exist |
| Durable Objects | Realtime seam disabled with `REALTIME_ENABLED=false` |

Partial provider configuration fails during startup. This is deliberate: an explicit error is
safer than a provider path that appears available but cannot complete.

## Feedback loops

Run the smallest owning check while iterating:

```bash
pnpm --filter docs typecheck
pnpm --filter @micropreneur/auth test
pnpm --filter @micropreneur/elements registry:build
pnpm --filter @micropreneur/mcp test
```

Before handing off a complete slice, run the repository gate:

```bash
pnpm turbo typecheck lint build test
```

## Reset local D1

Migrations are applied automatically by the web app's `predev` hook. If local state is disposable
and you need a completely fresh database, stop the dev server, remove only the app's local
Wrangler state, and restart:

```bash
rm -rf apps/web/.wrangler/state
pnpm --filter web dev
```

<Callout type="warning" title="Local data is deleted">
  This removes the local D1 database and every development account. It does not touch a remote D1
  database.
</Callout>
