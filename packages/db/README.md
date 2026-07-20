# `@micropreneur/db`

This package owns the Cloudflare D1 schema and Drizzle client. It contains Better Auth persistence plus the deliberately small Operations Registry and one-plan billing tables. Domain behavior remains in its owning package; forks should keep adding new behavior behind similarly narrow seams.

## Generate migrations

```bash
pnpm --filter @micropreneur/db db:generate
```

Generated SQL is written to `packages/db/migrations/` and is committed.

## Apply locally

The `DB` binding in `apps/web/wrangler.jsonc` points at a local placeholder and declares this package's migration directory.

```bash
pnpm --filter @micropreneur/db db:migrate
```

`pnpm --filter web dev` runs this automatically and non-interactively through `predev` so a clean checkout has a short feedback loop.

## Apply remotely

Create a database, place its ID in `apps/web/wrangler.jsonc`, authenticate Wrangler, and run:

```bash
pnpm --filter @micropreneur/db db:migrate:remote
```

You can inspect a local database directly with:

```bash
pnpm --dir apps/web wrangler d1 execute DB --local --command "SELECT * FROM users"
```

Remote commands are never part of CI and are not run by this repository's bootstrap.
