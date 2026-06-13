import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PanelProps {
  title?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({ title, children, className }: PanelProps) {
  return (
    <Card className={cn('my-4 mb-5', className)}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? 'pt-1' : 'pt-4'}>{children}</CardContent>
    </Card>
  )
}
