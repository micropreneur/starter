import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@micropreneur/elements/primitives'
import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router'

import { AppSidebar } from '../components/app-sidebar'
import { ThemeToggle } from '../components/theme-toggle'
import { getAppContext } from '../lib/workspace.functions'

export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    const context = await getAppContext()
    if (!context) throw redirect({ to: '/sign-in' })
    if (!context.workspace.onboardingComplete) throw redirect({ to: '/onboarding' })
    return context
  },
  component: AppLayout,
})

function AppLayout() {
  const { user, workspace } = Route.useRouteContext()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const page = pathname.startsWith('/app/registry')
    ? 'Operations Registry'
    : pathname.startsWith('/app/settings')
      ? 'Settings'
      : 'Overview'

  return (
    <SidebarProvider>
      <AppSidebar user={user} workspace={workspace} />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/70">
          <div className="flex min-w-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              orientation="vertical"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:flex">
                  <BreadcrumbLink href="/app">Workspace</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{page}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-3">
            <ThemeToggle />
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
