import * as React from 'react'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value = 0,
  barClassName,
  ...props
}: React.ComponentProps<'div'> & { value?: number; barClassName?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-primary to-good transition-[width] duration-400',
          barClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export { Progress }
