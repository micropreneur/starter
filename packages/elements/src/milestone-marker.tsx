import { cn } from '@micropreneur/ui/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

export function Milestones({ className, ...props }: ComponentProps<'ol'>) {
  return <ol className={cn('flex flex-col', className)} data-slot="milestones" {...props} />
}

export type MilestoneStatus = 'done' | 'current' | 'upcoming'

export interface MilestoneMarkerProps extends Omit<ComponentProps<'li'>, 'title'> {
  /** Primary label for the milestone. */
  title: ReactNode
  /** Small muted metadata line, e.g. a date. */
  meta?: ReactNode
  status?: MilestoneStatus
}

const markerStyles: Record<MilestoneStatus, string> = {
  done: 'border-primary bg-primary',
  current: 'border-primary bg-background',
  upcoming: 'border-border bg-background',
}

export function MilestoneMarker({
  children,
  className,
  meta,
  status = 'upcoming',
  title,
  ...props
}: MilestoneMarkerProps) {
  return (
    <li
      className={cn('group/milestone relative flex gap-3 pb-6 last:pb-0', className)}
      data-slot="milestone-marker"
      data-status={status}
      {...props}
    >
      <span aria-hidden className="flex w-3 shrink-0 flex-col items-center">
        <span
          className={cn(
            'mt-1 size-3 shrink-0 rounded-full border-2 transition-colors duration-150',
            markerStyles[status],
          )}
        />
        <span className="mt-1 w-px flex-1 bg-border group-last/milestone:hidden" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'text-sm font-medium',
            status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {title}
        </span>
        {meta != null && (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{meta}</span>
        )}
        {children != null && <div className="text-xs text-muted-foreground">{children}</div>}
      </div>
    </li>
  )
}
