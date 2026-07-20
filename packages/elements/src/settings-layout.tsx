import { cn } from '@micropreneur/ui/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

export interface SettingsLayoutItem {
  active?: boolean
  description?: string
  href: string
  label: string
}

export interface SettingsLayoutProps extends ComponentProps<'section'> {
  children: ReactNode
  description?: ReactNode
  heading: ReactNode
  items: readonly SettingsLayoutItem[]
}

export function SettingsLayout({
  children,
  className,
  description,
  heading,
  items,
  ...props
}: SettingsLayoutProps) {
  return (
    <section
      className={cn('overflow-hidden rounded-lg border bg-background', className)}
      data-slot="settings-layout"
      {...props}
    >
      <header className="border-b px-4 py-3">
        <h2 className="text-base font-medium tracking-[-0.01em] text-foreground">{heading}</h2>
        {description != null && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </header>
      <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          aria-label="Settings"
          className="flex gap-0.5 overflow-x-auto border-b p-2 md:flex-col md:border-r md:border-b-0"
        >
          {items.map((item) => (
            <a
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'min-w-36 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:min-w-0',
                item.active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground',
              )}
              href={item.href}
              key={`${item.href}-${item.label}`}
            >
              <span className="block">{item.label}</span>
              {item.description != null && (
                <span className="mt-0.5 hidden text-xs font-normal text-muted-foreground md:block">
                  {item.description}
                </span>
              )}
            </a>
          ))}
        </nav>
        <div className="min-w-0 p-4">{children}</div>
      </div>
    </section>
  )
}
