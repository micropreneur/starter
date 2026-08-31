# Stripe billing

> Activate the complete one-plan Stripe engine or choose Starter Pro for a billing flow that is already wired.

Free Starter includes a complete one-plan Stripe engine: one recurring price, hosted
Checkout, the customer portal, signed and idempotent webhook processing, local subscription state,
account-deletion safeguards, and one independent entitlement: `registry.export`.

It ships with Stripe off by default. That is an intentional product choice, not a placeholder or a
broken integration.

## The billing engine

Application code talks to `BillingService`; Stripe objects remain inside the adapter. Entitlements
are evaluated from D1-backed product state rather than scattered checks against provider objects.
Checkout reuses the customer, prevents parallel open subscriptions, and creates idempotent sessions.
Webhook signatures, event IDs, and subscription timestamps protect local state from forged,
duplicated, and out-of-order events.

Free Starter does not implement annual plans, trials, coupons, seats, usage billing, or Starter Pro
licensing.

## Choose an activation path

- **Activate it yourself.** A fork owner supplies one Stripe price and the three environment
  values below, then points Stripe at the webhook route that is already in the app.
- **Choose [Starter Pro](https://www.micropreneur.dev).** Use the paid template when Checkout, the
  customer portal, webhook handling, and workspace-scoped billing should arrive already wired.

<Callout title="Off by default is intentional">
  With no Stripe values, the app selects `createDisabledBillingService`, shows a clear "Stripe not
  activated" state, and makes no Stripe calls. The rest of the local app keeps running.
</Callout>

## Configure the sandbox

Create one recurring monthly price in Stripe test mode. Configure all three values together in
`apps/web/.dev.vars`:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Leaving all three empty preserves the intentional off state. Partial configuration stops startup.
All three values activate the Stripe service.

## Forward webhooks

With the web app running, start the Stripe CLI listener:

```bash
stripe listen --forward-to http://localhost:3000/api/billing/webhook
```

Use the `whsec_...` value printed by that process as `STRIPE_WEBHOOK_SECRET`, then restart the web
app after changing `.dev.vars`.

## Activate a deployed fork

Configure the same values as Worker secrets for the web app:

```bash
pnpm --dir apps/web wrangler secret put STRIPE_SECRET_KEY
pnpm --dir apps/web wrangler secret put STRIPE_PRICE_ID
pnpm --dir apps/web wrangler secret put STRIPE_WEBHOOK_SECRET
```

Register `https://<your-origin>/api/billing/webhook` as the Stripe endpoint and use its signing
secret. Keep test and live prices, keys, and signing secrets in their matching Stripe modes. Follow
[Deploy to Cloudflare](/cloudflare/deployment) for the rest of the Worker setup.

## Verify paid access

1. Create and verify a disposable Starter account.
2. Open `/app/settings/billing` and start Checkout.
3. Complete Checkout with a Stripe test card.
4. Wait for the signed subscription webhook.
5. Confirm the customer portal opens.
6. Open `/app/registry` and export CSV.

Replay the same event to confirm idempotency, then exercise cancellation and payment failure.
These provider-backed checks prove that the configured fork can complete the paid loop.
