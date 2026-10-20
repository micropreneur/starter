# Elements Theme Lab

The Theme Lab previews and customizes free shadcn-compatible themes without changing the documentation chrome. Selection, light/dark mode, and custom edits remain in local browser storage. Nothing is uploaded.

These commands install source directly from the public Elements Free registry.

## starter

**Starter** is Micropreneur's warm editorial default and the exact theme the Starter app ships: Geist interface type, Instrument Serif display, Geist Mono figures, a 6px radius, and flat workbench depth. License: MIT.

Its type recipe uses three font packages. The CLI installs them; import them once in your global CSS:

```css
@import "@fontsource-variable/geist";
@import "@fontsource-variable/geist-mono";
@import "@fontsource/instrument-serif";
```

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

## Roles

Every theme uses shadcn's semantic roles with their standard meanings. In particular, `accent` is the subtle interaction tint for focused menu items and hovered rows, never a second brand color.

Elements adds one small Micropreneur extension:

| Variable | Use | Default when your theme omits it |
| --- | --- | --- |
| `--mp-brand-highlight` | Decorative brand marks: the MarginNote rule, a signal dot, an underline. Never actions, focus, or status. | `--primary` |
| `--mp-brand-highlight-foreground` | Text on a brand highlight fill. | `--primary-foreground` |

The brand highlight is held to 3:1 against the canvas as a non-text mark. Do not use it for small text.

## Custom output

The Theme Lab supports brand, brand highlight, canvas, surface, radius, depth, and typography changes. It automatically chooses a readable brand foreground, keeps light and dark edits independent, and provides undo, redo, reset, CSS copy, and JSON download.

Downloaded JSON is a `registry:theme` item compatible with the shadcn Registry CLI. Values are constrained to validated colors and known recipes; arbitrary CSS, HTML, and scripts are not accepted.

The five imported palettes are attributed in `packages/elements/THIRD_PARTY_NOTICES.md`, with the license text at `packages/elements/licenses/TWEAKCN-APACHE-2.0.txt`.
