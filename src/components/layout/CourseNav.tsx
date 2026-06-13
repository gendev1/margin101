import { ArrowLeft, ArrowRight } from 'lucide-react'

import type { ModuleDef } from '@/modules/types'

interface CourseNavProps {
  prev: ModuleDef | null
  next: ModuleDef | null
}

function NavCard({ module, dir }: { module: ModuleDef; dir: 'prev' | 'next' }) {
  const next = dir === 'next'
  return (
    <a
      href={`#${module.id}`}
      className={`group block min-w-[200px] rounded-lg border bg-card px-4.5 py-3 transition-all hover:-translate-y-px hover:border-primary ${next ? 'text-right' : ''}`}
    >
      <span className={`flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 ${next ? 'justify-end' : ''}`}>
        {!next && <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />}
        {next ? 'Next' : 'Previous'}
        {next && <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />}
      </span>
      <strong className="text-[14.5px]">{module.title}</strong>
    </a>
  )
}

export function CourseNav({ prev, next }: CourseNavProps) {
  return (
    <div className="mt-14 flex justify-between gap-3">
      {prev ? <NavCard module={prev} dir="prev" /> : <div />}
      {next ? <NavCard module={next} dir="next" /> : <div />}
    </div>
  )
}
