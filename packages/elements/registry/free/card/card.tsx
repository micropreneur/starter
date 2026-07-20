import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function Card({
  className,
  clipped = false,
  size = 'default',
  ...props
}: ComponentProps<'div'> & { clipped?: boolean; size?: 'default' | 'sm' }) {
  return (
    <div
      className={cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-card [--card-spacing:--spacing(3)] data-[size=sm]:[--card-spacing:--spacing(2.5)]',
        clipped ? 'rounded-[8px_8px_2px_8px]' : 'rounded-lg',
        className,
      )}
      data-clipped={clipped ? '' : undefined}
      data-size={size}
      data-slot="card"
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid auto-rows-min items-start gap-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm leading-snug font-medium', className)}
      data-slot="card-title"
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-xs leading-relaxed text-muted-foreground', className)}
      data-slot="card-description"
      {...props}
    />
  )
}

export function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      data-slot="card-action"
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('px-(--card-spacing)', className)} data-slot="card-content" {...props} />
  )
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center border-t bg-muted/50 p-(--card-spacing)', className)}
      data-slot="card-footer"
      {...props}
    />
  )
}
