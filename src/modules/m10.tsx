// m10 — Corpus drills: real cases from limen's verification corpus.
// Every answer was oracle-derived from the Cboe manual / FINRA 4210 and
// mutation-validated in the limen repo. The app never computes an answer;
// it only checks yours against the corpus. Regenerate the data with:
//   bun scripts/extract-drills.mjs
import { useEffect, useMemo, useState } from 'react'

import PayoffChart from '@/components/PayoffChart'
import { CardGrid, Formula, Reveal } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import RAW_DRILLS from '@/data/corpus-drills.json'
import { accuracy, DAILY_GOAL, loadDrills, recordDrill, type DrillKind, type DrillStats } from '@/lib/store'
import type { Leg } from '@/lib/payoff'
import { cn } from '@/lib/utils'

interface CorpusLeg {
  side: 'long' | 'short'
  kind?: string
  option_type?: 'call' | 'put'
  K?: number
  P?: number
  P0?: number
  qty?: number
  mult?: number
  style?: string
  venue?: string
  expiration?: string
  time_to_expiration_months?: number
  shares?: number
  short_sale_proceeds?: number
  sale_price?: number
}

interface CorpusPosition {
  U: number
  class: string
  lev?: number
  legs?: CorpusLeg[]
}

interface Drill {
  name: string
  family: string
  account: string
  phase: string
  position: CorpusPosition
  rule?: string
  requirement: number
  proceeds: number
  cashCall: number
  depositKind?: string
  outcome?: string
  errContains?: string[]
}

const DRILLS = RAW_DRILLS as unknown as { compute: Drill[]; verdict: Drill[] }

const VERDICTS: Array<[string, string, string]> = [
  ['match', 'priced', 'a rule matched and produced numbers'],
  ['not_permitted', 'not permitted', 'rule matched; this account type cannot hold it as-is'],
  ['no_rule', 'no rule', 'no rule shape matched — outside coverage'],
  ['requires_error', 'requires error', 'rule matched but the data fails its preconditions'],
  ['invalid_position', 'invalid position', 'global validation rejected it before any rule ran'],
  ['eval_error', 'eval error', 'engine-level failure (rates miss, unsound MPL...)'],
]

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

// Map a corpus position to PayoffChart legs; null when not chartable.
function chartLegs(p: CorpusPosition): Leg[] | null {
  const legs = p.legs ?? []
  if (!legs.length) return null
  const out: Leg[] = []
  for (const l of legs) {
    const side = l.side === 'short' ? -1 : 1
    if (l.option_type && Number.isFinite(l.K) && Number.isFinite(l.P)) {
      out.push({ kind: l.option_type, side, K: l.K!, P: l.P!, qty: l.qty ?? 1, mult: l.mult ?? 100 })
    } else if (l.shares && Number.isFinite(p.U)) {
      out.push({ kind: 'stock', side, basis: p.U, shares: l.shares })
    } else {
      return null
    }
  }
  return out
}

function chartRange(legs: Leg[], U: number): [number, number] {
  const ks = legs.filter(l => l.kind !== 'stock').map(l => (l as Extract<Leg, { K: number }>).K)
  const lo = Math.min(...ks, U), hi = Math.max(...ks, U)
  return [Math.max(0, lo * 0.65), hi * 1.4]
}

function LegRow({ leg }: { leg: CorpusLeg }) {
  const bits: string[] = []
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
    <tr className="border-b last:border-b-0">
      <td className="w-[130px] whitespace-nowrap py-1.5 pr-2.5 font-mono">
        <span className={cn('font-bold', leg.side === 'short' ? 'text-destructive' : 'text-good')}>{leg.side}</span>{' '}
        {leg.option_type ?? leg.kind}
      </td>
      <td className="py-1.5">{bits.join(' · ')}</td>
    </tr>
  )
}

function PositionCard({ d, showChart }: { d: Drill; showChart: boolean }) {
  const p = d.position
  const legs = showChart ? chartLegs(p) : null
  const range = legs ? chartRange(legs, p.U) : null
  return (
    <Card className="border-input bg-gradient-to-b from-secondary to-card px-5 py-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <MetaChip>U <b className="text-foreground">${fmt(p.U)}</b></MetaChip>
        <MetaChip>class <b className="text-foreground">{p.class}</b>{p.lev && p.lev !== 1 ? <> · lev <b className="text-foreground">{p.lev}</b></> : null}</MetaChip>
        <MetaChip><b className="text-foreground">{d.account}</b> account</MetaChip>
        <MetaChip><b className="text-foreground">{d.phase}</b></MetaChip>
      </div>
      <table className="w-full border-collapse text-data">
        <tbody>{(p.legs ?? []).map((leg, i) => <LegRow key={i} leg={leg} />)}</tbody>
      </table>
      {legs && range && (
        <div className="mt-3">
          <PayoffChart legs={legs} lo={range[0]} hi={range[1]} height={180} showTail
            annotations={[{ u: p.U, label: 'U now' }]} />
        </div>
      )}
      <div className="mt-2.5 font-mono text-label text-muted-foreground/70">
        corpus · {d.family} · {d.name}
      </div>
    </Card>
  )
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-background px-2.5 py-0.5 font-mono text-meta text-muted-foreground">
      {children}
    </span>
  )
}

function Hud({ stats, run, session }: { stats: DrillStats; run: number; session: { right: number; total: number } }) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayN = stats.today?.date === todayKey ? stats.today.n : 0
  const total = (stats.byKind?.compute?.total ?? 0) + (stats.byKind?.verdict?.total ?? 0)
  const right = (stats.byKind?.compute?.right ?? 0) + (stats.byKind?.verdict?.right ?? 0)
  return (
    <CardGrid min="sm" gap="gap-2.5" className="my-1 mb-4.5">
      <HudCard k="today">
        <div className={cn('hud-v', todayN >= DAILY_GOAL && 'text-good')}>
          {todayN}<span className="text-label text-muted-foreground/70">/{DAILY_GOAL}</span>
        </div>
        <Progress className="mt-1.5" value={Math.min(100, todayN / DAILY_GOAL * 100)} barClassName="bg-good bg-none" />
      </HudCard>
      <HudCard k="streak">
        <div className={cn('hud-v', run >= 5 && 'text-warn')}>{run >= 3 ? '🔥 ' : ''}{run}</div>
        <div className="text-label text-muted-foreground/70">best {stats.bestRun ?? 0}</div>
      </HudCard>
      <HudCard k="session">
        <div className="hud-v">{session.right}<span className="text-label text-muted-foreground/70">/{session.total}</span></div>
      </HudCard>
      <HudCard k="all-time">
        <div className="hud-v">{total ? Math.round(right / total * 100) + '%' : '—'}</div>
        <div className="text-label text-muted-foreground/70">{total} answered</div>
      </HudCard>
    </CardGrid>
  )
}

function HudCard({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card px-3.5 py-2.5 [&_.hud-v]:font-mono [&_.hud-v]:text-[21px] [&_.hud-v]:font-semibold [&_.hud-v]:tabular-nums">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">{k}</div>
      {children}
    </div>
  )
}

function FamilyChips({ families, family, setFamily, stats }: {
  families: string[]
  family: string
  setFamily: (f: string) => void
  stats: DrillStats
}) {
  const accCls = (pct: number) => (pct >= 85 ? 'text-good' : pct >= 60 ? 'text-warn' : 'text-destructive')
  const chip = (sel: boolean) =>
    cn(
      'cursor-pointer rounded-full border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary',
      sel && 'border-primary bg-primary/10 text-foreground'
    )
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      <button className={chip(family === 'all')} onClick={() => setFamily('all')}>
        all
      </button>
      {families.map(f => {
        const pct = accuracy(stats.byFamily?.[f])
        return (
          <button key={f} className={chip(family === f)} onClick={() => setFamily(f)}>
            {f}{pct !== null && <span className={cn('ml-1.5 font-bold', accCls(pct))}>{pct}%</span>}
          </button>
        )
      })}
    </div>
  )
}

function Feedback({ right, children }: { right: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'my-3 rounded-lg border px-4.5 py-3.5 [&_p]:mb-2 [&_p]:text-note',
        right
          ? 'animate-pop-good border-good/40 bg-good/10'
          : 'animate-shake-bad border-destructive/40 bg-destructive/10'
      )}
    >
      <div className={cn('mb-1 text-[13px] font-extrabold uppercase tracking-[0.08em]', right ? 'text-good' : 'text-destructive')}>
        {children}
      </div>
    </div>
  )
}

export default function M10() {
  const [tab, setTab] = useState<DrillKind>('compute')
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
  const [graded, setGraded] = useState<boolean | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => { setIdx(Math.floor(Math.random() * Math.max(1, pool.length))) }, [pool])

  const d = pool.length ? pool[idx % pool.length] : null

  const score = (right: boolean) => {
    if (!d) return
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
    if (!d) return
    const got = parseFloat(guess.replace(/[$,\s]/g, ''))
    const right = Number.isFinite(got) && Math.abs(got - d.requirement) <= 0.01
    setGraded(right)
    score(right)
  }

  const pick = (key: string) => {
    if (picked !== null || !d) return
    setPicked(key)
    score(key === d.outcome)
  }

  const resetForTab = (t: DrillKind) => {
    setTab(t); setGuess(''); setGraded(null); setPicked(null)
  }

  // keyboard: 1-6 pick verdicts; Enter/n advances after feedback
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT') return
      if (tab === 'verdict' && picked === null && /^[1-6]$/.test(e.key)) {
        pick(VERDICTS[parseInt(e.key, 10) - 1][0])
      } else if ((e.key === 'Enter' || e.key === 'n') && (picked !== null || graded !== null)) {
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const scoreLine = (kind: DrillKind) => {
    const v = stats.byKind?.[kind]
    return v?.total ? `${v.right}/${v.total} · ${Math.round(v.right / v.total * 100)}%` : 'no attempts yet'
  }

  if (!d) return <p>No drills in this family.</p>

  const correctVerdict = picked !== null ? VERDICTS.find(v => v[0] === d.outcome) : undefined

  return (
    <>
      <Hud stats={stats} run={run} session={session} />

      <div className="mb-4 flex gap-2">
        {([['compute', 'Compute the number'], ['verdict', 'Name the verdict']] as Array<[DrillKind, string]>).map(([key, label]) => (
          <button
            key={key}
            onClick={() => resetForTab(key)}
            className={cn(
              'max-w-[290px] flex-1 cursor-pointer rounded-lg border bg-card px-4 py-2.5 text-left transition-colors hover:border-input',
              tab === key && 'border-primary bg-primary/10'
            )}
          >
            <span className="block text-sm font-semibold text-foreground">{label}</span>
            <span className="mt-0.5 block font-mono text-meta tabular-nums text-muted-foreground">{scoreLine(key)}</span>
          </button>
        ))}
      </div>

      <FamilyChips families={families} family={family} setFamily={setFamily} stats={stats} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant={showChart ? 'default' : 'secondary'} onClick={() => setShowChart(s => !s)}>
          {showChart ? 'payoff: on' : 'payoff: off'}
        </Button>
        <span className="font-mono text-meta text-muted-foreground/70">
          {tab === 'verdict' ? 'keys 1–6 answer · enter next' : 'enter checks · enter again for next'}
        </span>
      </div>

      <section className="mt-1">
        <PositionCard d={d} showChart={showChart && tab === 'compute'} />

        {tab === 'compute' ? (
          <>
            <div className="my-4 mb-1.5 flex flex-wrap items-end gap-2.5">
              <label className="grid flex-1 gap-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Gross requirement ($)
                </span>
                <Input
                  value={guess}
                  autoFocus
                  onChange={e => setGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (graded === null ? guess.trim() && grade() : next())}
                  placeholder="your number"
                  inputMode="decimal"
                  className="min-w-[220px]"
                />
              </label>
              {graded === null
                ? <Button size="default" className="px-5 font-semibold" onClick={grade} disabled={!guess.trim()}>check</Button>
                : <Button size="default" variant="default" className="px-5" onClick={next}>next →</Button>}
            </div>
            {graded !== null && (
              <>
                <Feedback right={graded}>{graded ? `Correct${run >= 3 ? ` — ${run} in a row` : ''}` : 'Not quite'}</Feedback>
                <div className="-mt-2 mb-3 rounded-b-lg px-1 text-note">
                  <p className="mb-2">
                    Rule <b>{d.rule}</b>: requirement <b>${fmt(d.requirement)}</b>, proceeds ${fmt(d.proceeds)},
                    cash call ${fmt(d.cashCall)}.
                    {d.depositKind ? <> Deposit: <b>{d.depositKind}</b>.</> : null}
                  </p>
                  {!graded && (
                    <div className="font-mono text-xs text-muted-foreground">
                      streak reset — best is still <b className="text-warn">{stats.bestRun}</b>
                    </div>
                  )}
                </div>
              </>
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
            <CardGrid min="md" gap="gap-2" className="my-3.5">
              {VERDICTS.map(([key, label], i) => {
                const state =
                  picked === null ? '' :
                  key === d.outcome ? 'border-good bg-good/10' :
                  key === picked ? 'border-destructive bg-destructive/10' :
                  'opacity-40'
                return (
                  <button
                    key={key}
                    onClick={() => pick(key)}
                    className={cn(
                      'relative cursor-pointer rounded-lg border border-input bg-secondary py-2.5 pl-9 pr-3.5 text-left text-sm font-medium transition-colors hover:border-primary',
                      state
                    )}
                  >
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded border border-input px-1.5 font-mono text-[10px] text-muted-foreground/70">
                      {i + 1}
                    </span>
                    {label}
                  </button>
                )
              })}
            </CardGrid>
            {picked !== null && correctVerdict && (
              <>
                <Feedback right={picked === d.outcome}>
                  {picked === d.outcome ? `Correct${run >= 3 ? ` — ${run} in a row` : ''}` : 'Wrong bucket'}
                </Feedback>
                <div className="-mt-2 mb-3 px-1 text-note">
                  <p className="mb-2">
                    This is <b>{correctVerdict[1]}</b>: {correctVerdict[2]}.
                    {d.rule ? <> Rule: <b>{d.rule}</b>.</> : null}
                    {d.errContains ? <> Error mentions <i>“{d.errContains.join('”, “')}”</i>.</> : null}
                  </p>
                  <Button variant="default" size="default" onClick={next}>next →</Button>
                </div>
              </>
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
