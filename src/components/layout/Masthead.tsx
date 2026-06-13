import type { ModuleDef, SectionDef } from '@/modules/types'

interface MastheadProps {
  module: ModuleDef
  section: SectionDef
  index: number
}

export function Masthead({ module, section, index }: MastheadProps) {
  return (
    <header className="relative mb-8">
      {/* oversized chapter number — the handbook's running head */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-7 right-0 select-none font-display text-[120px] font-light leading-none text-foreground/[0.05]"
      >
        {String(index).padStart(2, '0')}
      </div>
      <div className="mb-2 font-mono text-meta uppercase tracking-[0.14em] text-primary">
        {section.label} · {String(index).padStart(2, '0')}
      </div>
      <h2 className="max-w-[26ch] font-display text-[38px] font-semibold leading-[1.12] tracking-tight [font-variation-settings:'opsz'_72]">
        {module.title}
      </h2>
      <div className="mt-2 max-w-[70ch] text-lead text-muted-foreground">{module.subtitle}</div>
    </header>
  )
}
