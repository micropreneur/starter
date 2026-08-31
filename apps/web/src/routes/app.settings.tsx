import { IndexLabel, SettingsLayout } from '@micropreneur/elements'
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings')({
  component: AccountSettingsLayout,
})

const sections = [
  {
    description: 'Name and email address',
    href: '/app/settings/profile',
    label: 'Profile',
  },
  {
    description: 'Sign-in methods and password',
    href: '/app/settings/security',
    label: 'Security',
  },
  {
    description: 'Plan and subscription',
    href: '/app/settings/billing',
    label: 'Billing',
  },
  {
    description: 'Permanent account deletion',
    href: '/app/settings/danger',
    label: 'Danger zone',
  },
] as const

function AccountSettingsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const items = sections.map((section) => ({
    ...section,
    active: pathname === section.href,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
      <section className="border-b border-border/70 pb-4">
        <IndexLabel>Account · Controls</IndexLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage identity, sign-in security, billing, and the account lifecycle.
        </p>
      </section>

      <SettingsLayout
        description="Choose a section to update one part of your account at a time."
        heading="Account settings"
        items={items}
      >
        <Outlet />
      </SettingsLayout>
    </div>
  )
}
