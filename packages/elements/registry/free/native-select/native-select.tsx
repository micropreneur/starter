import { ChevronDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type NativeSelectProps = Omit<ComponentProps<'select'>, 'size'> & {
  size?: 'default' | 'sm'
}

export function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        'group/native-select relative w-fit has-[select:disabled]:opacity-50',
        className,
      )}
      data-size={size}
      data-slot="native-select-wrapper"
    >
      <select
        className="h-8 w-full min-w-0 appearance-none rounded-md border border-input bg-background py-1 pr-8 pl-2.5 text-sm transition-colors outline-none select-none selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-7 data-[size=sm]:py-0.5"
        data-size={size}
        data-slot="native-select"
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none"
        data-slot="native-select-icon"
      />
    </div>
  )
}

export function NativeSelectOption({ className, ...props }: ComponentProps<'option'>) {
  return (
    <option
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      data-slot="native-select-option"
      {...props}
    />
  )
}

export function NativeSelectOptGroup({ className, ...props }: ComponentProps<'optgroup'>) {
  return (
    <optgroup
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      data-slot="native-select-optgroup"
      {...props}
    />
  )
}
