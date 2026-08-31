import { createFileRoute } from '@tanstack/react-router'

import { DangerZoneSettings } from '../components/account-settings'
import { getAccountOverview } from '../lib/auth.functions'

export const Route = createFileRoute('/app/settings/danger')({
  loader: () => getAccountOverview(),
  component: DangerZoneSettingsPage,
})

function DangerZoneSettingsPage() {
  const account = Route.useLoaderData()
  return <DangerZoneSettings account={account} />
}
