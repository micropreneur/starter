# Install Elements Free

> Browse the public registry and install source-owned components and themes with the shadcn CLI.

Elements Free is a public shadcn registry, not a bundled component dependency. Downstream projects
install source files and own every line written by the CLI.

## Browse the registry

The hosted registry is ready to use without cloning Starter:

```bash
pnpm dlx shadcn@latest list https://elements.micropreneur.dev/r/registry.json
```

## Run it locally

Docs development builds Elements and stages the registry into the same Worker asset directory:

```bash
pnpm --filter docs dev
pnpm dlx shadcn@latest list http://localhost:3001/r/registry.json
```

For package-only work, `pnpm --filter @micropreneur/elements registry:serve` still serves the
registry at `http://localhost:4173/r`.

## Preview an item

Documentation can render the real workspace component and read its title, ontology, kind, and
description from the public registry catalog. The command beneath the preview automatically targets
the same-origin staged registry locally and the public Elements domain in production.

<ElementShowcase name="status-badge" />

## Install an item

Run the shadcn CLI from the target project:

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/status-badge.json
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/theme-starter.json
```

The target should be configured for shadcn's Base UI primitives. Registry items use target-project
imports such as `@/components/ui/button` rather than importing this workspace package.

Browse and test each item in the [component gallery](/elements/gallery).

## Own the result

The CLI writes source into the consuming project. Review the diff, adapt the vocabulary to the
product, and keep accessibility behavior intact.

Do not add `@micropreneur/elements` as an npm dependency in a downstream fork. Its workspace export
exists so the Starter monorepo can exercise the same components before registry installation.
