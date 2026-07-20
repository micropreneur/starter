# Future `elements-pro` endpoint seam

This file documents a boundary; it is not an implementation.

```json
{
  "registries": {
    "@elements": "https://elements.micropreneur.dev/r/{name}.json",
    "@elements-pro": {
      "url": "https://elements-pro.micropreneur.dev/r/{name}.json",
      "headers": {
        "X-License-Key": "${ELEMENTS_PRO_LICENSE_KEY}"
      }
    }
  }
}
```

The future Cloudflare Worker should validate the header, resolve the license to Stripe-backed entitlements, authorize the requested item, and return private registry JSON. Use `401` for missing/invalid credentials, `403` for a valid license without that entitlement, and `404` for unknown items. Do not merge the private catalog into `starter` or its public build output.
