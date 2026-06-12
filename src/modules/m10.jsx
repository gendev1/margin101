// m10 — Corpus drills: real cases from limen's verification corpus.
// Every answer was oracle-derived from the Cboe manual / FINRA 4210 and
// mutation-validated in the limen repo. The app never computes an answer;
// it only checks yours against the corpus. Regenerate the data with:
//   bun scripts/extract-drills.mjs
import { useEffect, useMemo, useState } from 'react'
import { Reveal, Formula } from '../components/ui.jsx'
import PayoffChart from '../components/PayoffChart.jsx'
import DRILLS from '../data/corpus-drills.json'
import { loadDrills, recordDrill, accuracy, DAILY_GOAL } from '../lib/store.js'

const VERDICTS = [
  ['match', 'priced', 'a rule matched and produced numbers'],
  ['not_permitted', 'not permitted', 'rule matched; this account type cannot hold it as-is'],
  ['no_rule', 'no rule', 'no rule shape matched — outside coverage'],
  ['requires_error', 'requires error', 'rule matched but the data fails its preconditions'],
  ['invalid_position', 'invalid position', 'global validation rejected it before any rule ran'],
  ['eval_error', 'eval error', 'engine-level failure (rates miss, unsound MPL...)'],
]

const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

// Map a corpus position to PayoffChart legs; null when not chartable.
function chartLegs(p) {
  const legs = p.legs ?? []
  if (!legs.length) return null
  const out = []
  for (const l of legs) {
    const side = l.side === 'short' ? -1 : 1
    if (l.option_type && Number.isFinite(l.K) && Number.isFinite(l.P)) {
      out.push({ kind: l.option_type, side, K: l.K, P: l.P, qty: l.qty ?? 1, mult: l.mult ?? 100 })
    } else if (l.shares && Number.isFinite(p.U)) {
      out.push({ kind: 'stock', side, basis: p.U, shares: l.shares })
    } else {
      return null
    }
  }
  return out
}

function chartRange(legs, U) {
  const ks = legs.filter(l => l.kind !== 'stock').map(l => l.K)
  const lo = Math.min(...ks, U), hi = Math.max(...ks, U)
  return [Math.max(0, lo * 0.65), hi * 1.4]
}

function LegRow({ leg }) {
  const bits = []
  if (leg.kind === 'stock' || leg.shares) {
    bits.push(`${leg.shares} shares`)
    if (leg.short_sale_proceeds) bits.push(`sale proceeds $${fmt(leg.short_sale_proceeds)}`)
    if (leg.sale_price) bits.push(`sold @ ${leg.sale_price}`)
  } else {
    bits.push(`K=${leg.K}`, `P=${leg.P}`, `P0=${leg.P0}`, `qty ${leg.qty ?? 1} × mult ${leg.mult ?? 100}`)
    if (leg.style) bits.push(leg.style)
    if (leg.venue) bits.push(leg.venue)
    if (leg.expiration) bits.push(`exp ${leg.expiration}`)
    if (leg.time_to_expiration_months) bits.push(`${leg.time_to_expiration_months}mo`)
  }
  return (
    <tr>
      <td><span className={leg.side === 'short' ? 'side-short' : 'side-long'}>{leg.side}</span>{' '}
        {leg.option_type ?? leg.kind}</td>
      <td>{bits.join(' · ')}</td>
    </tr>
  )
}

function PositionCard({ d, showChart }) {
  const p = d.position
  const legs = showChart ? chartLegs(p) : null
  const range = legs ? chartRange(legs, p.U) : null
  return (
    <div className="panel drill-position-card">
      <div className="position-meta">
        <span>U <b>${fmt(p.U)}</b></span>
        <span>class <b>{p.class}</b>{p.lev && p.lev !== 1 ? <> · lev <b>{p.lev}</b></> : null}</span>
        <span><b>{d.account}</b> account</span>
        <span><b>{d.phase}</b></span>
      </div>
      <table className="position-table">
        <tbody>{(p.legs ?? []).map((leg, i) => <LegRow key={i} leg={leg} />)}</tbody>
      </table>
      {legs && (
        <div style={{ marginTop: 12 }}>
          <PayoffChart legs={legs} lo={range[0]} hi={range[1]} height={180} showTail
            annotations={[{ u: p.U, label: 'U now' }]} />
        </div>
      )}
      <div className="corpus-tag">corpus · {d.family} · {d.name}</div>
    </div>
  )
}

function Hud({ stats, run, session }) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayN = stats.today?.date === todayKey ? stats.today.n : 0
  const total = (stats.byKind?.compute?.total ?? 0) + (stats.byKind?.verdict?.total ?? 0)
  const right = (stats.byKind?.compute?.right ?? 0) + (stats.byKind?.verdict?.right ?? 0)
  return (
    <div className="drill-hud">
      <div className="hudcard">
        <div className="k">today</div>
        <div className={'v' + (todayN >= DAILY_GOAL ? ' goal' : '')}>{todayN}<span className="sub">/{DAILY_GOAL}</span></div>
        <div className="goalbar"><div style={{ width: Math.min(100, todayN / DAILY_GOAL * 100) + '%' }} /></div>
      </div>
      <div className="hudcard">
        <div className="k">streak</div>
        <div className={'v' + (run >= 5 ? ' flame' : '')}>{run >= 3 ? '🔥 ' : ''}{run}</div>
        <div className="sub">best {stats.bestRun ?? 0}</div>
      </div>
      <div className="hudcard">
        <div className="k">session</div>
        <div className="v">{session.right}<span className="sub">/{session.total}</span></div>
      </div>
      <div className="hudcard">
        <div className="k">all-time</div>
        <div className="v">{total ? Math.round(right / total * 100) + '%' : '—'}</div>
        <div className="sub">{total} answered</div>
      </div>
    </div>
  )
}

function FamilyChips({ families, family, setFamily, stats }) {
  const cls = pct => (pct === null ? '' : pct >= 85 ? 'hi' : pct >= 60 ? 'mid' : 'lo')
  return (
    <div className="famchips">
      <button className={'famchip' + (family === 'all' ? ' sel' : '')} onClick={() => setFamily('all')}>
        all
      </button>
      {families.map(f => {
        const pct = accuracy(stats.byFamily?.[f])
        return (
          <button key={f} className={'famchip' + (family === f ? ' sel' : '')} onClick={() => setFamily(f)}>
            {f}{pct !== null && <span className={'acc ' + cls(pct)}>{pct}%</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function M10() {
  const [tab, setTab] = useState('compute')
  const [stats, setStats] = useState(loadDrills)
  const [run, setRun] = useState(0)
  const [session, setSession] = useState({ right: 0, total: 0 })
  const [family, setFamily] = useState('all')
  const [showChart, setShowChart] = useState(true)

  const families = useMemo(() => [...new Set(DRILLS.compute.map(c => c.family))].sort(), [])

  const pool = useMemo(() => {
    const src = tab === 'compute' ? DRILLS.compute : DRILLS.verdict
    return family === 'all' ? src : src.filter(c => c.family === family)
  }, [tab, family])

  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState('')
  const [graded, setGraded] = useState(null)
  const [picked, setPicked] = useState(null)

  useEffect(() => { setIdx(Math.floor(Math.random() * Math.max(1, pool.length))) }, [pool])

  const d = pool.length ? pool[idx % pool.length] : null

  const score = right => {
    const nextRun = right ? run + 1 : 0
    setRun(nextRun)
    setSession(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStats(recordDrill({ kind: tab, family: d.family, right, run: nextRun }))
  }

  const next = () => {
    setIdx(Math.floor(Math.random() * pool.length))
    setGuess(''); setGraded(null); setPicked(null)
  }

  const grade = () => {
    const got = parseFloat(guess.replace(/[$,\s]/g, ''))
    const right = Number.isFinite(got) && Math.abs(got - d.requirement) <= 0.01
    setGraded(right)
    score(right)
  }

  const pick = key => {
    if (picked !== null) return
    setPicked(key)
    score(key === d.outcome)
  }

  // keyboard: 1-6 pick verdicts; Enter/n advances after feedback
  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if (tab === 'verdict' && picked === null && /^[1-6]$/.test(e.key)) {
        pick(VERDICTS[parseInt(e.key, 10) - 1][0])
      } else if ((e.key === 'Enter' || e.key === 'n') && (picked !== null || graded !== null)) {
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const scoreLine = kind => {
    const v = stats.byKind?.[kind]
    return v?.total ? `${v.right}/${v.total} · ${Math.round(v.right / v.total * 100)}%` : 'no attempts yet'
  }

  if (!d) return <p>No drills in this family.</p>

  return (
    <>
      <Hud stats={stats} run={run} session={session} />

      <div className="drill-tabs">
        <button className={'drill-tab' + (tab === 'compute' ? ' active' : '')}
          onClick={() => { setTab('compute'); setGuess(''); setGraded(null); setPicked(null) }}>
          <span className="tab-label">Compute the number</span>
          <span className="tab-score">{scoreLine('compute')}</span>
        </button>
        <button className={'drill-tab' + (tab === 'verdict' ? ' active' : '')}
          onClick={() => { setTab('verdict'); setGuess(''); setGraded(null); setPicked(null) }}>
          <span className="tab-label">Name the verdict</span>
          <span className="tab-score">{scoreLine('verdict')}</span>
        </button>
      </div>

      <FamilyChips families={families} family={family} setFamily={setFamily} stats={stats} />

      <div className="btnrow" style={{ marginTop: 0 }}>
        <button className={'btn' + (showChart ? ' active' : '')} onClick={() => setShowChart(s => !s)}>
          {showChart ? 'payoff: on' : 'payoff: off'}
        </button>
        <span className="kbd-hint">
          {tab === 'verdict' ? 'keys 1–6 answer · enter next' : 'enter checks · enter again for next'}
        </span>
      </div>

      <section className="drill-shell">
        <PositionCard d={d} showChart={showChart && tab === 'compute'} />

        {tab === 'compute' ? (
          <>
            <div className="drill-answer-row">
              <label className="field grow">
                <span>Gross requirement ($)</span>
                <input value={guess} autoFocus
                  onChange={e => setGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (graded === null ? guess.trim() && grade() : next())}
                  placeholder="your number" inputMode="decimal" />
              </label>
              {graded === null
                ? <button className="btn drill-cta" onClick={grade} disabled={!guess.trim()}>check</button>
                : <button className="btn drill-cta active" onClick={next}>next →</button>}
            </div>
            {graded !== null && (
              <div className={'drill-feedback ' + (graded ? 'correct' : 'wrong')}>
                <div className="feedback-head">{graded ? `Correct${run >= 3 ? ` — ${run} in a row` : ''}` : 'Not quite'}</div>
                <p>
                  Rule <b>{d.rule}</b>: requirement <b>${fmt(d.requirement)}</b>, proceeds ${fmt(d.proceeds)},
                  cash call ${fmt(d.cashCall)}.
                  {d.depositKind ? <> Deposit: <b>{d.depositKind}</b>.</> : null}
                </p>
                {!graded && <div className="runline">streak reset — best is still <b>{stats.bestRun}</b></div>}
              </div>
            )}
            <Reveal q="Stuck? Re-derive it">
              <Formula>{
`1. Which rule shape is this? (${d.rule})
2. ${d.phase === 'initial' ? 'Initial → use P0 (entry premium)' : 'Maintenance → use P (current premium)'}
3. ${d.account === 'cash' ? 'Cash account → full collateral (strike / underlying / pay-in-full)' : 'Margin account → premium + max(20% basic, 10% floor); MPL for spreads'}
4. Dollar terms are per-share × qty × mult; proceeds = short premium received.`}
              </Formula>
            </Reveal>
          </>
        ) : (
          <>
            <div className="verdict-grid">
              {VERDICTS.map(([key, label], i) => {
                let state = ''
                if (picked !== null) {
                  if (key === d.outcome) state = ' correct'
                  else if (key === picked) state = ' wrong'
                  else state = ' muted'
                }
                return (
                  <button key={key} className={'btn verdict-btn' + state} onClick={() => pick(key)}>
                    <span className="kbd">{i + 1}</span>{label}
                  </button>
                )
              })}
            </div>
            {picked !== null && (
              <div className={'drill-feedback ' + (picked === d.outcome ? 'correct' : 'wrong')}>
                <div className="feedback-head">
                  {picked === d.outcome ? `Correct${run >= 3 ? ` — ${run} in a row` : ''}` : 'Wrong bucket'}
                </div>
                <p>
                  This is <b>{VERDICTS.find(v => v[0] === d.outcome)[1]}</b>:{' '}
                  {VERDICTS.find(v => v[0] === d.outcome)[2]}.
                  {d.rule ? <> Rule: <b>{d.rule}</b>.</> : null}
                  {d.errContains ? <> Error mentions <i>“{d.errContains.join('”, “')}”</i>.</> : null}
                </p>
                <div className="btnrow">
                  <button className="btn drill-cta active" onClick={next}>next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Reveal q="Why these two drill types?">
        <p>
          <b>Compute</b> trains the formulas from the mechanics modules. <b>Verdict</b> trains the
          outcome taxonomy from <a href="#m6">the engine</a>. A future corpus finding is always some combination of those two
          failures: the engine got the number wrong, or it put the case in the wrong bucket. The
          family chips show your accuracy per family — the red ones are tomorrow's first drills.
        </p>
      </Reveal>
    </>
  )
}
