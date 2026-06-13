import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Dollars-in / dollars-out table with a ruled total line.
export function Ledger({ children }: { children: ReactNode }) {
  return <div className="max-w-[460px] font-mono text-[13px] tabular-nums">{children}</div>
}

interface LedgerRowProps {
  label: ReactNode
  value: ReactNode
  tone?: 'pos' | 'neg'
  total?: boolean
}

export function LedgerRow({ label, value, tone, total = false }: LedgerRowProps) {
  return (
    <div
      className={cn(
        'flex justify-between gap-4 py-1.5',
        total ? 'border-t-2 border-input pt-2.5 font-bold' : 'border-b border-dashed'
      )}
    >
      <span>{label}</span>
      <span className={cn(tone === 'pos' && 'text-good', tone === 'neg' && 'text-destructive')}>{value}</span>
    </div>
  )
}
