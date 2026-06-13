import type { ReactNode } from 'react'

export function Formula({ children }: { children: ReactNode }) {
  return (
    <pre className="my-3.5 mb-5 overflow-x-auto whitespace-pre rounded-lg border bg-ink px-5 py-4 font-mono text-[13px] leading-[1.85] text-primary/80 [&_.hl]:text-warn">
      {children}
    </pre>
  )
}
