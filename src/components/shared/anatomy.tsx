import type { ReactNode } from 'react'

// Definition-card grid: a symbol, its name, and a plain-words description.
export function Anatomy({ children }: { children: ReactNode }) {
  return <div className="my-4 grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-2.5">{children}</div>
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
      <div className="text-[12.5px] leading-relaxed text-muted-foreground">{desc}</div>
    </div>
  )
}
