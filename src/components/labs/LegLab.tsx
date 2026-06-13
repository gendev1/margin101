import { useState } from 'react'

import PayoffChart from '@/components/PayoffChart'
import { Panel, Slider, Stat, Stats } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { fmt, type OptionLeg } from '@/lib/payoff'

// Module 1: play with one leg — the four atoms.
const PRESETS: Record<string, Pick<OptionLeg, 'kind' | 'side'>> = {
  'Long call': { kind: 'call', side: 1 },
  'Short call': { kind: 'call', side: -1 },
  'Long put': { kind: 'put', side: 1 },
  'Short put': { kind: 'put', side: -1 },
}

export function LegLab() {
  const [preset, setPreset] = useState('Long call')
  const [K, setK] = useState(100)
  const [P, setP] = useState(5)
  const leg: OptionLeg = { ...PRESETS[preset], K, P, qty: 1, mult: 100 }
  return (
    <Panel title="Leg lab — one contract, payoff at expiration">
      <div className="my-3 flex flex-wrap items-center gap-2">
        {Object.keys(PRESETS).map(name => (
          <Button key={name} variant={preset === name ? 'default' : 'secondary'} onClick={() => setPreset(name)}>
            {name}
          </Button>
        ))}
      </div>
      <Slider label="K (strike)" value={K} onChange={setK} min={60} max={140} money />
      <Slider label="P (premium/share)" value={P} onChange={setP} min={0.5} max={20} step={0.5} money />
      <PayoffChart legs={[leg]} lo={40} hi={170} showTail
        title={`${preset} — K=${K}, premium $${P} × 100 shares`} />
      <Stats>
        <Stat k="Worst case" tone="bad" v={
          leg.side === 1 ? fmt(P * 100)
            : leg.kind === 'call' ? 'unbounded'
            : fmt((K - P) * 100)
        } note={leg.side === 1 ? 'premium paid, nothing more' : leg.kind === 'call' ? 'U has no ceiling' : 'stock can only fall to $0'} />
        <Stat k="Best case" tone="good" v={
          leg.side === -1 ? fmt(P * 100)
            : leg.kind === 'call' ? 'unbounded'
            : fmt((K - P) * 100)
        } note={leg.side === -1 ? 'keep the premium' : ''} />
        <Stat k="Breakeven" tone="accent" v={'$' + (leg.kind === 'call' ? K + P : K - P)} />
      </Stats>
    </Panel>
  )
}
