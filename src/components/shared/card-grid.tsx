import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Responsive auto-fit card grid — the one place the repeated
// grid-cols-[repeat(auto-fit,minmax(N,1fr))] pattern lives.
const MIN: Record<string, string> = {
  sm: 'grid-cols-[repeat(auto-fit,minmax(130px,1fr))]',
  md: 'grid-cols-[repeat(auto-fit,minmax(190px,1fr))]',
  lg: 'grid-cols-[repeat(auto-fit,minmax(215px,1fr))]',
  xl: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
  '2xl': 'grid-cols-[repeat(auto-fit,minmax(260px,1fr))]',
}

interface CardGridProps {
  min?: keyof typeof MIN
  gap?: string
  className?: string
  children: ReactNode
}

export function CardGrid({ min = '2xl', gap = 'gap-3', className, children }: CardGridProps) {
  return <div className={cn('grid', MIN[min], gap, className)}>{children}</div>
}
