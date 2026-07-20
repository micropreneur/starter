import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AuthCard } from './auth-card'
import { DashboardShell } from './dashboard-shell'
import { filterDataTableRows } from './filterable-data-table'
import { SettingsLayout } from './settings-layout'

const rows = [
  { id: '1', name: 'Project Apollo', owner: 'Sarah', status: 'active' },
  { id: '2', name: 'Project Zephyr', owner: 'James', status: 'review' },
  { id: '3', name: 'Project Orion', owner: 'Maya', status: 'archived' },
]

describe('free Elements application blocks', () => {
  it('filters rows by normalized search text and semantic value', () => {
    expect(
      filterDataTableRows({
        filter: 'active',
        getFilterValue: (row) => row.status,
        getSearchText: (row) => `${row.name} ${row.owner}`,
        query: '  APOLLO ',
        rows,
      }),
    ).toEqual([rows[0]])

    expect(
      filterDataTableRows({
        filter: 'all',
        getFilterValue: (row) => row.status,
        getSearchText: (row) => `${row.name} ${row.owner}`,
        query: 'project',
        rows,
      }),
    ).toHaveLength(3)
  })

  it('renders an accessible dashboard navigation and selected state', () => {
    const markup = renderToStaticMarkup(
      <DashboardShell
        brand="Acme"
        navItems={[
          { label: 'Overview', href: '/app', active: true },
          { label: 'Customers', href: '/app/customers' },
        ]}
      >
        Dashboard content
      </DashboardShell>,
    )

    expect(markup).toContain('aria-label="Primary"')
    expect(markup).toContain('aria-current="page"')
    expect(markup).toContain('Dashboard content')
  })

  it('renders provider-neutral credential fields without an SDK dependency', () => {
    const markup = renderToStaticMarkup(<AuthCard forgotPasswordHref="/forgot-password" />)

    expect(markup).toContain('type="email"')
    expect(markup).toContain('type="password"')
    expect(markup).toContain('autoComplete="current-password"')
    expect(markup).toContain('/forgot-password')
  })

  it('renders router-neutral settings links and content', () => {
    const markup = renderToStaticMarkup(
      <SettingsLayout
        heading="Settings"
        items={[{ label: 'Profile', href: '/settings/profile', active: true }]}
      >
        Profile form
      </SettingsLayout>,
    )

    expect(markup).toContain('aria-label="Settings"')
    expect(markup).toContain('href="/settings/profile"')
    expect(markup).toContain('Profile form')
  })
})
