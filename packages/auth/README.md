# `@micropreneur/auth`

Application code imports only `AuthPort`, `createAuth`, and provider-neutral types from this package. Provider SDKs are confined to `src/adapters`.

## Contract

`AuthPort` uses web-standard `Headers`, `Request`, and `Response` values so adapters preserve cookies without leaking SDK types. Its surface is intentionally small:

- `getSession`, `getUser`, and `requireUser`
- credential and provider-neutral social sign-in, sign-up, and sign-out
- verification, recovery, profile, password, linked-account, and deletion operations
- `handleRequest` for the provider's HTTP endpoint

`AUTH_PROVIDER=betterauth|descope` is resolved once in the web composition root. Better Auth is the default. It uses the D1 Drizzle client and Better Auth's TanStack Start cookies plugin. Google is added only when both OAuth values exist; credentials continue to work when neither exists. `EmailPort` supplies verification, reset, welcome, and deletion mail without exposing Resend here.

The composition root may supply the provider-neutral `onUserCreated(AuthUser)` callback. Free Starter
uses it to provision one personal workspace for credential and social accounts without making the
auth package depend on workspace rules. Signup onboarding answers are applied by the web
orchestration layer after `AuthPort.signUp` succeeds.

The adapter fails closed: it throws unless `BETTER_AUTH_SECRET` is set or the composition root explicitly opts into the checked-in development-only secret, which `apps/web` does only for a local origin. Contract tests exercise credential auth, optional Google configuration, email verification, single-use reset tokens, linked methods, and deletion cascades against Miniflare D1.

Google callbacks are `<BETTER_AUTH_URL>/api/auth/callback/google`; locally that is `http://localhost:3000/api/auth/callback/google`.

For the manual OAuth smoke test, configure that exact callback in a Google test client, set both
Google values, and verify sign-in, cancellation, an existing credential email, and sign-out. Then
remove both values and confirm credential auth still works and the Google action disappears. A
partial Google configuration must stop startup with an actionable error.

The Descope adapter is a typed seam only — a compiling 501 stub with explicit TODOs, not a working alternate adapter. No Descope session is treated as authenticated until that adapter validates it.

## Add an adapter

1. Add `src/adapters/<provider>.ts` and keep the provider SDK import inside that file.
2. Map the provider's user/session objects to `AuthUser` and `AuthSession`; do not expand the port with provider-only fields.
3. Implement every `AuthPort` method and preserve cookie headers on returned `Response` objects.
4. Add the provider literal to `AuthProvider`, factory branch, `.env.example`, and this README.
5. Add contract tests that exercise unauthenticated, authenticated, sign-in, recovery, lifecycle, and sign-out behavior.
6. Switch `AUTH_PROVIDER` and run the same web route tests. Application route code must not change.

The D1 dependency is injected into `createAuth` by `apps/web`; the factory never reaches into global Worker state itself.
