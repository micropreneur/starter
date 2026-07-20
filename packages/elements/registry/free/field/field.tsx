import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('group/field-group flex w-full flex-col gap-4', className)}
      data-slot="field-group"
      {...props}
    />
  )
}

const fieldVariants = cva('group/field flex w-full gap-1.5 data-[invalid=true]:text-destructive', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col *:w-full',
    },
  },
  defaultVariants: { orientation: 'vertical' },
})

export function Field({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: this generic field wrapper mirrors the Base UI shadcn field primitive and must remain nestable.
    <div
      className={cn(fieldVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="field"
      role="group"
      {...props}
    />
  )
}

export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: consumers provide htmlFor or nest the associated control.
    <label
      className={cn('flex w-fit items-center gap-2 text-xs leading-snug font-medium', className)}
      data-slot="field-label"
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-xs leading-normal text-muted-foreground', className)}
      data-slot="field-description"
      {...props}
    />
  )
}

export function FieldError({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-xs text-destructive', className)}
      data-slot="field-error"
      role="alert"
      {...props}
    />
  )
}
