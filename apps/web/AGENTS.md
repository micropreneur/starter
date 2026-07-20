# Web app guidance

- Keep this app as the composition root and shell, not a home for reusable adapters or domain packages.
- Server code obtains auth through `getAuth()` and the `AuthPort`; never import Better Auth or Descope SDKs here.
- Every server function and mutation re-checks authentication internally. Route guards are navigation UX, not authorization.
- Billing and email are composed through their ports. Keep Stripe, Resend, and provider payloads inside adapter packages.
- Access Cloudflare bindings server-side only. Regenerate types after changing `wrangler.jsonc`.
- UI imports come from `@micropreneur/elements`; do not copy registry components into this app.
- Blog posts live in `src/content/blog/*.mdx`; keep metadata and the matching section IDs valid so
  the build-time content registry can route and render them without runtime filesystem access.
- Keep local startup deterministic: migrations must apply before Vite serves auth routes.
- Preserve the Operations Registry as a removable reference slice; ownership always comes from the session, never form data.
- Never run `wrangler deploy` without an explicit user request.
