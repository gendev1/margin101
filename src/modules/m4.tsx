import PayoffChart from '@/components/PayoffChart'
import { Callout, Formula, Reveal, RuleRef } from '@/components/shared'

export default function M4() {
  return (
    <>
      <p>
        Stock plus options is where margin gets generous — real shares are the best hedge there
        is. But generosity is conditional on the hedge actually covering the obligation, which
        is where <strong>coverage arithmetic</strong> and the rulebook's{' '}
        <code>requires</code> guards earn their keep.
      </p>

      <h3>Coverage arithmetic — the unglamorous load-bearing check</h3>
      <Formula>{`shares_needed = qty × mult        // 3 contracts × 100 = 300 shares
guard:  legs.stock.shares >= legs.option.qty × legs.option.mult
guard:  same underlying across all legs`}</Formula>
      <p>
        One contract obligates 100 shares. Own 250 shares against 3 short calls and 50 of those
        obligations are <em>naked</em> — but a formula that prices “covered call” against all
        300 would silently under-margin. Every hedged rule in the book therefore carries a{' '}
        <code>min_fields</code> guard (shares ≥ qty × mult) and a same-underlying guard. Shares
        of the <em>wrong stock</em> cover nothing.
      </p>
      <Callout kind="warn">
        <p>
          <strong>This guard is mid-supersession.</strong> Your corpus proved “≥” is itself a
          hole: the maintenance formulas price <em>all</em> the shares against the hedge, so 250
          shares against 2 calls gets 50 extra shares the put/call valuation treatment they don't
          deserve — six pinned under-margining cases. The locked fix (corpus-remediation D1):
          exact coverage, <code>shares == qty × mult</code>, and a mispaired grouping is a typed
          refusal telling the caller to resubmit through decomposition. The B&amp;B optimizer —
          not a rule formula — is the only authority allowed to split a mixed position.
        </p>
      </Callout>

      <h3>Covered call — the canonical hedge (manual p.47)</h3>
      <RuleRef rule="covered_call" test="TestCoveredCallInitial_p47" page="p.47" />
      <PayoffChart
        legs={[
          { kind: 'stock', side: 1, basis: 92.38, shares: 100 },
          { kind: 'call', side: -1, K: 90, P: 4 },
        ]}
        lo={60} hi={125}
        title="Long 100 sh @ 92.38 + short 90C — upside surrendered above 90, downside is just stock" />
      <Formula>{`initial     = 0.50 × U × shares                   // the call needs nothing!
maintenance = 0.25 × min(U, K) × shares           // stock valued no higher than the cap`}</Formula>
      <p>
        The short call is margin-free: assignment just takes shares you already own. You margin
        the stock — with one elegant twist. For maintenance the stock is valued at{' '}
        <strong>min(U, K)</strong>: above the strike, the extra value isn't yours (you sold it),
        so it can't count as collateral either. Worked p.47: 100 sh @ 92.38, short 90 call →
        initial 0.50 × 92.38 × 100 = <strong>$4,619</strong>; maintenance
        0.25 × min(92.38, 90) × 100 = <strong>$2,250</strong>.
      </p>

      <h3>Protective put — insurance changes the floor</h3>
      <RuleRef rule="protective_put" test="TestProtectivePutMaintenance_p58" page="p.58" />
      <PayoffChart
        legs={[
          { kind: 'stock', side: 1, basis: 103.5, shares: 100 },
          { kind: 'put', side: 1, K: 95, P: 1 },
        ]}
        lo={70} hi={135}
        title="Long 100 sh @ 103.50 + long 95P — losses stop at 95" />
      <Formula>{`maintenance = min( (10% × K + OTM_put) × shares ,   // floor-based number
                   0.25 × U × shares )              // never worse than plain stock`}</Formula>
      <p>
        The put guarantees an exit at K: true downside = the gap from U to the floor, plus a 10%
        sliver of K for assignment risk. p.58 worked: U=103.50, K=95 →
        (9.50 + 8.50) × 100 = $1,800 vs plain-stock 25% = $2,587.50 →{' '}
        <strong>$1,800</strong>. Insurance lowered the requirement — and if the insurance is bad
        (K far below U), the <code>min</code> hands you back to plain stock treatment.
      </p>

      <h3>Collar — both hedges at once (manual p.61)</h3>
      <RuleRef rule="collar" test="TestCollarMaintenance_p61" page="p.61" />
      <PayoffChart
        legs={[
          { kind: 'stock', side: 1, basis: 31.75, shares: 100 },
          { kind: 'put', side: 1, K: 30, P: 0.4 },
          { kind: 'call', side: -1, K: 35, P: 0.2 },
        ]}
        lo={20} hi={45}
        title="Stock @ 31.75 + long 30P + short 35C — boxed into a band" />
      <Formula>{`maintenance = min( (10% × K_put + OTM_put) × shares ,
                   0.25 × K_call × shares )        // covered-call cap, valued at K_call`}</Formula>
      <p>
        Stock, floor below (long put), ceiling above (short call). Maintenance is the cheaper
        of its two parents: the protective-put number or the covered-call number. p.61: U=31.75,
        puts at 30, calls at 35 → min((3.00 + 1.75) × 100, 0.25 × 35 × 100) = min(475, 875)
        = <strong>$475</strong>. A boxed position is nearly riskless and the number says so.
      </p>

      <h3>Conversions — hedged to the bone</h3>
      <RuleRef rule="conversion / reverse_conversion" test="TestConversionMaintenance_p59" page="pp.59–61" />
      <p>
        A <strong>conversion</strong> is a collar with the strikes collapsed: long stock + long
        put + short call <em>at the same strike K</em>. Payoff is a flat line — outcome
        identical at every U. Maintenance: <code>10% × K × shares</code>, a token charge for
        assignment mechanics on a position with no price risk. The{' '}
        <strong>reverse conversion</strong> (short stock + long call + short put) is the mirror,
        plus the short-stock buy-in mechanics (110% of K) and the short put's ITM exposure.
        These are arbitrage-desk structures — you'll meet them in recon diffs more often than in
        retail accounts.
      </p>

      <h3>ETF-hedged index calls — coverage across instruments</h3>
      <RuleRef rule="short_index_call_long_etf" test="TestShortIndexCallLongETF_margin_p14" page="p.14" />
      <p>
        A short <em>index</em> call can be covered by shares of an ETF that tracks that index —
        if the dollar value covers the obligation (<code>shares × price ≥ U × qty × mult</code>),
        the ETF actually tracks (<code>tracks_index</code> matches), and it isn't leveraged. A 2×
        ETF does <em>not</em> hedge 1× index exposure dollar-for-dollar through time — its
        compounding drifts — so the rule refuses it outright. When you hear “stock-hedge combos
        need a class/lev guard” in corpus discussions, this family is what's being protected.
      </p>

      <h3>When contracts stop being standard — the corporate-actions frontier</h3>
      <p>
        Everything above assumed <code>mult = 100</code> and one share class. Production breaks
        both assumptions constantly, and this is the gray box on the platform map that bites
        hedged rules hardest:
      </p>
      <ul>
        <li><strong>Splits.</strong> A 2:1 split turns your 100-share contract into a 200-share one
          (or two contracts) with halved strikes. Mechanical — <em>if</em> the refdata updated. A
          hedge check against stale <code>mult</code> sees phantom over- or under-coverage.</li>
        <li><strong>Non-standard deliverables.</strong> After a merger or special dividend, one
          contract might deliver “153 shares of NEWCO plus $4.20 cash.” Now <code>qty × mult</code>{' '}
          is not even the right <em>question</em> — coverage means matching the deliverable basket.
          The engine's clean arithmetic needs an adjusted-contract representation it doesn't have
          yet (plane 3, not started).</li>
        <li><strong>Mixed multipliers.</strong> Mini options (<code>mult = 10</code>) exist today.
          One standard + one mini contract on the same underlying must never net one-for-one —
          which is exactly what the <code>same_contract_size</code> guard refuses, and why your
          corpus ran a whole mixed-multiplier family against the hedge rules.</li>
      </ul>
      <Callout kind="tip">
        <p>
          The principle that survives all three: <strong>coverage is counted in deliverables, not
          contracts.</strong> Today's engine enforces it via <code>qty × mult</code> and{' '}
          <code>same_contract_size</code>; the corporate-actions system, when it arrives, is just
          a generalization of the same check to baskets. If you remember one thing from this
          section: the day a hedge check and a deliverable disagree, the hedge check is wrong.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="200 shares @ $40, short 2 calls K=35 (ITM). Initial and maintenance?">
        <p>Coverage: 2 × 100 = 200 shares needed, have 200 ✓. Initial = 0.50 × 40 × 200 ={' '}
          <strong>$4,000</strong>. Maintenance = 0.25 × min(40, 35) × 200 = <strong>$1,750</strong> —
          the stock counts only up to the $35 cap.</p>
      </Reveal>
      <Reveal q="100 shares at U=80 plus a long 85-strike put. Maintenance?">
        <p>The put is ITM (U &lt; K): OTM amount = max(0, 80 − 85) = 0. Floor branch:
          (0.10 × 85 + 0) × 100 = $850 vs plain-stock 0.25 × 80 × 100 = $2,000 →{' '}
          <strong>$850</strong>. Deep insurance, tiny requirement.</p>
      </Reveal>
      <Reveal q="250 shares, short 3 calls, same underlying. What should the engine do, and what must it NOT do?">
        <p>Need 300 shares, have 250 → the coverage guard fails. The engine must refuse to bind
          this as a covered call (and let decomposition try 2 covered + 1 naked). It must NOT
          price all 3 calls as covered — that's silent under-margining of one naked call, the
          exact bug class coverage guards exist for.</p>
      </Reveal>
      <Reveal q="Why is exact coverage (==) replacing at-least coverage (≥)?">
        <p>Because the maintenance formulas price <em>every</em> share in the stock slot against
          the option hedge — 250 shares against 2 calls gives 50 surplus shares the hedged
          valuation they aren't entitled to (corpus pinned six under-margining cases). Exact
          coverage makes the rule price only the structure the manual actually defines; surplus
          shares go back through the optimizer to be priced as plain stock.</p>
      </Reveal>
    </>
  )
}
