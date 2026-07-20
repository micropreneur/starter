# `elements` free registry

`packages/elements` is the public, free shadcn registry in `starter`. The workspace exports in `src/` exist so `apps/web` can exercise the same components during monorepo development; downstream projects should install source through the registry rather than add this package as an npm dependency.

The source catalog is composed from:

```text
registry.json
├── registry/free/registry.json
│   ├── badge/
│   ├── auth-card/
│   ├── button/
│   ├── card/
│   ├── dashboard-shell/
│   ├── data-grid/
│   ├── empty-state/
│   ├── filterable-data-table/
│   ├── index-label/
│   ├── ledger-list/
│   ├── margin-note/
│   ├── milestone-marker/
│   ├── settings-layout/
│   ├── status-badge/
│   └── table/
└── registry/free/themes/registry.json
```

That manifest is deliberately separate from serving. `shadcn build` flattens it into static item JSON under `dist/r`; any HTTP host can serve those files.

## Build and serve

```bash
pnpm --filter @micropreneur/elements registry:build
pnpm --filter @micropreneur/elements registry:serve
```

With the server running:

```bash
pnpm dlx shadcn@latest list http://localhost:4173/r/registry.json
pnpm dlx shadcn@latest add http://localhost:4173/r/status-badge.json
pnpm dlx shadcn@latest add http://localhost:4173/r/theme-starter.json
```

## Themes

The free registry ships six complete `registry:theme` items. Each includes light and dark semantic colors, charts, sidebar colors, radius, constrained depth tokens, and a local system typography recipe. The visual Theme Lab in `apps/docs` applies variables only to preview canvases, so choosing or editing a theme cannot restyle the documentation chrome.

Curated presets are installable from the local registry. Custom Theme Lab output is copied as CSS or downloaded as a shadcn-compatible JSON item; it is never uploaded or executed remotely.

When adding a preset:

1. Add complete runtime metadata and tokens to `src/themes.ts`.
2. Add the matching `registry:theme` entry to `registry/free/themes/registry.json`.
3. Update `apps/docs/public/themes.md` and any third-party attribution.
4. Run `pnpm --filter @micropreneur/elements registry:validate registry:build`.
5. Install the exact built theme URL into a throwaway shadcn project and inspect the shared CSS update.

Five normalized palettes are derived from the Apache-2.0-licensed TweakCN project. See `THIRD_PARTY_NOTICES.md` and `licenses/TWEAKCN-APACHE-2.0.txt`. No TweakCN code or remote script runs in Starter.

## Add a free component

1. Add source under `registry/free/<name>/` using target-project imports such as `@/components/ui/button`.
2. Add its item to `registry/free/registry.json`, including dependencies, target path, ontology category, docs path, tier, and primitive metadata.
3. Add matching runtime metadata in `src/catalog.ts`, a docs page in `apps/docs/public/components/`, and a visual preview in `apps/docs/src/previews.tsx`. Themes use the separate workflow above and do not enter the component ontology.
4. Run `pnpm --filter @micropreneur/elements typecheck registry:validate registry:build test`.
5. Install the built item into a throwaway shadcn Base UI project and inspect every written file.

## Premium seam (documented, not built)

`elements-pro` will be a separate private source repository and a separate registry namespace. It will not be included by this public manifest.

The intended flow is:

1. Stripe records a purchase and issues a license key.
2. A user's `components.json` configures `@elements-pro` with `X-License-Key: ${ELEMENTS_PRO_LICENSE_KEY}`.
3. A Cloudflare Worker validates that key and its component entitlement.
4. The Worker serves the requested premium shadcn item JSON from the private manifest.
5. The CLI writes source into the consuming project exactly as it does for this free registry.

This matches shadcn's authenticated namespaced registry model. The license Worker, Stripe flow, private manifest, premium source, revocation, and rate limiting are explicitly out of scope here. See `PREMIUM-REGISTRY-SEAM.md` for the future endpoint contract.
