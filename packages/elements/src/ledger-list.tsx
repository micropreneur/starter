import { cn } from '@micropreneur/ui/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

export function LedgerList({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('flex w-full flex-col divide-y divide-border', className)}
      data-slot="ledger-list"
      {...props}
    />
  )
}

export interface LedgerRowProps extends Omit<ComponentProps<'li'>, 'children'> {
  /** Optional index marker rendered before the name, e.g. "01". */
  index?: ReactNode
  /** Primary label. */
  name: ReactNode
  /** Secondary muted detail under or beside the name. */
  meta?: ReactNode
  /** Right-aligned monospaced figure (amount, count, id). */
  figure?: ReactNode
  /** Trailing status slot, e.g. a StatusBadge. */
  status?: ReactNode
  selected?: boolean
}

export function LedgerRow({
  className,
  figure,
  index,
  meta,
  name,
  selected = false,
  status,
  ...props
}: LedgerRowProps) {
  return (
    <li
      className={cn(
        'group/ledger-row flex items-center gap-4 px-3 py-2.5 transition-colors duration-150 first:rounded-t-md last:rounded-b-md hover:bg-muted/60',
        selected && 'bg-primary/5 shadow-[inset_2px_0_0_var(--color-primary)] hover:bg-primary/10',
        className,
      )}
      data-selected={selected ? '' : undefined}
      data-slot="ledger-row"
      {...props}
    >
      {index != null && (
        <span className="w-6 shrink-0 font-mono text-xs tracking-[0.08em] text-muted-foreground tabular-nums">
          {index}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        {meta != null && <span className="truncate text-xs text-muted-foreground">{meta}</span>}
      </div>
      {figure != null && (
        <span className="shrink-0 font-mono text-sm text-foreground tabular-nums">{figure}</span>
      )}
      {status != null && <span className="flex shrink-0 items-center">{status}</span>}
    </li>
  )
}
