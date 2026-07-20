import { cn } from '@micropreneur/ui/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

export interface DashboardShellNavItem {
  active?: boolean
  href: string
  icon?: ReactNode
  label: string
}

export interface DashboardShellMetric {
  detail?: ReactNode
  label: string
  value: ReactNode
}

export interface DashboardShellProps extends ComponentProps<'section'> {
  brand: ReactNode
  children: ReactNode
  header?: ReactNode
  metrics?: readonly DashboardShellMetric[]
  navItems: readonly DashboardShellNavItem[]
  user?: ReactNode
}

export function DashboardShell({
  brand,
  children,
  className,
  header,
  metrics = [],
  navItems,
  user,
  ...props
}: DashboardShellProps) {
  return (
    <section
      className={cn(
        'grid min-h-[32rem] overflow-hidden rounded-xl border bg-background md:grid-cols-[13rem_minmax(0,1fr)]',
        className,
      )}
      data-slot="dashboard-shell"
      {...props}
    >
      <aside className="flex flex-col border-b bg-sidebar p-3 md:border-r md:border-b-0">
        <div className="flex min-h-9 items-center px-2 font-medium text-sidebar-foreground">
          {brand}
        </div>
        <nav aria-label="Primary" className="mt-4 flex gap-1 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <a
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'flex min-h-8 shrink-0 items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-sidebar-ring/50',
                item.active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
              )}
              href={item.href}
              key={`${item.href}-${item.label}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        {user != null && <div className="mt-auto hidden border-t pt-3 md:block">{user}</div>}
      </aside>

      <div className="min-w-0">
        {header != null && (
          <header className="flex min-h-14 items-center border-b px-4">{header}</header>
        )}
        <div className="flex flex-col gap-4 p-4">
          {metrics.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div className="rounded-lg border bg-card p-3 shadow-card" key={metric.label}>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-xl font-medium tracking-[-0.02em] text-card-foreground">
                    {metric.value}
                  </p>
                  {metric.detail != null && (
                    <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  )
}
