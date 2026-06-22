import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type FindingKind = 'under-margin' | 'over-margin' | 'taxonomy' | 'dead-guard' | 'scope-gap'

const KIND: Record<FindingKind, { variant: 'bad' | 'warn' | 'accent' | 'default'; label: string }> = {
  'under-margin': { variant: 'bad', label: 'under-margin' },
  'over-margin': { variant: 'warn', label: 'over-margin' },
  taxonomy: { variant: 'accent', label: 'taxonomy' },
  'dead-guard': { variant: 'default', label: 'dead guard' },
  'scope-gap': { variant: 'default', label: 'scope gap' },
}

interface FindingProps {
  id: string
  kind?: FindingKind
  pin?: string
  children: ReactNode
}

// One corpus audit finding, taught as a case study: the id, its severity
// class, and the test that pins the current (wrong) behavior.
export function Finding({ id, kind = 'under-margin', pin, children }: FindingProps) {
  const k = KIND[kind] ?? KIND['under-margin']
  return (
    <div className="my-4 max-w-[80ch] rounded-xl border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-data font-bold text-foreground">{id}</span>
        <Badge variant={k.variant}>{k.label}</Badge>
        {pin && <span className="font-mono text-meta text-muted-foreground/70">pinned · {pin}</span>}
      </div>
      <div className="[&_p:last-child]:mb-0 [&_p]:mb-1.5">{children}</div>
    </div>
  )
}

// A dependency-ordered build sequence: numbered steps on a spine, with hard
// gates called out.
export function Path({ children }: { children: ReactNode }) {
  return <div className="my-5 flex flex-col">{children}</div>
}

interface StepProps {
  n: ReactNode
  title: ReactNode
  gate?: boolean
  children: ReactNode
}

export function Step({ n, title, gate = false, children }: StepProps) {
  return (
    <div className="relative flex gap-4 pb-5 last:pb-0">
      <div className="absolute bottom-1 left-[15px] top-9 w-px bg-border" />
      <div
        className={cn(
          'z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-data font-semibold',
          gate ? 'border-warn bg-warn/10 text-warn' : 'border-input bg-card text-muted-foreground'
        )}
      >
        {n}
      </div>
      <div className="pt-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          {title}
          {gate && <Badge variant="warn">hard gate</Badge>}
        </div>
        <div className="mt-1 max-w-[74ch] text-data text-muted-foreground [&_p:last-child]:mb-0 [&_p]:mb-1.5">{children}</div>
      </div>
    </div>
  )
}
