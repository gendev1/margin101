import { Check } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { DoneMap } from '@/lib/store'
import type { ModuleDef, SectionWithModules } from '@/modules/types'

interface SidebarProps {
  sections: SectionWithModules[]
  modules: ModuleDef[]
  currentId: string
  done: DoneMap
}

export function Sidebar({ sections, modules, currentId, done }: SidebarProps) {
  const trackable = modules.filter(m => m.trackable !== false)
  const doneCount = trackable.filter(m => done[m.id]).length

  return (
    <nav className="scrollbar-thin sticky top-0 z-10 h-screen w-[272px] shrink-0 overflow-y-auto border-r bg-sidebar px-3 pb-8 pt-5 max-[880px]:static max-[880px]:h-auto max-[880px]:w-full">
      <div className="px-2.5 pb-3.5">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">
          margin<span className="text-primary">101</span>
        </h1>
        <div className="mt-0.5 text-xs leading-normal text-muted-foreground">
          the living handbook of the limen margin system
        </div>
      </div>

      <div className="mx-0.5 mb-4 rounded-xl border bg-card px-3.5 py-3">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">progress</span>
          <span className="font-mono tabular-nums">
            <b className="text-foreground">{doneCount}</b>
            <span className="text-muted-foreground">/{trackable.length} modules</span>
          </span>
        </div>
        <Progress value={trackable.length ? (doneCount / trackable.length) * 100 : 0} />
      </div>

      {sections.map(sec => (
        <div key={sec.id} className="mb-3.5">
          <div className="mb-1 px-2.5 text-label eyebrow text-muted-foreground/70">
            {sec.label}
          </div>
          <div className="grid gap-px">
            {sec.modules.map(m => {
              const n = modules.findIndex(x => x.id === m.id)
              const active = currentId === m.id
              return (
                <a
                  key={m.id}
                  href={`#${m.id}`}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-[7px] text-data text-muted-foreground transition-colors',
                    'hover:bg-card hover:text-foreground',
                    active && 'border-primary/25 bg-primary/10 text-foreground'
                  )}
                >
                  <span className={cn('min-w-5 font-mono text-label tabular-nums text-muted-foreground/70', active && 'text-primary')}>
                    {String(n).padStart(2, '0')}
                  </span>
                  <span className="font-medium leading-tight">{m.title}</span>
                  {done[m.id] && <Check className="ml-auto size-3.5 shrink-0 text-good" strokeWidth={3} />}
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
