import type { AuthUser } from '@micropreneur/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@micropreneur/elements/primitives'
import type { ActiveWorkspace } from '@micropreneur/workspaces'
import { useRouterState } from '@tanstack/react-router'
import { BookOpen, CircleHelp, LayoutDashboard, Settings2, TableProperties } from 'lucide-react'
import type { ComponentProps } from 'react'

import { siteLinks } from '../config/site'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

const navigation = [
  {
    title: 'Overview',
    url: '/app',
    icon: LayoutDashboard,
    items: [
      { title: 'Dashboard', url: '/app' },
      { title: 'Recent activity', url: '/app#activity' },
    ],
  },
  {
    title: 'Registry',
    url: '/app/registry',
    icon: TableProperties,
  },
  {
    title: 'Settings',
    url: '/app/settings',
    icon: Settings2,
  },
]

const secondaryNavigation = [
  {
    title: 'Documentation',
    url: siteLinks.docs,
    icon: BookOpen,
  },
  {
    title: 'Report an issue',
    url: siteLinks.issues,
    icon: CircleHelp,
  },
]

export function AppSidebar({
  user,
  workspace,
  ...props
}: ComponentProps<typeof Sidebar> & { user: AuthUser; workspace: ActiveWorkspace }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const items = navigation.map((item) => ({
    ...item,
    isActive:
      item.url === '/app'
        ? pathname === '/app' || pathname === '/app/'
        : pathname.startsWith(item.url),
  }))

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<a href="/app" />} size="lg">
              <img
                alt=""
                aria-hidden="true"
                className="size-7 rounded-md object-cover ring-1 ring-border/40"
                height="28"
                src={workspace.avatarUrl ?? '/favicon.png'}
                width="28"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{workspace.name}</span>
                <span className="truncate text-xs">Personal workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
        <NavSecondary className="mt-auto" items={secondaryNavigation} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
