import { createFileRoute } from '@tanstack/react-router'

import { SecuritySettings } from '../components/account-settings'
import { getAccountOverview } from '../lib/auth.functions'

export const Route = createFileRoute('/app/settings/security')({
  loader: () => getAccountOverview(),
  component: SecuritySettingsPage,
})

function SecuritySettingsPage() {
  const account = Route.useLoaderData()
  return <SecuritySettings account={account} />
}
