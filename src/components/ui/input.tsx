import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-card px-3.5 py-2 font-mono text-[15px] text-foreground transition-[border-color,box-shadow] outline-none',
        'placeholder:text-muted-foreground/60',
        'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { Input }
