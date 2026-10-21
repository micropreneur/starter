# Elements package guidance

- This is the free public tier only; never add premium source or license validation.
- Use shadcn's Base UI primitives. Radix UI imports are not allowed.
- Keep source manifests separate from generated `dist/r` serving artifacts.
- Update registry metadata, runtime catalog metadata, and component docs together.
- After `registry:build`, install the exact local item URL into a throwaway project and inspect the output.
- Use the Objects / Properties / Actions / Interfaces vocabulary in titles, categories, and docs.
- `src/themes.ts` is the source of truth for the Starter theme; never hand-edit `packages/config/tailwind/theme-starter.css`. Run `themes:sync` after changing a preset.
- `accent` is the shadcn interaction tint. Use `mp-brand-highlight` for decorative brand marks, with a `primary` fallback in registry source.
