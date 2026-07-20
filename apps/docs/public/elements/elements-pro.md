# Elements Pro

> Understand the future authenticated registry contract without including premium source or a license gate in Starter.

Elements Pro is designed as a separate private source repository and authenticated shadcn registry.
The public Starter repository contains only the seam that lets both tiers coexist.

## Current status

<Callout type="warning" title="Documented contract, not a live registry">
  Starter does not ship premium source, license validation, Stripe licensing, revocation, or a
  production Elements Pro endpoint. Commands using `@elements-pro` become valid only after that
  service publishes its final registry URL.
</Callout>

## Intended CLI contract

A consuming project's `components.json` will configure a separate authenticated namespace:

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

The license belongs in an uncommitted environment file:

```dotenv
ELEMENTS_PRO_LICENSE_KEY=
```

Once the endpoint exists, installation follows normal shadcn namespace syntax:

```bash
pnpm dlx shadcn@latest add @elements-pro/dashboard-shell
```

## Free and Pro stay separate

The free manifest remains public, static, and MIT-licensed. The premium Worker validates the key and
component entitlement before serving item JSON from the private manifest.

Both registries deliver source through the same CLI, but neither tier imports or mirrors the other
tier's source repository.

## Private documentation later

The Pro repository should own authenticated documentation when premium implementation begins. The
planned seam is private article metadata, a signed-in docs session, and a server-side entitlement
check before private MDX is loaded or returned.

Do not place premium MDX, client-trusted entitlement checks, or a placeholder JWT verifier in the
public Starter repository. The final contract belongs in the Pro workstream, where its identity and
licensing systems can be tested together.
