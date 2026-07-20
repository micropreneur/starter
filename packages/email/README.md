# `@micropreneur/email`

Application and auth code depend on `EmailPort`, not a vendor SDK. Resend is the production
adapter. Local development uses an explicit capture adapter that writes the message subject and
action URL to the local terminal so verification and recovery remain testable without secrets.

Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` outside local development. A
non-local origin fails closed when the production provider is not configured.

## Verification

- Local: leave `EMAIL_PROVIDER=local`, create an account, and open the `[email:local]` action URL
  printed by the web process. Repeat for password recovery and account deletion.
- Resend: verify the `EMAIL_FROM` domain, set all three production values, create a disposable
  account, and confirm verification, welcome, reset, and deletion messages arrive.
- Security: sign-up and recovery responses stay generic, reset links are single-use, expired
  tokens fail, and Worker delivery is deferred through `waitUntil`.

Template and adapter tests remain deterministic without a Resend account.
