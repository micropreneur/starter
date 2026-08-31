# R2 file uploads

> Enable owner-scoped avatar and workspace-logo uploads with short-lived presigned R2 URLs.

Starter includes Cloudflare R2 reference implementations for account avatars and personal-workspace
logos. Browser uploads go directly to R2 through a short-lived presigned `PUT`; reads, metadata
validation, and deletes use the Worker binding.

## Default local behavior

The `FILES` binding uses Wrangler's local R2 simulation, but direct browser uploads stay visibly
disabled until all signing values are configured. Credential auth, onboarding, settings, and the
Operations Registry continue to work without R2 API credentials.

Presigned URLs always use R2's remote S3 API. For an end-to-end upload test while the app runs
locally, use a non-production bucket and temporarily add `"remote": true` to the `FILES` R2 binding.
That makes completion and reads use the same remote bucket as the signed URL. Remote operations are
billable and require Cloudflare access, so Starter does not enable this in the committed default.

Only PNG, JPEG, and WebP images are accepted. Avatars are limited to 2 MB and workspace logos to 5
MB. The server reads the staged R2 object, checks its metadata, actual size, and PNG/JPEG/WebP magic
bytes, then copies the validated bytes to a new final key before saving a database reference.

## Create the bucket

Create one private bucket for the fork and keep its name synchronized with `R2_BUCKET_NAME` and the
`FILES` binding in `apps/web/wrangler.jsonc`:

```bash
pnpm --dir apps/web exec wrangler r2 bucket create my-product-files
```

Do not enable the public `r2.dev` URL. Starter serves images through authenticated same-origin
routes and never exposes the R2 signing credentials to the browser.

## Configure browser CORS

Presigned URLs use R2's S3 API origin, so browsers require a bucket CORS rule. Copy
`apps/web/r2-cors.example.json`, replace every origin with the exact local or deployed application
origin, and remove origins that environment does not use. Origins include the scheme and optional
port, with no trailing slash or path.

Apply and inspect the policy deliberately:

```bash
pnpm --dir apps/web exec wrangler r2 bucket cors set my-product-files \
  --file r2-cors.example.json
pnpm --dir apps/web exec wrangler r2 bucket cors list my-product-files
```

The example permits only `PUT`, allows the application-set `Content-Type` request header, and
exposes `ETag`. The browser manages the forbidden `Content-Length` header itself, so it does not
belong in the CORS allow-list. CORS limits which browser origins may use a grant; it does not
replace authentication.

## Expire abandoned staging uploads

The committed `apps/web/r2-lifecycle.example.json` expires only the `staging/` prefix after one day.
Inspect existing rules before applying it because `lifecycle set` replaces the bucket's complete
lifecycle configuration. Test the change on a non-production bucket, then inspect the result:

```bash
pnpm --dir apps/web exec wrangler r2 bucket lifecycle list my-product-files
pnpm --dir apps/web exec wrangler r2 bucket lifecycle set my-product-files \
  --file r2-lifecycle.example.json
pnpm --dir apps/web exec wrangler r2 bucket lifecycle list my-product-files
```

R2 typically removes expired objects within 24 hours after their expiration time. Bucket lock rules
take precedence, so verify that no lock retains the `staging/` prefix longer than intended.

## Configure signing

Create an R2 API token with object read/write access scoped to this bucket. Set the account ID in
`wrangler.jsonc`, then store both token values as Worker secrets:

```bash
pnpm --dir apps/web exec wrangler secret put R2_ACCESS_KEY_ID
pnpm --dir apps/web exec wrangler secret put R2_SECRET_ACCESS_KEY
```

For local testing only, copy the same three values into the gitignored `apps/web/.dev.vars`. Never
commit them or print them in test output, and pair them with the non-production remote binding
described above. The Worker uses `aws4fetch` and Web Crypto to sign a five-minute, single-key `PUT`
whose `Content-Type` and exact `Content-Length` must match the upload request.

Application code sends the selected `File` as the request body and sets only the returned
`Content-Type`. Browsers automatically supply the file's actual `Content-Length`; JavaScript must
not try to set that forbidden header. R2 rejects the request when the browser-supplied length differs
from the value signed by the Worker, enforcing the 2 MB or 5 MB policy before storing the body.
Completion independently checks the actual R2 object size and image magic bytes before
finalization. The committed `AUTH_RATE_LIMITER` binding limits signed grants to 10 per minute per
authenticated user, and the staging lifecycle rule bounds abandoned objects. Replace its example
`namespace_id` with a unique positive integer for the Cloudflare account before deployment. R2
signing fails closed with an actionable configuration error if that binding is absent.

## Upload lifecycle

1. An authenticated route resolves the user or active personal workspace; the client never submits
   an owner ID.
2. The server derives an owner-scoped, random staging key and returns the signed URL plus
   `expiresAt`, required headers, and the size limit. The URL binds the request's exact byte length.
3. The browser sends the image directly to R2 with the signed `Content-Type` and its automatic
   `Content-Length`.
4. A same-origin completion request reads the staged object through `FILES`, verifies ownership,
   type, actual size, and image magic bytes, and writes those validated bytes to a new random final
   key.
5. The Worker deletes the staging object, stores a same-origin final-key reference, and removes the
   previous owned object.
6. Authenticated image routes stream only final keys and reject staging or cross-owner keys as not
   found.
7. Confirmed account deletion removes final and staged avatar and personal-workspace logo
   collections before the auth/database cascade. Merely requesting the deletion email leaves files
   and account data untouched; cleanup failure aborts deletion.

Treat each presigned URL as a bearer token until `expiresAt`. A signed URL can recreate or overwrite
its staging key until expiry, but it can never address the finalized key being served. Request a new
grant after expiry. Keep the committed staging lifecycle rule, or an equally short replacement, in
every environment where signed grants are enabled.

## Verify the boundary

Run the focused policy tests and regenerate binding types after changing Wrangler configuration:

```bash
pnpm --filter @micropreneur/files test
pnpm --filter @micropreneur/auth test
pnpm --filter web test -- account-files.server.test.ts files-rate-limit.server.test.ts files.server.test.ts r2-policy.test.ts
pnpm --filter web cf-typegen
```

Before a release, upload and replace both image kinds, remove them, try an unsupported type and an
oversized image, then confirm a second account receives `404` for the first account's object key.
Request account deletion and confirm both images remain before email confirmation; after confirming,
verify both owner collections and the account rows are gone.
