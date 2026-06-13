import type { ReactNode } from 'react'

import { CardGrid } from './card-grid'

// Definition-card grid: a symbol, its name, and a plain-words description.
export function Anatomy({ children }: { children: ReactNode }) {
  return <CardGrid min="lg" gap="gap-2.5" className="my-4">{children}</CardGrid>
}

interface AnatomyCardProps {
  sym: string
  name: string
  desc: ReactNode
}

export function AnatomyCard({ sym, name, desc }: AnatomyCardProps) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="font-mono text-lg font-semibold text-primary">{sym}</div>
      <div className="mb-1 mt-px text-sm font-semibold">{name}</div>
      <div className="text-cap leading-relaxed text-muted-foreground">{desc}</div>
    </div>
  )
}
