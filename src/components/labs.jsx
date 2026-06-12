import { useState } from 'react'
import PayoffChart from './PayoffChart.jsx'
import { Slider, Panel, Stats, Stat } from './ui.jsx'
import { shortCallReq, shortPutReq, mplIntrinsic, fmt } from '../lib/payoff.js'

// ---------------------------------------------------------------- LegLab
// Module 1: play with one leg — the four atoms.
const PRESETS = {
  'Long call':  { kind: 'call', side: 1 },
  'Short call': { kind: 'call', side: -1 },
  'Long put':   { kind: 'put', side: 1 },
  'Short put':  { kind: 'put', side: -1 },
}

export function LegLab() {
  const [preset, setPreset] = useState('Long call')
  const [K, setK] = useState(100)
  const [P, setP] = useState(5)
  const leg = { ...PRESETS[preset], K, P, qty: 1, mult: 100 }
  return (
    <Panel title="Leg lab — one contract, payoff at expiration">
      <div className="btnrow">
        {Object.keys(PRESETS).map(name => (
          <button key={name} className={'btn' + (preset === name ? ' active' : '')}
            onClick={() => setPreset(name)}>{name}</button>
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

// ------------------------------------------------------- ShortOptionCalc
// Module 2: the naked-short 20%/10% formula, live.
export function ShortOptionCalc() {
  const [type, setType] = useState('put')
  const [cls, setCls] = useState('equity')
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
  const barW = v => Math.max(2, (v / maxBar) * 100)

  return (
    <Panel title="Naked short option — requirement calculator (rule: short_put_uncovered / short_call_uncovered)">
      <div className="btnrow">
        <button className={'btn' + (type === 'put' ? ' active' : '')} onClick={() => setType('put')}>Short put</button>
        <button className={'btn' + (type === 'call' ? ' active' : '')} onClick={() => setType('call')}>Short call</button>
        <button className={'btn' + (cls === 'equity' ? ' active' : '')} onClick={() => setCls('equity')}>equity (20/10)</button>
        <button className={'btn' + (cls === 'broad' ? ' active' : '')} onClick={() => setCls('broad')}>broad index (15/10)</button>
      </div>
      <Slider label="U (underlying)" value={U} onChange={setU} min={10} max={150} money />
      <Slider label="K (strike)" value={K} onChange={setK} min={10} max={150} money />
      <Slider label="P (premium/share)" value={P} onChange={setP} min={0.05} max={15} step={0.05} money />

      <div style={{ margin: '14px 0' }}>
        <div style={{ fontSize: 13, color: '#8fa3c4', marginBottom: 6 }}>
          The engine takes the <b>greater</b> of two branches, then adds the premium:
        </div>
        {[
          { name: `basic: ${basePctTxt} × U − OTM (${otmDesc})`, v: r.basic, binds: r.binds === 'basic' },
          { name: `minimum floor: ${minDesc}`, v: r.minimum, binds: r.binds === 'minimum' },
        ].map(b => (
          <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
            <div style={{
              width: barW(b.v) + '%', maxWidth: '55%', height: 22, borderRadius: 5,
              background: b.binds ? '#4cc3ff' : '#263352',
              transition: 'width .15s',
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: b.binds ? '#fff' : '#8fa3c4' }}>
              {b.name} = {fmt(b.v)} {b.binds && '← binds'}
            </span>
          </div>
        ))}
      </div>

      <Stats>
        <Stat k="OTM offset" v={fmt(r.otm)} note="credit for distance out of the money" />
        <Stat k="Premium added" v={fmt(r.premium)} />
        <Stat k="Requirement" tone="accent" v={fmt(r.total)}
          note={`premium + max(basic, minimum)`} />
      </Stats>
    </Panel>
  )
}

// ------------------------------------------------------------- SpreadLab
// Module 3: vertical spread — naked requirement vs MPL, who wins.
export function SpreadLab() {
  const [Klong, setKlong] = useState(125)
  const [Kshort, setKshort] = useState(120)
  const [U, setU] = useState(128.5)
  const Plong = 3.8, Pshort = 8.4
  const legs = [
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

// -------------------------------------------------------------- RatioLab
// Module 5: why is_limited_risk exists. A 1×2 ratio spread looks fine at
// the strikes and is catastrophic at U→∞. Zoom out to see it.
export function RatioLab() {
  const [zoom, setZoom] = useState('in')
  const legs = [
    { kind: 'call', side: 1, K: 100, P: 6, qty: 1, mult: 100 },
    { kind: 'call', side: -1, K: 110, P: 3, qty: 2, mult: 100 },
  ]
  const lo = 80
  const hi = zoom === 'in' ? 125 : 320
  return (
    <Panel title="Ratio lab — long 1× 100C, short 2× 110C (a net-short-call structure)">
      <div className="btnrow">
        <button className={'btn' + (zoom === 'in' ? ' active' : '')} onClick={() => setZoom('in')}>
          What the strikes show (U up to 125)
        </button>
        <button className={'btn' + (zoom === 'out' ? ' active' : '')} onClick={() => setZoom('out')}>
          Zoom out (U up to 320)
        </button>
      </div>
      <PayoffChart legs={legs} lo={lo} hi={hi} showTail
        title={zoom === 'in' ? 'Looks bounded… peak profit at K=110' : 'It was never bounded. One naked call survives past 110.'} />
      {zoom === 'in' ? (
        <p style={{ fontSize: 14, color: '#8fa3c4' }}>
          Evaluated only at the strikes (0, 100, 110), the worst loss looks like the small
          net premium. An MPL computed at existing strikes would say “limited risk.”
        </p>
      ) : (
        <p style={{ fontSize: 14, color: '#ff7b7b' }}>
          Past U=110 you are net short one uncovered call: every dollar of rally costs $100.
          At U→∞ the loss is unbounded. This is exactly the structure{' '}
          <code>is_limited_risk(legs)</code> exists to keep out of the catch-all rule.
        </p>
      )}
    </Panel>
  )
}
