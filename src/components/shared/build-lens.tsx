import type { ReactNode } from 'react'

interface BuildLensProps {
  title?: string
  children: ReactNode
}

export function BuildLens({ title = 'Build-Next Lens', children }: BuildLensProps) {
  return (
    <div className="my-4.5 mb-5 max-w-[78ch] rounded-xl border border-input bg-[linear-gradient(135deg,_color-mix(in_oklch,var(--warn)_10%,transparent),_transparent_60%)] bg-card px-5 py-4">
      <div className="mb-2 text-[11px] eyebrow text-warn">{title}</div>
      {children}
    </div>
  )
}
