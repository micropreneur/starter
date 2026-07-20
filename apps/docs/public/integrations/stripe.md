# Stripe billing

> Configure the one-plan Stripe sandbox, signed webhooks, customer portal, and registry export entitlement.

Free Starter demonstrates one recurring Stripe price, hosted Checkout, the customer portal, local
subscription state, and one independent entitlement: `registry.export`.

## The billing slice

Application code talks to `BillingService`; Stripe objects remain inside the adapter. Entitlements
are evaluated from local product state rather than scattered checks against provider objects.

Annual plans, trials, coupons, seats, usage billing, and Starter Pro licensing are intentionally
outside this slice.

## Configure the sandbox

Create one recurring monthly price in Stripe test mode. Configure all three values together in
`apps/web/.dev.vars`:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Leaving all three empty selects the disabled local adapter. Partial configuration stops startup.

## Forward webhooks

With the web app running, start the Stripe CLI listener:

```bash
stripe listen --forward-to http://localhost:3000/api/billing/webhook
```

Use the `whsec_...` value printed by that process as `STRIPE_WEBHOOK_SECRET`, then restart the web
app after changing `.dev.vars`.

## Verify paid access

1. Create and verify a disposable Starter account.
2. Open `/app/settings` and start Checkout.
3. Complete Checkout with a Stripe test card.
4. Wait for the signed subscription webhook.
5. Confirm the customer portal opens.
6. Open `/app/registry` and export CSV.

Replay the same event to confirm idempotency, then exercise cancellation and payment failure.
Webhook signatures, processed event IDs, and subscription timestamps protect local state from
forged, duplicated, and out-of-order events.
