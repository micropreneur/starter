import type { VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

import { Badge, type badgeVariants } from '@/components/ui/badge'

const variants = {
  destructive: 'destructive',
  neutral: 'secondary',
  positive: 'default',
  warning: 'outline',
} as const satisfies Record<string, VariantProps<typeof badgeVariants>['variant']>

export interface StatusBadgeProps {
  children: ReactNode
  status?: keyof typeof variants
}

export function StatusBadge({ children, status = 'neutral' }: StatusBadgeProps) {
  return <Badge variant={variants[status]}>{children}</Badge>
}
