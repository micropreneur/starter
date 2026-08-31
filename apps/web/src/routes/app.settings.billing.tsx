import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BillingSettings } from '../components/account-settings'
import { getBillingOverview } from '../lib/billing.functions'

export const Route = createFileRoute('/app/settings/billing')({
  validateSearch: z.object({ billing: z.enum(['success', 'cancelled']).optional() }),
  loader: () => getBillingOverview(),
  component: BillingSettingsPage,
})

function BillingSettingsPage() {
  const billing = Route.useLoaderData()
  const { billing: result } = Route.useSearch()
  return <BillingSettings billing={billing} result={result} />
}
