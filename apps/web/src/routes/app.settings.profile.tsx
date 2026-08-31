import { createFileRoute } from '@tanstack/react-router'

import { ProfileSettings } from '../components/account-settings'
import { getAccountOverview } from '../lib/auth.functions'

export const Route = createFileRoute('/app/settings/profile')({
  loader: () => getAccountOverview(),
  component: ProfileSettingsPage,
})

function ProfileSettingsPage() {
  const account = Route.useLoaderData()
  return <ProfileSettings account={account} />
}
