import { Callout, Reveal } from '@/components/shared'
import { cn } from '@/lib/utils'

// Status: built | partial | missing | host (host-owned BY DESIGN, not a gap)
type Status = 'built' | 'partial' | 'missing' | 'host'

interface PlaneItem {
  s: Status
  name: string
  does: string
  future: string
}

interface PlaneDef {
  title: string
  items: PlaneItem[]
}

const PLANES: PlaneDef[] = [
  {
    title: 'Plane 1 — Calculation kernel (the math)',
    items: [
      {
        s: 'built', name: 'Strategy rule engine',
        does: 'CEL/YAML first-match rules, slot binding, requires guards, rates table. 22 rule families covering the core Cboe manual.',
        future: 'Same architecture, ~45 families: FLEX options, more index settlement nuances, full warrant/convertible coverage (yours are draft).',
      },
      {
        s: 'partial', name: 'Decomposition optimizer (B&B)',
        does: 'Partitions an account’s legs into the cheapest compliant strategy set; residual sinks for unpaired legs.',
        future: '<b>Left:</b> node-budget rework (ROADMAP #20), the decompose corpus with exhaustive-partition oracle, cross-position pooling (#09).',
      },
      {
        s: 'built', name: 'Account aggregation',
        does: 'LMV/SMV sign conventions, equity, per-account roll-up of position evaluations.',
        future: 'Stable. Grows multi-currency normalization in year 2–3.',
      },
      {
        s: 'built', name: 'House overlay + targeted overrides',
        does: 'Policy layer: add/max/floor/block, bitemporal store, order-independent composition, raise-only.',
        future: 'Stable. Grows policy-context vocabulary (risk profiles, pending cash) as real firms onboard.',
      },
      {
        s: 'missing', name: 'Risk-based margin (TIMS / portfolio margin)',
        does: 'Scenario-grid margin: shock the underlying ±15% (equities) across a grid, price every option theoretically at each point, requirement = worst node net of class-group offsets.',
        future: '<b>The biggest remaining math.</b> Needs an option pricing model + vol surfaces — a numerical problem, not rule transcription. Your roadmap already plans it as a swappable baseline under the overlay; the recon spec being methodology-agnostic was the hedge that makes this insertable.',
      },
      {
        s: 'missing', name: 'SPAN / futures margin',
        does: 'Exchange-mandated scenario margin for futures & options-on-futures.',
        future: 'Only if the product needs futures. Distinct enough that many shops buy it rather than build.',
      },
    ],
  },
  {
    title: 'Plane 2 — Verification (how you know it’s right)',
    items: [
      {
        s: 'built', name: 'Manual-pinned fixture oracle',
        does: 'Test<Strategy>_p<page> — every rule pinned to a worked Cboe/FINRA number, all three Result fields.',
        future: 'Grows with each new rule family. Pattern is set.',
      },
      {
        s: 'built', name: 'Verification corpus + mutation testing',
        does: '1000-case parameter-grid corpus, oracle-derived; 213/213 non-equivalent mutants killed; found 5 real under-margining classes.',
        future: 'Per-PR corpus in CI (test/corpus), decompose corpus for the optimizer. <b>You are ~2 years ahead of a typical build here</b> — most shops never do this.',
      },
      {
        s: 'host', name: 'Vendor reconciliation',
        does: 'Normative spec (verdicts, tolerance, buckets, fail-loud guards); the bridge implements it against the vendor’s EOD house calls.',
        future: 'TIMS era adds tolerance-banded compare (theoretical prices never match exactly) — spec already anticipates methodology-agnostic compare.',
      },
      {
        s: 'built', name: 'Audit, trace & replay',
        does: 'Content-addressed everything (rulebook SHA, expr IDs, trace IDs), pure engine, byte-identical replay, bitemporal seals.',
        future: 'Trace-schema v2 (ROADMAP #21). Architecture is done.',
      },
    ],
  },
  {
    title: 'Plane 3 — Data plane (what feeds it)',
    items: [
      {
        s: 'host', name: 'Security master / reference data',
        does: 'class, lev, tracks_index, multipliers, instrument kinds — host passes hydrated snapshots; SDK validates sufficiency.',
        future: 'Year 2–3 of a full build: vendor feeds (exchange files, OCC), symbology mapping, daily refresh — the plumbing vendor pipelines keep failing at.',
      },
      {
        s: 'missing', name: 'Corporate actions',
        does: 'Splits, special dividends, mergers → non-standard deliverables (a “100-share” contract becomes 153 shares + cash).',
        future: '<b>The silent killer of production margin systems.</b> Today legs arrive pre-adjusted; a full build needs adjusted-contract awareness end to end (mult, K_equivalent, coverage arithmetic).',
      },
      {
        s: 'host', name: 'Market data',
        does: 'U comes in on the position; prices are the host’s problem.',
        future: 'TIMS adds the hard dependency: vol surfaces per underlying. That is a data subscription + fitting pipeline, not a YAML rule.',
      },
    ],
  },
  {
    title: 'Plane 4 — Real-time & pre-trade',
    items: [
      {
        s: 'missing', name: 'Pre-trade check / what-if',
        does: '“If this order fills, what’s the new requirement and remaining buying power?” — the product brokers actually sell.',
        future: 'The engine is already fast enough (~120µs/eval, 8k/sec/core). The work is order→projected-position plumbing and a BP ledger, not math. Natural SDK consumer #2 after the bridge.',
      },
      {
        s: 'missing', name: 'Intraday streaming re-evaluation',
        does: 'Re-margin accounts on price ticks; threshold alerting before calls trigger.',
        future: 'Host-buildable on the SDK today (stateless evals parallelize trivially). Incremental/dirty-marking only matters at very large account counts.',
      },
    ],
  },
  {
    title: 'Plane 5 — Account state & lifecycle (the bookkeeping)',
    items: [
      {
        s: 'missing', name: 'SMA / buying-power ledger',
        does: 'The Reg-T Special Memorandum Account: a day-over-day state machine of credits/debits that determines buying power. The manual’s “SMA debit $40” on p.42 lives here.',
        future: 'A <b>stateful ledger</b>, not a pure function — different discipline from everything built so far. limen computes requirements; SMA tracks what the customer may do with them. Host-side, on top of CashCall.',
      },
      {
        s: 'missing', name: 'Margin-call lifecycle',
        does: 'Issue calls (Fed / maintenance / day-trade types), due dates (T+5), meet/extend/liquidate workflow, notifications.',
        future: 'Pure workflow engineering; host-owned. limen’s CashCall is the input event.',
      },
      {
        s: 'missing', name: 'Intraday margin standards & cash-account violations',
        does: 'The regime that REPLACED PDT (FINRA 26-10, eff. June 2026): day-trading buying power from real-time intraday margin excess. Plus good-faith violations, free-riding, 90-day restrictions.',
        future: 'The PDT elimination turns intraday evaluation from product nicety into the regulatory basis for day-trading BP — it merges this box with the intraday-streaming box. The repo’s pdt_min_equity_usd constant is now dead regulation.',
      },
    ],
  },
  {
    title: 'Plane 6 — Integration & ops',
    items: [
      {
        s: 'built', name: 'SDK + Mongo adapters + migrate',
        does: 'pkg/limen facade, narrow interfaces, pkg/limenmongo, index contract via cmd/migrate.',
        future: 'Done as designed; #227 made it the sole surface.',
      },
      {
        s: 'partial', name: 'Bridge service',
        does: 'Separate service: pulls positions/balances, embeds pkg/limen, implements the recon spec against the vendor’s house calls.',
        future: 'In progress, gated on your corpus/internal testing. First production proof of the whole stack.',
      },
      {
        s: 'missing', name: 'Margin ops UI / dashboards',
        does: 'Recon triage screens, override management, call queues for a margin desk.',
        future: 'Year 3 of a full build; host/product territory. (Your score dashboard is the dev-loop analog.)',
      },
    ],
  },
]

const STATUS: Record<Status, { edge: string; chip: string; label: string }> = {
  built: { edge: 'border-l-good', chip: 'bg-good/12 text-good', label: 'built' },
  partial: { edge: 'border-l-warn', chip: 'bg-warn/12 text-warn', label: 'partial' },
  missing: { edge: 'border-l-muted-foreground/50 opacity-90', chip: 'bg-muted-foreground/15 text-muted-foreground', label: 'missing' },
  host: { edge: 'border-l-primary', chip: 'bg-primary/12 text-primary', label: 'host-owned' },
}

function Plane({ p }: { p: PlaneDef }) {
  const score = (it: PlaneItem) => (it.s === 'built' || it.s === 'host') ? 1 : it.s === 'partial' ? 0.5 : 0
  const pct = Math.round(p.items.reduce((s, it) => s + score(it), 0) / p.items.length * 100)
  return (
    <div className="my-4.5 mb-7">
      <div className="mb-2.5 flex items-baseline gap-3.5">
        <h4 className="!m-0 text-[15px]">{p.title}</h4>
        <div className="h-[5px] max-w-[200px] flex-1 overflow-hidden rounded-sm bg-secondary">
          <div className="h-full bg-gradient-to-r from-primary to-good" style={{ width: pct + '%' }} />
        </div>
        <span className="font-mono text-[11.5px] tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-2.5">
        {p.items.map(it => (
          <div
            key={it.name}
            className={cn(
              'rounded-lg border border-l-[3px] bg-card px-4 py-3 transition-all hover:-translate-y-px hover:border-input',
              STATUS[it.s].edge
            )}
          >
            <div className="flex items-baseline justify-between gap-2 text-[13.5px] font-semibold">
              {it.name}
              <span className={cn('whitespace-nowrap rounded-full px-2 py-px font-mono text-[9.5px] uppercase tracking-[0.06em]', STATUS[it.s].chip)}>
                {STATUS[it.s].label}
              </span>
            </div>
            <div className="mt-1 text-xs leading-normal text-muted-foreground">{it.does}</div>
            <div
              className="mt-1.5 text-[11.5px] leading-normal text-warn/70 [&_b]:font-semibold [&_b]:text-warn"
              dangerouslySetInnerHTML={{ __html: it.future }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function M11() {
  return (
    <>
      <p>
        This is the full territory: what a production margin platform looks like after ~3 years
        of continuous work, with every subsystem colored by where <em>yours</em> stands today.
        Green is built, amber is built-but-open-work, gray is not started, and blue is{' '}
        <strong>host-owned by design</strong> — a boundary you deliberately drew (go-sdk-facade,
        #227), not a gap. The yellow line in each card is what the finished form looks like.
      </p>
      <div className="my-2.5 mb-1.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><span className="text-good">■</span> built</span>
        <span><span className="text-warn">■</span> partial — open work</span>
        <span><span className="text-muted-foreground/60">■</span> not started</span>
        <span><span className="text-primary">■</span> host-owned by design</span>
      </div>

      {PLANES.map(p => <Plane key={p.title} p={p} />)}

      <h3>Corrections — you asked, so here they are</h3>
      <p>
        <strong>“Weird tech stack (CEL)” — wrong, and worth unlearning.</strong> Rules-as-data is
        the <em>institutional</em> pattern for margin systems, not the weird one. The weird stacks
        are what actually runs at most clearing firms: decades-old hardcoded rule logic in
        Java/COBOL that no one can audit, diff, or hot-reload. Your stack gives you things they
        can't have: rules a non-programmer can read against the manual page, content-addressable
        rulebooks (your whole replay/recon story depends on this — it falls out of rules-as-data
        for free), side-effect-free evaluation, and rule changes that are data deploys, not code
        releases. The one honest cost: smaller talent pool and fewer worked examples than, say,
        a Java rules engine. You paid that cost knowingly and got determinism for it.
      </p>
      <p>
        <strong>“Very small portion” — wrong dimension.</strong> By subsystem count you're at
        roughly a third. But subsystems aren't equal: you built the two that decide whether the
        project lives — the <em>calculation kernel</em> and the <em>verification apparatus</em> —
        and those are precisely the ones that can't be retrofitted. A typical real-world 3-year
        build does it backwards: workflow and UI first, math second, verification never (which
        is why vendors disagree with each other and nobody can prove who's right). Everything
        gray on this map is either well-understood engineering (workflow, ledgers, plumbing) or
        a bounded numerical problem (TIMS). None of it is research. The risk is behind you.
      </p>
      <p>
        <strong>One real correction in the other direction:</strong> the remaining work is not
        “more of the same,” and you should know where the discipline changes. TIMS is a{' '}
        <em>numerical</em> problem — theoretical pricing under scenario grids, vol-surface
        dependencies, tolerance-banded recon instead of exact-match — your first subsystem where
        the right answer isn't a citable manual page. And the SMA/buying-power ledger is{' '}
        <em>stateful accounting</em> — a day-over-day state machine, the first thing you'd build
        that isn't a pure function. Your engine discipline (determinism, content addressing)
        transfers; your oracle discipline needs new oracle types (brute-force pricers,
        property-based invariants, vendor tolerance bands). Plan for that shift, not just the
        volume.
      </p>

      <Callout kind="tip">
        <p>
          <strong>The honest scoreboard:</strong> ~⅓ of the territory by area, but the
          load-bearing third — kernel correct, verification ahead of industry practice,
          boundaries drawn so every gray box has a designed seam to plug into (TIMS under the
          overlay, pre-trade on the SDK, SMA on top of CashCall, corp actions in refdata). A
          “3-year build” usually means 3 years to <em>this point</em>. You're standing at month
          ~2 of wall-clock time. The map is big; your position on it is not small.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="Why does TIMS slot under the overlay rather than replacing the engine?">
        <p>The overlay/override layer is methodology-agnostic policy on top of <em>some</em>{' '}
          baseline. Strategy-based and risk-based margin are alternative baselines producing the
          same shape (a requirement per account); house policy applies identically over either.
          That's why the recon spec was written methodology-agnostic — the comparison semantics
          survive the baseline swap.</p>
      </Reveal>
      <Reveal q="Why is pre-trade check 'plumbing, not math' for you specifically?">
        <p>Pre-trade = evaluate(current positions + hypothetical fill) − evaluate(current).
          Your engine does a full evaluation in ~120µs with no I/O, so the latency budget is
          already met. What's missing is order→projected-position translation and a
          buying-power ledger to compare against — host-side state, not engine capability.</p>
      </Reveal>
      <Reveal q="Which gray box would you build first, and why?">
        <p>Defensible answer: none yet — finish the amber ones (decompose corpus, node budget,
          bridge through internal testing) because they de-risk what's already shipped. First
          gray box after that: pre-trade what-if, because it's the highest product value per
          unit of new risk (reuses the proven kernel, adds no new math). TIMS is the biggest
          prize but the most new discipline; it earns a dedicated epic with its own oracle
          design first.</p>
      </Reveal>
    </>
  )
}
