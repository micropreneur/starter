import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Serif display headline. */
  title: ReactNode
  /** Muted supporting copy. */
  description?: ReactNode
  /** Action slot, e.g. a Button. */
  action?: ReactNode
}

export function EmptyState({
  action,
  children,
  className,
  description,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-grain flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border px-5 py-10 text-center',
        className,
      )}
      data-slot="empty-state"
      {...props}
    >
      <h3 className="font-display text-xl tracking-[-0.02em] text-foreground">{title}</h3>
      {description != null && (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {children}
      {action != null && <div className="mt-2 flex items-center gap-2">{action}</div>}
    </div>
  )
}
