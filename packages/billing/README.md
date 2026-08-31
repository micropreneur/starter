# `@micropreneur/billing`

Free Starter includes a complete one-plan billing engine: Stripe-hosted Checkout,
the Stripe customer portal, signed and idempotent webhook processing, local subscription state,
account-deletion safeguards, and the `registry.export` entitlement.

The app-facing boundary is `BillingService`; provider objects never escape the adapter. Stripe is
off by default on purpose. Without all three Stripe values the app selects a disabled service,
continues to run locally, and identifies Stripe as not activated instead of pretending the user is
paid.

This package bills end users of products built from Starter. It is a billing engine, not a provider
placeholder. Starter Pro licensing is separate.

## Choose an activation path

- **Wire the included engine in your fork.** Create one recurring price, configure the three
  values, register the signed webhook route, and run the sandbox checks below.
- **Use [Starter Pro](https://www.micropreneur.dev).** Choose the paid template when you want the
  same checkout, portal, and webhook path already configured alongside workspace-scoped billing.

The first path needs no Pro code or credentials. With Stripe off, the app runs without a Stripe
account and rejects paid actions.

## Activate a local Stripe sandbox

1. Create one recurring monthly price in Stripe test mode.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` together in
   `apps/web/.dev.vars`. Leaving all three empty preserves the intentional off state. Partial
   configuration fails closed. All three values activate the Stripe service.
3. Forward test events while the web app is running:

   ```bash
   stripe listen --forward-to http://localhost:3000/api/billing/webhook
   ```

4. Open `/app/settings/billing`, start Checkout, return to the app, and confirm the portal opens.
5. Complete the Checkout with a Stripe test card, wait for the signed webhook, and confirm
   `/app/registry` exposes CSV export.
6. Replay the same event and confirm it is ignored, then test subscription cancellation and a
   failed renewal from the Stripe CLI or Dashboard.

For a deployed fork, configure the same three values as Worker secrets and register
`https://<your-origin>/api/billing/webhook` as the Stripe endpoint. Keep test and live prices,
keys, and signing secrets in their matching Stripe modes.

Checkout checks Stripe as well as local webhook state and uses one idempotent session per account
state, so retries cannot create parallel subscriptions. Account deletion also fails closed while
Stripe reports a non-terminal subscription; cancel it in the customer portal and wait for the
signed cancellation webhook before deleting the account.

Automated tests cover signature rejection, customer reuse, replay protection, out-of-order
subscription events, payment failure, and entitlement evaluation. They do not replace the final
manual round trip against a Stripe test account.
