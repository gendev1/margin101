import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type StatTone = 'good' | 'bad' | 'accent' | 'amber'

const TONES: Record<StatTone, string> = {
  good: 'text-good',
  bad: 'text-destructive',
  accent: 'text-primary',
  amber: 'text-warn',
}

interface StatProps {
  k: string
  v: ReactNode
  note?: ReactNode
  tone?: StatTone
}

export function Stat({ k, v, note, tone }: StatProps) {
  return (
    <div className="min-w-[145px] rounded-lg border bg-secondary/60 px-4 py-2.5">
      <div className="text-label font-semibold uppercase tracking-[0.08em] text-muted-foreground">{k}</div>
      <div className={cn('mt-0.5 font-mono text-xl tabular-nums', tone && TONES[tone])}>{v}</div>
      {note && <div className="mt-0.5 text-meta text-muted-foreground">{note}</div>}
    </div>
  )
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="my-3.5 flex flex-wrap gap-3">{children}</div>
}
