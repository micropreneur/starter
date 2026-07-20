# Auth package guidance

- Keep `AuthPort` minimal and provider-neutral.
- Provider SDK imports belong only in `src/adapters/<provider>.ts`.
- Preserve `Set-Cookie` through web-standard `Response` objects.
- A new adapter must pass the same contract tests before the factory exposes it.
- Never make `apps/web` branch on provider behavior beyond selecting the factory input.
