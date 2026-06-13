import { useState } from 'react'

import { Panel, Slider, Stat, Stats } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { fmt, shortCallReq, shortPutReq } from '@/lib/payoff'

// Module 2: the naked-short 20%/10% formula, live.
export function ShortOptionCalc() {
  const [type, setType] = useState<'put' | 'call'>('put')
  const [cls, setCls] = useState<'equity' | 'broad'>('equity')
  const [U, setU] = useState(95)
  const [K, setK] = useState(80)
  const [P, setP] = useState(2)
  const rates = cls === 'equity' ? { base: 0.20, min: 0.10 } : { base: 0.15, min: 0.10 }
  const r = type === 'put'
    ? shortPutReq({ U, K, P, ...rates })
    : shortCallReq({ U, K, P, ...rates })
  const basePctTxt = (rates.base * 100) + '%'
  const otmDesc = type === 'put' ? 'max(0, U − K)' : 'max(0, K − U)'
  const minDesc = type === 'put' ? `10% × K = ${fmt(rates.min * K * 100)}` : `10% × U = ${fmt(rates.min * U * 100)}`

  const maxBar = Math.max(r.basic, r.minimum, 1)
  const barW = (v: number) => Math.max(2, (v / maxBar) * 100)

  return (
    <Panel title="Naked short option — requirement calculator (rule: short_put_uncovered / short_call_uncovered)">
      <div className="my-3 flex flex-wrap items-center gap-2">
        <Button variant={type === 'put' ? 'default' : 'secondary'} onClick={() => setType('put')}>Short put</Button>
        <Button variant={type === 'call' ? 'default' : 'secondary'} onClick={() => setType('call')}>Short call</Button>
        <Button variant={cls === 'equity' ? 'default' : 'secondary'} onClick={() => setCls('equity')}>equity (20/10)</Button>
        <Button variant={cls === 'broad' ? 'default' : 'secondary'} onClick={() => setCls('broad')}>broad index (15/10)</Button>
      </div>
      <Slider label="U (underlying)" value={U} onChange={setU} min={10} max={150} money />
      <Slider label="K (strike)" value={K} onChange={setK} min={10} max={150} money />
      <Slider label="P (premium/share)" value={P} onChange={setP} min={0.05} max={15} step={0.05} money />

      <div className="my-3.5">
        <div className="mb-1.5 text-[13px] text-muted-foreground">
          The engine takes the <b className="text-foreground">greater</b> of two branches, then adds the premium:
        </div>
        {[
          { name: `basic: ${basePctTxt} × U − OTM (${otmDesc})`, v: r.basic, binds: r.binds === 'basic' },
          { name: `minimum floor: ${minDesc}`, v: r.minimum, binds: r.binds === 'minimum' },
        ].map(b => (
          <div key={b.name} className="my-1.5 flex items-center gap-2.5">
            <div
              className={`h-[22px] max-w-[55%] rounded-[5px] transition-[width] duration-150 ${b.binds ? 'bg-primary' : 'bg-secondary'}`}
              style={{ width: barW(b.v) + '%' }}
            />
            <span className={`font-mono text-cap tabular-nums ${b.binds ? 'text-foreground' : 'text-muted-foreground'}`}>
              {b.name} = {fmt(b.v)} {b.binds && '← binds'}
            </span>
          </div>
        ))}
      </div>

      <Stats>
        <Stat k="OTM offset" v={fmt(r.otm)} note="credit for distance out of the money" />
        <Stat k="Premium added" v={fmt(r.premium)} />
        <Stat k="Requirement" tone="accent" v={fmt(r.total)}
          note="premium + max(basic, minimum)" />
      </Stats>
    </Panel>
  )
}
