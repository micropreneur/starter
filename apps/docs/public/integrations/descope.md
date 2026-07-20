# Descope

> Understand the typed Descope adapter seam, its current limitations, and the work required to make it functional.

Descope is represented by a typed adapter so the authentication boundary can be evaluated without
pretending the integration is complete.

## Current status

<Callout type="warning" title="Not a working provider">
  The Descope adapter returns explicit typed `501` responses for unsupported operations. Do not
  select `AUTH_PROVIDER=descope` in a user-facing environment yet.
</Callout>

No Descope session is treated as authenticated. The placeholder environment values are documented
for the future adapter but are not proof of a working integration:

```dotenv
DESCOPE_PROJECT_ID=
DESCOPE_MANAGEMENT_KEY=
```

## Why the seam exists

The app already defines the behavior it needs through `AuthPort`. A complete Descope adapter must
translate provider sessions, users, cookies, social authentication, and lifecycle operations into
those shared types.

This protects routes from a provider-specific rewrite later.

## Implementing the adapter

1. Keep every Descope SDK import inside `packages/auth/src/adapters/descope.ts`.
2. Implement every `AuthPort` method instead of silently falling back to Better Auth.
3. Preserve `Set-Cookie` headers on provider responses.
4. Map provider identities to the shared user and session shapes.
5. Run the same authentication contract tests used by the default adapter.
6. Complete manual sign-in, cancellation, recovery, profile, and deletion smoke tests.

Remove the `501` behavior only after those paths are verified.
