import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ForkProps {
  q: ReactNode
  status?: string
  order?: string
  children?: ReactNode
}

// The undecided-fork mirror of <Decision>: a still-open question the reader
// will have to resolve, framed prominently instead of retold as settled.
export function Fork({ q, status, order, children }: ForkProps) {
  return (
    <div className="my-5 rounded-xl border border-input bg-[linear-gradient(135deg,_color-mix(in_oklch,var(--primary)_9%,transparent),_transparent_62%)] bg-card p-5">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <span className="eyebrow text-label text-primary">Open fork</span>
        {order && <Badge variant="accent">{order}</Badge>}
        {status && <Badge variant="warn">{status}</Badge>}
      </div>
      <p className="font-display text-[22px] font-medium leading-snug tracking-tight text-foreground [font-variation-settings:'opsz'_36]">
        {q}
      </p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

export function Options({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5">
      {children}
    </div>
  )
}

interface OptionProps {
  name: string
  lean?: boolean
  children: ReactNode
}

export function Option({ name, lean = false, children }: OptionProps) {
  return (
    <div className={cn('rounded-lg border bg-card px-4 py-3', lean ? 'border-good/45' : 'border-border')}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-note font-semibold">{name}</span>
        {lean && <Badge variant="good">leaning</Badge>}
      </div>
      <div className="text-data text-muted-foreground [&_p:last-child]:mb-0 [&_p]:mb-1.5">{children}</div>
    </div>
  )
}

// The signature of a live fork: what you must settle before any code.
export function OpenQuestions({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 max-w-[78ch] rounded-lg border border-l-[3px] border-l-warn bg-warn/8 px-4.5 py-3">
      <div className="mb-1.5 flex items-center gap-2 text-warn">
        <CircleHelp className="size-4" />
        <span className="eyebrow text-label">Unresolved — settle before building</span>
      </div>
      <div className="[&_ul]:mb-0 [&_ul]:mt-1">{children}</div>
    </div>
  )
}
