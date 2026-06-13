import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type CalloutKind = 'note' | 'warn' | 'tip'

interface CalloutProps {
  kind?: CalloutKind
  label?: string
  children: ReactNode
}

const STYLES: Record<CalloutKind, { box: string; label: string; fallback: string }> = {
  note: { box: 'border-l-primary bg-primary/8', label: 'text-primary', fallback: 'Note' },
  warn: { box: 'border-l-destructive bg-destructive/8', label: 'text-destructive', fallback: 'Trap' },
  tip: { box: 'border-l-good bg-good/8', label: 'text-good', fallback: 'Mental model' },
}

export function Callout({ kind = 'note', label, children }: CalloutProps) {
  const s = STYLES[kind]
  return (
    <div
      className={cn(
        'my-4 mb-5 max-w-[76ch] rounded-lg border border-l-[3px] px-4.5 py-3 text-[15px] [&_p]:mb-1.5 [&_p:last-child]:mb-0',
        s.box
      )}
    >
      <span className={cn('mb-1 block text-[10.5px] font-bold uppercase tracking-[0.12em]', s.label)}>
        {label ?? s.fallback}
      </span>
      {children}
    </div>
  )
}
