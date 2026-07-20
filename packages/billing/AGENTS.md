# Billing package guidance

- Free Starter supports exactly one monthly Stripe price and a `free`/`paid` entitlement boundary.
- App code depends on `BillingService`; only the Stripe adapter imports the Stripe SDK.
- Preserve raw webhook bodies, verify signatures, deduplicate event IDs, and ignore stale events.
- Seats, usage, credits, trials, coupons, annual plans, tax automation, and license gating are out of scope.
