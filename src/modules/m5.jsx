import PayoffChart from '../components/PayoffChart.jsx'
import { RatioLab } from '../components/labs.jsx'
import { Callout, Formula, Reveal, RuleRef } from '../components/ui.jsx'

export default function M5() {
  return (
    <>
      <p>
        Beyond two legs live the butterflies, condors, boxes, and everything a customer can
        dream up. The rulebook can't enumerate them all, so it ends with a catch-all:{' '}
        <code>generic_limited_risk_combo</code> — margin = maximum potential loss, for any
        all-options structure that is <em>provably bounded</em>. The two halves of that sentence
        are this module.
      </p>

      <h3>mpl(legs) — how “worst case” is actually computed</h3>
      <Formula>{`evaluate intrinsic payoff at: U = 0, every strike, U → ∞
mpl = the worst (most negative) of those points`}</Formula>
      <p>
        Why is checking only the strikes enough? Between strikes, an options payoff is a
        straight line — kinks happen only <em>at</em> strikes. A piecewise-linear function takes
        its minimum at a kink or at the ends. So: all strikes, plus both tails. Cheap,
        exact — <strong>provided the tails behave</strong>.
      </p>

      <h3>The killer counterexample — why is_limited_risk exists</h3>
      <RuleRef rule="generic_limited_risk_combo (the is_limited_risk guard)" />
      <RatioLab />
      <p>
        Click between those two buttons until it's burned in. The ratio spread (long 1 call,
        short 2 higher calls) evaluated at its own strikes looks bounded — and is unbounded one
        dollar past the chart edge. <strong>“Evaluate at the strikes” is only sound when the
        tails are flat or rising.</strong> So the guard checks the tails first:
      </p>
      <Formula>{`U → ∞ : net call exposure (long calls − short calls, in shares) must be ≥ 0
U → 0 : net put exposure must be ≥ 0
time  : no short may outlive the longs of its own type (the reverse-calendar trap)`}</Formula>
      <p>
        Fail any of these and the position falls out of the catch-all entirely — NoRule, not a
        number. An unbounded structure reaching <code>mpl()</code> would get a confidently wrong
        bounded answer; refusing to answer is the safe failure mode. This guard is, by a wide
        margin, the most load-bearing three lines in the rulebook.
      </p>

      <h3>The butterfly, fully worked (manual p.52)</h3>
      <RuleRef rule="generic_limited_risk_combo" test="TestLongButterflyPuts_p52" page="p.52" />
      <PayoffChart
        legs={[
          { kind: 'put', side: 1, K: 540, P: 5.6 },
          { kind: 'put', side: -1, K: 550, P: 7.2, qty: 2 },
          { kind: 'put', side: 1, K: 555, P: 9.8 },
        ]}
        lo={520} hi={575}
        title="Long 540P / short 2× 550P / long 555P — bounded everywhere" />
      <p>
        Tail check: puts net out (1 + 1 long vs 2 short → 0 net at U→0 ✓), no calls ✓. MPL scan
        over {'{'}0, 540, 550, 555, ∞{'}'} finds the worst point at U=540: shorts owe $2,000,
        the 555 put recovers $1,500, net −$500. Then the familiar assembly:
      </p>
      <Formula>{`gross    = mpl + Σ long premiums  = 500 + (560 + 980)  = $2,040
proceeds = Σ short premiums       = 2 × 720           = $1,440
cash     =                                              $  600`}</Formula>
      <p>
        Same shape for iron butterflies and condors (<code>TestShortIronButterfly_p56</code>:
        gross $810 / proceeds $720 / cash $90). One formula, every bounded combo — that's the
        payoff for proving boundedness up front.
      </p>

      <h3>Boxes — when a position is a loan wearing a costume</h3>
      <RuleRef rule="long_box_spread / short_box_spread" />
      <p>
        A <strong>long box</strong> = bull call spread + bear put spread at the same two strikes.
        At expiry it pays exactly (K_high − K_low) × 100, no matter where U lands — you've
        synthetically lent money. European boxes (no early exercise risk) get loan-value
        treatment: requirement = 50% of the strike gap. American boxes can be assigned early,
        so they fall back to the MPL machinery. One YAML conditional on{' '}
        <code>style == 'european'</code> — and a reminder that <em>exercise style is a risk
        parameter</em>, not trivia.
      </p>

      <h3>Rule order is load-bearing</h3>
      <Callout kind="warn">
        <p>
          The engine returns the <strong>first</strong> rule whose match binds and whose
          constraints hold. The catch-all matches <em>any</em> 3–8 leg all-options position, so
          every specific rule must sit <strong>above</strong> it in the YAML. Move the box rule
          below the catch-all and boxes silently price as generic combos — possibly correctly
          today, until the box-specific European branch matters and nobody notices it stopped
          firing. In limen, file order in <code>cboe_baseline.yaml</code> is semantics, which is
          why tests assert <code>res.RuleID</code> and not just the number.
        </p>
      </Callout>

      <h3>What a ratio spread does next — the optimizer's frontier</h3>
      <p>
        The guard refuses the ratio spread <em>as one structure</em>. The position still needs a
        price, and pricing it is the decomposition optimizer's job — the amber box on the map
        with the most interesting open work:
      </p>
      <ul>
        <li><strong>The search.</strong> Long 1× 100C + short 2× 110C decomposes into a vertical
          (bounded, MPL-priced) plus one naked 110C (priced by the stress formula). The optimizer's
          branch-and-bound explores partitions like this and keeps the cheapest <em>compliant</em>{' '}
          one — the customer is entitled to the best legal interpretation, and “legal” is enforced
          because every candidate group is priced by the same rule engine with the same guards.</li>
        <li><strong>The node budget (ROADMAP #20).</strong> Partition count explodes
          combinatorially, so the search carries a budget. Today's open defect class: a{' '}
          <em>bigger</em> budget can produce a <em>worse</em> answer — the traversal order means
          extra nodes can displace better ones. Budget-monotonicity (more search never hurts) is
          the property the rework must restore, and it's a property test, not a fixture.</li>
        <li><strong>The decompose corpus.</strong> Your pricing corpus verified the formula layer;
          the optimizer's search layer is still uncovered. The designed oracle: on portfolios of
          ≤8 legs, <em>enumerate every partition exhaustively</em> and assert B&amp;B finds the
          same optimum. Small enough to brute-force, real enough to catch search bugs — the same
          oracle-class discipline as the manual fixtures, applied to a search problem.</li>
        <li><strong>Cross-position pooling (ROADMAP #09).</strong> Today each submitted position
          is its own search bucket (your locked wire-l05 D2: caller's grouping is authoritative).
          The universal-spread-rule epic would let legs pool across positions — a different{' '}
          <em>number</em>, not just a different speed, which is why it's a separate epic and not a
          flag.</li>
      </ul>
      <Callout kind="tip">
        <p>
          Note what kind of work this is: no new margin math anywhere — the formulas are all
          the mechanics modules. The optimizer's discipline is <strong>search soundness</strong>: never
          miss a cheaper legal partition, never accept an illegal one, degrade predictably under
          budget. When you review optimizer PRs, you're reviewing a search algorithm, and the
          questions are coverage and monotonicity, not Cboe citations.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="Tail-walk: long 2× 100C, short 3× 110C. Limited risk?">
        <p>U→∞: net call exposure = 2 − 3 = −1 contract → one naked call survives the hedge →
          unbounded → <strong>not limited risk</strong>, guard rejects, NoRule. (At the strikes
          alone it would have looked fine — that's the trap.)</p>
      </Reveal>
      <Reveal q="Iron condor: short 95P/long 90P + short 105C/long 110C. Tails? MPL?">
        <p>Tails: puts net 0, calls net 0 → bounded ✓. Worst case: one side fully ITM through
          its long — a $5 gap × 100 = <strong>$500 MPL</strong> (both sides can't lose at one
          final price, and the scan over strike points finds that automatically).</p>
      </Reveal>
      <Reveal q="Why does the engine refuse to price a ratio spread rather than charging, say, naked margin on the extra short?">
        <p>It doesn't refuse the <em>position</em> — it refuses it as a <em>single generic
          combo</em>. Decomposition splits it into a vertical + a naked call, each priced by its
          own rule. What's forbidden is one rule pretending the whole thing has a bounded MPL.
          Right answer through decomposition, never a wrong answer through a false bound.</p>
      </Reveal>
      <Reveal q="Why is the exhaustive-partition oracle only feasible for the decompose corpus at ≤8 legs?">
        <p>The number of ways to partition n legs grows like the Bell numbers — explosively. At
          8 legs it's a few thousand partitions: brute-forceable, so the oracle is <em>complete</em>{' '}
          ground truth at that size. The bet (same as all corpus work): search bugs that exist at
          large n almost always have a small-n witness, so complete coverage at small n plus
          property tests (budget monotonicity) at large n is the practical proof.</p>
      </Reveal>
    </>
  )
}
