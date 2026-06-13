import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface RevealProps {
  q: string
  children: ReactNode
}

export function Reveal({ q, children }: RevealProps) {
  return (
    <details className="group my-2.5 max-w-[76ch] rounded-lg border bg-card transition-colors hover:border-input">
      <summary className="flex cursor-pointer select-none list-none items-center gap-2 px-4 py-3 text-[14.5px] font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
        {q}
      </summary>
      <div className="border-t px-4 pb-3.5 pt-2.5 pl-10 text-[14.5px] [&_p]:mb-2">{children}</div>
    </details>
  )
}
