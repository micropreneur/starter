# Elements Theme Lab

The Theme Lab previews and customizes free shadcn-compatible themes without changing the documentation chrome. Selection, light/dark mode, and custom edits remain in local browser storage. Nothing is uploaded.

These commands install source directly from the public Elements Free registry.

## starter

**Starter** is Micropreneur's warm editorial default. License: MIT.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/theme-starter.json
```

## modern-minimal

**Modern Minimal** is a normalized TweakCN palette with crisp blue actions. License: Apache-2.0.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/theme-modern-minimal.json
```

## amber-minimal

**Amber Minimal** is a normalized TweakCN palette with warm actions and compact geometry. License: Apache-2.0.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/theme-amber-minimal.json
```

## clean-slate

**Clean Slate** is a normalized TweakCN palette for dense indigo and slate applications. License: Apache-2.0.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/theme-clean-slate.json
```

## caffeine

**Caffeine** is a normalized TweakCN palette with coffee neutrals and cream highlights. License: Apache-2.0.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/theme-caffeine.json
```

## ocean-breeze

**Ocean Breeze** is a normalized TweakCN palette with airy blue surfaces and green actions. License: Apache-2.0.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/theme-ocean-breeze.json
```

## Custom output

The Theme Lab supports brand, canvas, surface, radius, depth, and typography changes. It automatically chooses a readable brand foreground, keeps light and dark edits independent, and provides undo, redo, reset, CSS copy, and JSON download.

Downloaded JSON is a `registry:theme` item compatible with the shadcn Registry CLI. Values are constrained to validated colors and known recipes; arbitrary CSS, HTML, and scripts are not accepted.

The five imported palettes are attributed in `packages/elements/THIRD_PARTY_NOTICES.md`, with the license text at `packages/elements/licenses/TWEAKCN-APACHE-2.0.txt`.
