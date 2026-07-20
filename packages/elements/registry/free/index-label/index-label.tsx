import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export interface IndexLabelProps extends ComponentProps<'span'> {
  /** 1-based position; rendered zero-padded to two digits, e.g. 1 -> "01". */
  value?: number
}

export function IndexLabel({ className, children, value, ...props }: IndexLabelProps) {
  return (
    <span
      className={cn(
        'font-mono text-xs font-medium tracking-[0.12em] text-muted-foreground tabular-nums',
        className,
      )}
      data-slot="index-label"
      {...props}
    >
      {children ?? (value != null ? String(value).padStart(2, '0') : null)}
    </span>
  )
}
