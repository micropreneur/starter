# `@micropreneur/billing`

Free Starter includes one intentionally small subscription path: Stripe-hosted Checkout, the
Stripe customer portal, local subscription state, and the `registry.export` entitlement.

The app-facing boundary is `BillingService`; provider objects never escape the adapter. Without
Stripe secrets the app selects a disabled adapter, continues to run locally, and displays clear
setup guidance instead of pretending the user is paid.

This is end-user billing for products built from Starter. It is not Starter Pro licensing.

## Local Stripe sandbox

1. Create one recurring monthly price in Stripe test mode.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` together in
   `apps/web/.dev.vars`. Leaving all three empty selects the disabled adapter; partial
   configuration fails closed.
3. Forward test events while the web app is running:

   ```bash
   stripe listen --forward-to http://localhost:3000/api/billing/webhook
   ```

4. Open `/app/settings`, start Checkout, return to the app, and confirm the portal opens.
5. Complete the Checkout with a Stripe test card, wait for the signed webhook, and confirm
   `/app/registry` exposes CSV export.
6. Replay the same event and confirm it is ignored, then test subscription cancellation and a
   failed renewal from the Stripe CLI or Dashboard.

Checkout checks Stripe as well as local webhook state and uses one idempotent session per account
state, so retries cannot create parallel subscriptions. Account deletion also fails closed while
Stripe reports a non-terminal subscription; cancel it in the customer portal and wait for the
signed cancellation webhook before deleting the account.

Automated tests cover signature rejection, customer reuse, replay protection, out-of-order
subscription events, payment failure, and entitlement evaluation. They do not replace the final
manual round trip against a Stripe test account.
