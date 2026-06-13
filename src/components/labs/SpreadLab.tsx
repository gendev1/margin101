import { useState } from 'react'

import PayoffChart from '@/components/PayoffChart'
import { Panel, Slider, Stat, Stats } from '@/components/shared'
import { fmt, mplIntrinsic, shortCallReq, type Leg } from '@/lib/payoff'

// Module 3: vertical spread — naked requirement vs MPL, who wins.
export function SpreadLab() {
  const [Klong, setKlong] = useState(125)
  const [Kshort, setKshort] = useState(120)
  const [U, setU] = useState(128.5)
  const Plong = 3.8, Pshort = 8.4
  const legs: Leg[] = [
    { kind: 'call', side: 1, K: Klong, P: Plong, qty: 1, mult: 100 },
    { kind: 'call', side: -1, K: Kshort, P: Pshort, qty: 1, mult: 100 },
  ]
  const mpl = mplIntrinsic(legs)
  const naked = shortCallReq({ U, K: Kshort, P: Pshort })
  const grossEngine = Math.min(naked.total, mpl) + Plong * 100
  const proceeds = Pshort * 100
  const cash = grossEngine - proceeds
  return (
    <Panel title="Spread lab — vertical call spread (rule: vertical_spread)">
      <Slider label="K long call" value={Klong} onChange={setKlong} min={100} max={150} money />
      <Slider label="K short call" value={Kshort} onChange={setKshort} min={100} max={150} money />
      <Slider label="U (underlying)" value={U} onChange={setU} min={100} max={150} step={0.5} money />
      <PayoffChart legs={legs} lo={95} hi={160} showTail
        title={`long ${Klong}C @ $${Plong} / short ${Kshort}C @ $${Pshort}`} />
      <Stats>
        <Stat k="MPL (intrinsic max loss)" tone="amber" v={fmt(mpl)}
          note={Klong > Kshort ? `strike gap ${Klong - Kshort} × 100` : 'long strike below short: no structural loss'} />
        <Stat k="Naked short-call req" v={fmt(naked.total)} note="what the short leg costs alone" />
        <Stat k="Gross requirement" tone="accent" v={fmt(grossEngine)} note="min(naked, MPL) + long premium" />
        <Stat k="Cash call" tone={cash > 0 ? 'bad' : 'good'} v={fmt(cash)} note={`gross − short proceeds ${fmt(proceeds)}`} />
      </Stats>
    </Panel>
  )
}
