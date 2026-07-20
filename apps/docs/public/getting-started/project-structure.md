# Project structure

> Find the application composition root, provider adapters, removable domain example, and source-delivered UI.

Starter is a Turborepo monorepo internally and one assembled SaaS externally. A customer should be
able to run the product immediately without assembling a framework from loose packages.

## Applications

```text
apps/
├── web/   # TanStack Start composition root and Cloudflare Worker
└── docs/  # This content-driven documentation and Elements gallery
```

`apps/web` owns route composition, environment bindings, and adapter selection. It should not own
provider SDK behavior or reusable domain rules.

## Packages

```text
packages/
├── auth/        # AuthPort and provider adapters
├── billing/     # BillingService, Stripe adapter, and entitlements
├── db/          # D1 schema, Drizzle client, and migrations
├── email/       # EmailPort, Resend, and local capture
├── elements/    # Public shadcn registry
├── mcp/         # Agent-facing component discovery
├── operations/  # Removable example domain
├── ui/          # Internal Base UI primitives
└── workspaces/  # Personal workspace and onboarding metadata
```

## Where new code belongs

Put product behavior in a focused domain package. Put provider-specific translation in an adapter.
Keep Worker bindings at the application composition root.

For example, a reporting product might replace `packages/operations` with `packages/reports` while
continuing to use the existing auth, email, billing, database, and UI boundaries.

<Callout title="A package is a boundary, not a goal">
  Add a package when it creates clear ownership or enables focused tests. Do not split a small
  feature merely to make the directory tree look architectural.
</Callout>
