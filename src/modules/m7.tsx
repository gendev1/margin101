import { Callout, Panel, Reveal } from '../components/ui.jsx'

export default function M7() {
  return (
    <>
      <p>
        ~60 hours: weekend now (2 days), weeknights (~10h), long weekend Jun 19–21 (3 days).
        The plan optimizes for one outcome: <strong>by Jun 21 you can hand-compute any position
        in the rulebook and defend a margin design decision from first principles.</strong>{' '}
        Passive reading is capped on purpose — every block ends with you producing numbers.
      </p>

      <h3>Weekend 1 — the atoms (≈16h)</h3>
      <Panel title="Day 1: the language → single-leg pricing">
        <ul>
          <li><b>2h</b> — M0 + M1 slowly. Draw the four atom payoffs from memory until you can.</li>
          <li><b>2h</b> — M2 through the naked-short formula. Use the calculator: find a (U, K) where the binding branch flips. Know <em>why</em> it flips.</li>
          <li><b>3h</b> — Hand-compute all four manual examples (p28×2, p32×2) on paper, then check against the tests in <code>rulebook_test.go</code>.</li>
          <li><b>1h</b> — Drill set A below, cold.</li>
        </ul>
      </Panel>
      <Panel title="Day 2: spreads & stock hedges">
        <ul>
          <li><b>3h</b> — M3. Hand-work p.42 and p.39 verticals; explain gross vs proceeds vs cash to a rubber duck. Then the reverse-calendar table until the timeline picture is automatic.</li>
          <li><b>3h</b> — M4. Hand-work p.47, p.58, p.61. For each: which guard protects this rule, and what bug fires if it's removed?</li>
          <li><b>2h</b> — Drill set B. Wrong answers → reread only that section.</li>
        </ul>
      </Panel>

      <h3>Weeknights — make it stick (≈10h, 2h × 5)</h3>
      <ul>
        <li><b>N1</b> — M5. Ratio lab until you can sketch the zoomed-out picture unprompted. Tail-walk 5 structures you invent.</li>
        <li><b>N2</b> — Butterfly p.52 + iron butterfly p.56 by hand: tail check → MPL scan → gross/proceeds/cash.</li>
        <li><b>N3</b> — Read <code>cboe_baseline.yaml</code> top to bottom. For every <code>max(0, …)</code>, say aloud whether it's an intrinsic, an OTM credit, or a floor.</li>
        <li><b>N4</b> — Pick 5 <code>_p&lt;page&gt;</code> tests you haven't seen; predict all three numbers before reading assertions. Target ≥ 4/5.</li>
        <li><b>N5</b> — Drill sets A+B cold, plus set C. Anything shaky goes on a note for the weekend.</li>
      </ul>

      <h3>Long weekend Jun 19–21 — the engine + proficiency proof (≈24h)</h3>
      <ul>
        <li><b>Day 1</b> — M6 with the repo open: trace one position through Evaluate end-to-end; read <code>env.go</code>'s <code>mpl</code> / <code>is_limited_risk</code> and connect each line to <a href="#m5">limited risk</a>. Then the recon spec.</li>
        <li><b>Day 2</b> — Cboe manual itself (pp. 25–62), now that it's readable. Cross-check 3 pages against the YAML looking for anything the rulebook treats differently — write down what you find. Then <a href="#m8">your margin-semantics decisions</a> with the ADRs open beside it.</li>
        <li><b>Day 3</b> — <a href="#m9">Your system decisions</a>, then the proficiency proof below.</li>
      </ul>

      <Callout kind="tip">
        <p>
          <strong>Proficiency proof (3–4h):</strong> write a one-page doc, from memory, for a
          teammate: the three Result numbers, the naked-short formula with its two branches, MPL
          and the two conditions that make it sound, why coverage guards exist, and the verdict
          taxonomy. If you can write that page without looking anything up, you can hold your
          own in any decision fork this project will produce. Then test it for real: take one
          open corpus finding and write the rule-level fix proposal yourself before reading
          anyone else's.
        </p>
      </Callout>

      <h3>Drill set A — single legs</h3>
      <Reveal q="A1. Short 1× 50P @ $1.20, U=54, equity. Requirement?">
        <p>basic = 10.80 − 4 = 6.80; min = 5 → basic. (1.20 + 6.80) × 100 = <b>$800</b>.</p>
      </Reveal>
      <Reveal q="A2. Short 1× 45C @ $6, U=50, equity. Requirement?">
        <p>ITM, no OTM credit. basic = 10; min = 5 → basic. (6 + 10) × 100 = <b>$1,600</b>.</p>
      </Reveal>
      <Reveal q="A3. Short 1× 60C @ $0.50, U=50. Which branch and requirement?">
        <p>basic = 10 − 10 = 0; min = 0.10 × 50 = 5 → floor binds. (0.50 + 5) × 100 = <b>$550</b>.</p>
      </Reveal>
      <Reveal q="A4. Short 100 sh @ $12, proceeds $1,200. Initial, and maintenance at U=12?">
        <p>Initial = 1200 + 600 = <b>$1,800</b>. Maintenance = 1200 + max(500, 360) = <b>$1,700</b>.</p>
      </Reveal>
      <Reveal q="A5. Long 1× 14-month listed call, P=$11. Margin-account requirement?">
        <p>&gt;9 months listed → 75% of market value: 0.75 × 11 × 100 = <b>$825</b>.</p>
      </Reveal>

      <h3>Drill set B — two legs and hedges</h3>
      <Reveal q="B1. Long 95C @ $7 / short 90C @ $10, U=96. Gross, proceeds, cash?">
        <p>MPL = 500. Naked-90C = (10 + 19.20) × 100 = 2920. Gross = min(2920, 500) + 700 ={' '}
          <b>$1,200</b>; proceeds <b>$1,000</b>; cash <b>$200</b>.</p>
      </Reveal>
      <Reveal q="B2. Short 100P @ $3 + short 100C @ $2.50, U=100. Requirement?">
        <p>Put side 2300 vs call side 2250 → put wins, add call premium 250 → <b>$2,550</b>.</p>
      </Reveal>
      <Reveal q="B3. 200 sh @ $40 + short 2× 35C. Initial and maintenance?">
        <p>Initial 0.50 × 40 × 200 = <b>$4,000</b>; maintenance 0.25 × min(40,35) × 200 = <b>$1,750</b>.</p>
      </Reveal>
      <Reveal q="B4. 100 sh, U=80 + long 85P. Maintenance?">
        <p>Put ITM → OTM amount 0. min(850, 2000) = <b>$850</b>.</p>
      </Reveal>
      <Reveal q="B5. Short Jan 100C + long Mar 100C — legal? And swapped?">
        <p>Legal calendar (short dies first) → prices as a spread. Swapped → reverse calendar →
          refused; after Jan the naked Mar short would invalidate the MPL bound.</p>
      </Reveal>

      <h3>Drill set C — boundedness and the engine</h3>
      <Reveal q="C1. Long 2× 100C + short 3× 110C: limited risk?">
        <p>U→∞ net calls = −1 → unbounded → <b>no</b>; guard rejects, decomposition splits it.</p>
      </Reveal>
      <Reveal q="C2. Iron condor 90/95P + 105/110C. MPL?">
        <p>Bounded both tails; worst at one wing fully ITM: 5 × 100 = <b>$500</b>.</p>
      </Reveal>
      <Reveal q="C3. Covered-call rule with 250 sh against 3 calls — what fires?">
        <p><code>min_fields</code> coverage guard (need 300). No covered-call binding; never
          price 3-as-covered.</p>
      </Reveal>
      <Reveal q="C4. class='equityy' (typo) reaches rate(). What happens and why is that correct?">
        <p>Hard error on the missing rates key. A zero fallback would produce near-zero margin
          on a naked short — silently. Loud beats wrong.</p>
      </Reveal>
      <Reveal q="C5. Why does the European box margin at 50% of the strike gap while the American box uses MPL?">
        <p>European: no early assignment → payoff is locked, the position is a synthetic loan,
          and it gets loan-value treatment. American: early assignment can break the lock before
          expiry → fall back to worst-case machinery. Exercise style is a risk parameter.</p>
      </Reveal>

      <h3>References</h3>
      <ul>
        <li>Cboe Margin Manual (2021-11-30) — the rulebook's source; pages are pinned in test names.</li>
        <li>FINRA Rule 4210 — maintenance requirements; the short-stock tiers live here.</li>
        <li><code>rules/cboe_baseline.yaml</code> — every formula in this course, executable.</li>
        <li><code>internal/engine/rulebook_test.go</code> — the answer key.</li>
        <li><code>docs/architecture/recon-oracle-spec.md</code> — how correctness is checked in production.</li>
      </ul>
    </>
  )
}
