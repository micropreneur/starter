# Future `elements-pro` endpoint seam

This file documents a boundary; it is not an implementation.

```json
{
  "registries": {
    "@elements": "https://elements.micropreneur.dev/r/{name}.json",
    "@elements-pro": {
      "url": "https://pro.elements.micropreneur.dev/r/{name}.json",
      "headers": {
        "Authorization": "Bearer ${ELEMENTS_PRO_LICENSE_KEY}"
      }
    }
  }
}
```

The future Cloudflare Worker should validate the bearer credential, resolve the license to a
commerce-backed entitlement, authorize the requested item, and return private registry JSON. Use
`401` for missing, invalid, or inactive credentials and `404` for unknown items. Do not merge the
private catalog into `starter` or its public build output.
