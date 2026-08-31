import { isOpenSubscription } from '@micropreneur/billing'
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@micropreneur/elements'
import { CreditCard } from 'lucide-react'
import { useState } from 'react'

import { type BillingOverview, FormFeedback, postJson, SettingsSection } from './shared'

export function BillingSettings({
  billing,
  result,
}: {
  billing: BillingOverview
  result?: 'success' | 'cancelled'
}) {
  return (
    <SettingsSection
      description="View local subscription state and open Stripe-hosted billing when configured."
      title="Billing"
    >
      {result ? (
        <div className="mb-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm" role="status">
          {result === 'success'
            ? 'Checkout completed. Stripe will confirm access through the webhook shortly.'
            : 'Checkout was cancelled; nothing changed.'}
        </div>
      ) : null}
      <BillingCard billing={billing} />
    </SettingsSection>
  )
}

function BillingCard({ billing }: { billing: BillingOverview }) {
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const paid = billing.registryExport
  const manageable = isOpenSubscription(billing.subscription)

  async function openBilling() {
    setPending(true)
    setError(undefined)
    const response = await postJson(
      manageable ? '/api/billing/portal' : '/api/billing/checkout',
      {},
    )
    const body = (await response.json().catch(() => null)) as {
      error?: string
      url?: string
    } | null
    if (!response.ok || !body?.url) {
      setError(body?.error ?? 'Billing is unavailable in this environment.')
      setPending(false)
      return
    }
    window.location.assign(body.url)
  }

  if (!billing.configured) {
    return (
      <Card className="max-w-2xl" clipped size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Subscription
          </CardTitle>
          <CardDescription>
            Free Starter leaves Stripe off until the fork owner supplies all three values.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-start justify-between gap-3 rounded-md border p-2.5">
            <div>
              <p className="text-sm font-medium">Stripe not activated</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Checkout, the customer portal, signed webhooks, and entitlements are included.
              </p>
            </div>
            <StatusBadge status="neutral">off by default</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            Add your own Stripe sandbox values, or use Starter Pro when you want billing already
            wired into the product template.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              className={buttonVariants({ variant: 'outline' })}
              href="https://docs.micropreneur.dev/integrations/stripe"
              rel="noreferrer"
              target="_blank"
            >
              Activation guide
            </a>
            <a
              className={buttonVariants({ variant: 'outline' })}
              href="https://www.micropreneur.dev"
              rel="noreferrer"
              target="_blank"
            >
              See Starter Pro
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl" clipped size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-4" />
          Subscription
        </CardTitle>
        <CardDescription>
          Stripe Checkout, the customer portal, signed webhooks, and app-owned entitlements.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center justify-between gap-3 rounded-md border p-2.5">
          <div>
            <p className="text-sm font-medium">{paid ? 'Paid' : 'Free'} plan</p>
            <p className="text-xs text-muted-foreground">
              CSV export {billing.registryExport ? 'enabled' : 'locked'}
            </p>
          </div>
          <StatusBadge status={paid ? 'positive' : 'neutral'}>
            {billing.subscription?.status ?? 'free'}
          </StatusBadge>
        </div>
        <FormFeedback error={error} />
        <Button
          disabled={pending}
          onClick={() => void openBilling()}
          type="button"
          variant={manageable ? 'outline' : 'default'}
        >
          {pending ? 'Opening…' : manageable ? 'Manage billing' : 'Upgrade to paid'}
        </Button>
      </CardContent>
    </Card>
  )
}
