import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-muted-foreground',
        accent: 'border-primary/30 bg-primary/10 text-primary',
        good: 'border-good/30 bg-good/10 text-good',
        warn: 'border-warn/30 bg-warn/10 text-warn',
        bad: 'border-destructive/30 bg-destructive/10 text-destructive',
        outline: 'border-input bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
