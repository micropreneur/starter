import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function MarginNote({ className, children, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'flex max-w-prose items-baseline gap-2 text-xs leading-relaxed text-muted-foreground',
        className,
      )}
      data-slot="margin-note"
      {...props}
    >
      <span aria-hidden className="inline-block h-px w-4 shrink-0 translate-y-[-0.2em] bg-accent" />
      <span className="italic">{children}</span>
    </p>
  )
}
